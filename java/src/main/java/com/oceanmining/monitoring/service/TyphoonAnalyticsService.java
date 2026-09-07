package com.oceanmining.monitoring.service;

import com.oceanmining.monitoring.dto.response.TyphoonAreaEventDTO;
import com.oceanmining.monitoring.dto.response.TyphoonAreaEventPageDTO;
import com.oceanmining.monitoring.dto.response.TyphoonAreaReferenceDTO;
import com.oceanmining.monitoring.dto.response.TyphoonAreaSummaryDTO;
import com.oceanmining.monitoring.dto.response.TyphoonAreaSummaryStatsDTO;
import com.oceanmining.monitoring.dto.response.TyphoonRegionEventPageDTO;
import com.oceanmining.monitoring.dto.response.TyphoonTrackDTO;
import com.oceanmining.monitoring.dto.response.TyphoonTrackPointDTO;
import com.oceanmining.monitoring.dto.response.TyphoonYearlyStatDTO;
import com.oceanmining.monitoring.entity.MiningRegion;
import com.oceanmining.monitoring.exception.ResourceNotFoundException;
import com.oceanmining.monitoring.repository.MiningAreaRepository;
import com.oceanmining.monitoring.repository.MiningRegionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class TyphoonAnalyticsService {

    private static final int DEFAULT_START_YEAR = 2000;
    private static final double DEFAULT_BUFFER_KM = 300.0;
    private static final int DEFAULT_PAGE = 1;
    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 200;

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final MiningAreaRepository miningAreaRepository;
    private final MiningRegionRepository miningRegionRepository;

    @Autowired
    public TyphoonAnalyticsService(
            NamedParameterJdbcTemplate jdbcTemplate,
            MiningAreaRepository miningAreaRepository,
            MiningRegionRepository miningRegionRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.miningAreaRepository = miningAreaRepository;
        this.miningRegionRepository = miningRegionRepository;
    }

    @Cacheable(
            value = "typhoonAreaSummary",
            key = "#areaId + '|' + (#startYear == null ? 'null' : #startYear) + '|' + (#endYear == null ? 'null' : #endYear) + '|' + (#bufferKm == null ? 'null' : #bufferKm)"
    )
    public TyphoonAreaSummaryDTO getAreaSummary(String areaId, Integer startYear, Integer endYear, Double bufferKm) {
        QueryOptions options = normalizeRange(startYear, endYear, bufferKm);
        ScopeContext scope = resolveAreaScope(areaId);
        MapSqlParameterSource params = baseParams(scope.scopeId(), options);
        params.addValue("recentStartYear", Math.max(options.startYear(), options.endYear() - 9));
        params.addValue("yearSpan", options.endYear() - options.startYear() + 1);

        String sql = baseImpactCte(scope.scopeType()) + """
                , aggregated AS (
                    SELECT
                        COUNT(*) AS total_affected_typhoons,
                        COUNT(*) FILTER (WHERE season >= :recentStartYear) AS recent_10y_count,
                        ROUND(COALESCE(COUNT(*)::numeric / :yearSpan, 0), 2) AS annual_average_count,
                        ROUND(MIN(min_distance_km)::numeric, 2) AS historical_min_distance_km,
                        MAX(max_wind_near_area) AS historical_max_wind,
                        MIN(min_pres_near_area) AS historical_min_pressure
                    FROM event_impacts
                )
                SELECT
                    aggregated.total_affected_typhoons,
                    aggregated.recent_10y_count,
                    aggregated.annual_average_count,
                    aggregated.historical_min_distance_km,
                    aggregated.historical_max_wind,
                    aggregated.historical_min_pressure,
                    strongest.sid AS strongest_sid,
                    strongest.name AS strongest_name,
                    strongest.season AS strongest_season,
                    strongest.max_wind_near_area AS strongest_max_wind_near_area,
                    strongest.min_distance_km AS strongest_min_distance_km,
                    strongest.closest_time AS strongest_closest_time,
                    nearest.sid AS nearest_sid,
                    nearest.name AS nearest_name,
                    nearest.season AS nearest_season,
                    nearest.max_wind_near_area AS nearest_max_wind_near_area,
                    nearest.min_distance_km AS nearest_min_distance_km,
                    nearest.closest_time AS nearest_closest_time
                FROM aggregated
                LEFT JOIN LATERAL (
                    SELECT
                        sid,
                        name,
                        season,
                        ROUND(max_wind_near_area::numeric, 2) AS max_wind_near_area,
                        ROUND(min_distance_km::numeric, 2) AS min_distance_km,
                        closest_time
                    FROM event_impacts
                    ORDER BY max_wind_near_area DESC NULLS LAST, min_distance_km ASC, season DESC
                    LIMIT 1
                ) strongest ON TRUE
                LEFT JOIN LATERAL (
                    SELECT
                        sid,
                        name,
                        season,
                        ROUND(max_wind_near_area::numeric, 2) AS max_wind_near_area,
                        ROUND(min_distance_km::numeric, 2) AS min_distance_km,
                        closest_time
                    FROM event_impacts
                    ORDER BY min_distance_km ASC, season DESC, sid ASC
                    LIMIT 1
                ) nearest ON TRUE
                """;

        return jdbcTemplate.query(sql, params, rs -> {
            TyphoonAreaSummaryDTO response = new TyphoonAreaSummaryDTO();
            response.setAreaId(scope.scopeId());
            response.setStartYear(options.startYear());
            response.setEndYear(options.endYear());
            response.setBufferKm(options.bufferKm());

            TyphoonAreaSummaryStatsDTO stats = new TyphoonAreaSummaryStatsDTO();
            if (rs.next()) {
                stats.setTotalAffectedTyphoons(rs.getInt("total_affected_typhoons"));
                stats.setRecent10yCount(rs.getInt("recent_10y_count"));
                stats.setAnnualAverageCount(getDouble(rs, "annual_average_count", 0.0));
                stats.setHistoricalMinDistanceKm(getNullableDouble(rs, "historical_min_distance_km"));
                stats.setHistoricalMaxWind(getNullableDouble(rs, "historical_max_wind"));
                stats.setHistoricalMinPressure(getNullableDouble(rs, "historical_min_pressure"));

                response.setStrongestTyphoon(mapReference(rs, "strongest"));
                response.setNearestTyphoon(mapReference(rs, "nearest"));
            } else {
                stats.setTotalAffectedTyphoons(0);
                stats.setRecent10yCount(0);
                stats.setAnnualAverageCount(0.0);
            }
            response.setSummary(stats);
            return response;
        });
    }

    @Cacheable(
            value = "typhoonAreaEvents",
            key = "#areaId + '|' + (#startYear == null ? 'null' : #startYear) + '|' + (#endYear == null ? 'null' : #endYear) + '|' + (#bufferKm == null ? 'null' : #bufferKm) + '|' + (#impactLevel == null ? 'null' : #impactLevel) + '|' + (#page == null ? 'null' : #page) + '|' + (#pageSize == null ? 'null' : #pageSize) + '|' + (#sort == null ? 'null' : #sort)"
    )
    public TyphoonAreaEventPageDTO getAreaEvents(
            String areaId,
            Integer startYear,
            Integer endYear,
            Double bufferKm,
            String impactLevel,
            Integer page,
            Integer pageSize,
            String sort) {
        QueryOptions options = normalizeRange(startYear, endYear, bufferKm);
        Pagination pagination = normalizePagination(page, pageSize);
        ScopeContext scope = resolveAreaScope(areaId);

        PagedEventResult pageResult = queryEvents(scope, options, impactLevel, pagination, sort);

        TyphoonAreaEventPageDTO response = new TyphoonAreaEventPageDTO();
        response.setAreaId(scope.scopeId());
        response.setStartYear(options.startYear());
        response.setEndYear(options.endYear());
        response.setBufferKm(options.bufferKm());
        response.setImpactLevel(normalizeImpactLevel(impactLevel));
        response.setPage(pagination.page());
        response.setPageSize(pagination.pageSize());
        response.setTotal(pageResult.total());
        response.setItems(pageResult.items());
        return response;
    }

    @Cacheable(
            value = "typhoonRegionEvents",
            key = "'code|' + #regionCode + '|' + (#startYear == null ? 'null' : #startYear) + '|' + (#endYear == null ? 'null' : #endYear) + '|' + (#bufferKm == null ? 'null' : #bufferKm) + '|' + (#impactLevel == null ? 'null' : #impactLevel) + '|' + (#page == null ? 'null' : #page) + '|' + (#pageSize == null ? 'null' : #pageSize) + '|' + (#sort == null ? 'null' : #sort)"
    )
    public TyphoonRegionEventPageDTO getRegionEvents(
            String regionCode,
            Integer startYear,
            Integer endYear,
            Double bufferKm,
            String impactLevel,
            Integer page,
            Integer pageSize,
            String sort) {
        QueryOptions options = normalizeRange(startYear, endYear, bufferKm);
        Pagination pagination = normalizePagination(page, pageSize);
        ScopeContext scope = resolveRegionScope(regionCode);

        PagedEventResult pageResult = queryEvents(scope, options, impactLevel, pagination, sort);

        TyphoonRegionEventPageDTO response = new TyphoonRegionEventPageDTO();
        response.setRegionId(scope.scopeNumericId());
        response.setRegionCode(scope.scopeId());
        response.setRegionName(scope.scopeName());
        response.setStartYear(options.startYear());
        response.setEndYear(options.endYear());
        response.setBufferKm(options.bufferKm());
        response.setImpactLevel(normalizeImpactLevel(impactLevel));
        response.setPage(pagination.page());
        response.setPageSize(pagination.pageSize());
        response.setTotal(pageResult.total());
        response.setItems(pageResult.items());
        return response;
    }

    @Cacheable(
            value = "typhoonRegionEvents",
            key = "'id|' + #regionId + '|' + (#startYear == null ? 'null' : #startYear) + '|' + (#endYear == null ? 'null' : #endYear) + '|' + (#bufferKm == null ? 'null' : #bufferKm) + '|' + (#impactLevel == null ? 'null' : #impactLevel) + '|' + (#page == null ? 'null' : #page) + '|' + (#pageSize == null ? 'null' : #pageSize) + '|' + (#sort == null ? 'null' : #sort)"
    )
    public TyphoonRegionEventPageDTO getRegionEvents(
            Long regionId,
            Integer startYear,
            Integer endYear,
            Double bufferKm,
            String impactLevel,
            Integer page,
            Integer pageSize,
            String sort) {
        QueryOptions options = normalizeRange(startYear, endYear, bufferKm);
        Pagination pagination = normalizePagination(page, pageSize);
        ScopeContext scope = resolveRegionScope(regionId);

        PagedEventResult pageResult = queryEvents(scope, options, impactLevel, pagination, sort);

        TyphoonRegionEventPageDTO response = new TyphoonRegionEventPageDTO();
        response.setRegionId(scope.scopeNumericId());
        response.setRegionCode(scope.scopeId());
        response.setRegionName(scope.scopeName());
        response.setStartYear(options.startYear());
        response.setEndYear(options.endYear());
        response.setBufferKm(options.bufferKm());
        response.setImpactLevel(normalizeImpactLevel(impactLevel));
        response.setPage(pagination.page());
        response.setPageSize(pagination.pageSize());
        response.setTotal(pageResult.total());
        response.setItems(pageResult.items());
        return response;
    }

    @Cacheable(
            value = "typhoonYearlyStats",
            key = "#areaId + '|' + (#startYear == null ? 'null' : #startYear) + '|' + (#endYear == null ? 'null' : #endYear) + '|' + (#bufferKm == null ? 'null' : #bufferKm)"
    )
    public List<TyphoonYearlyStatDTO> getYearlyStats(String areaId, Integer startYear, Integer endYear, Double bufferKm) {
        QueryOptions options = normalizeRange(startYear, endYear, bufferKm);
        ScopeContext scope = resolveAreaScope(areaId);

        String sql = baseImpactCte(scope.scopeType()) + """
                SELECT
                    season AS year,
                    COUNT(*) AS count,
                    MAX(max_wind_near_area) AS max_wind,
                    ROUND(MIN(min_distance_km)::numeric, 2) AS min_distance_km
                FROM event_impacts
                GROUP BY season
                ORDER BY season
                """;
        return jdbcTemplate.query(sql, baseParams(scope.scopeId(), options), (rs, rowNum) -> {
            TyphoonYearlyStatDTO dto = new TyphoonYearlyStatDTO();
            dto.setYear(rs.getInt("year"));
            dto.setCount(rs.getInt("count"));
            dto.setMaxWind(getNullableDouble(rs, "max_wind"));
            dto.setMinDistanceKm(getNullableDouble(rs, "min_distance_km"));
            return dto;
        });
    }

    public TyphoonTrackDTO getTyphoonTrack(String sid, String areaId, Double bufferKm) {
        if (sid == null || sid.isBlank()) {
            throw new IllegalArgumentException("sid cannot be blank");
        }
        double normalizedBufferKm = bufferKm == null ? DEFAULT_BUFFER_KM : bufferKm;
        if (normalizedBufferKm <= 0) {
            throw new IllegalArgumentException("bufferKm must be greater than 0");
        }

        String eventSql = """
                SELECT sid, name, season, basin, start_time, end_time, max_wind, min_pres, point_count
                FROM typhoon_events
                WHERE sid = :sid
                """;
        MapSqlParameterSource eventParams = new MapSqlParameterSource("sid", sid);
        List<TyphoonTrackDTO> events = jdbcTemplate.query(eventSql, eventParams, (rs, rowNum) -> {
            TyphoonTrackDTO dto = new TyphoonTrackDTO();
            dto.setSid(rs.getString("sid"));
            dto.setName(rs.getString("name"));
            dto.setSeason((Integer) rs.getObject("season"));
            dto.setBasin(rs.getString("basin"));
            dto.setStartTime(rs.getObject("start_time", OffsetDateTime.class));
            dto.setEndTime(rs.getObject("end_time", OffsetDateTime.class));
            dto.setMaxWind(getNullableDouble(rs, "max_wind"));
            dto.setMinPres(getNullableDouble(rs, "min_pres"));
            dto.setPointCount((Integer) rs.getObject("point_count"));
            return dto;
        });
        if (events.isEmpty()) {
            throw new ResourceNotFoundException("Typhoon not found: " + sid);
        }

        TyphoonTrackDTO response = events.get(0);
        response.setAreaId(areaId);
        response.setBufferKm(normalizedBufferKm);

        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("sid", sid);
        params.addValue("bufferMeters", normalizedBufferKm * 1000.0);

        String pointsSql;
        if (areaId == null || areaId.isBlank()) {
            pointsSql = """
                    SELECT
                        iso_time,
                        lat,
                        lon,
                        wmo_wind,
                        wmo_pres,
                        NULL::double precision AS distance_to_area_km,
                        false AS in_buffer
                    FROM typhoon_track_points
                    WHERE sid = :sid
                    ORDER BY iso_time
                    """;
        } else {
            resolveAreaScope(areaId);
            params.addValue("scopeId", areaId);
            pointsSql = scopeGeometryCte(ScopeType.AREA) + """
                    SELECT
                        p.iso_time,
                        p.lat,
                        p.lon,
                        p.wmo_wind,
                        p.wmo_pres,
                        ROUND((ST_Distance(p.geom::geography, scope_geometry.geom::geography) / 1000.0)::numeric, 2) AS distance_to_area_km,
                        ST_DWithin(p.geom::geography, scope_geometry.geom::geography, :bufferMeters) AS in_buffer
                    FROM typhoon_track_points p
                    CROSS JOIN scope_geometry
                    WHERE p.sid = :sid
                    ORDER BY p.iso_time
                    """;
        }

        response.setPoints(jdbcTemplate.query(pointsSql, params, (rs, rowNum) -> {
            TyphoonTrackPointDTO dto = new TyphoonTrackPointDTO();
            dto.setTime(rs.getObject("iso_time", OffsetDateTime.class));
            dto.setLat(getNullableDouble(rs, "lat"));
            dto.setLon(getNullableDouble(rs, "lon"));
            dto.setWmoWind(getNullableDouble(rs, "wmo_wind"));
            dto.setWmoPres(getNullableDouble(rs, "wmo_pres"));
            dto.setDistanceToAreaKm(getNullableDouble(rs, "distance_to_area_km"));
            dto.setInBuffer(rs.getBoolean("in_buffer"));
            return dto;
        }));
        return response;
    }

    private ScopeContext resolveAreaScope(String areaId) {
        if (areaId == null || areaId.isBlank()) {
            throw new IllegalArgumentException("areaId cannot be blank");
        }
        if (!miningAreaRepository.existsByAreaId(areaId)) {
            throw new ResourceNotFoundException("Mining area not found: " + areaId);
        }
        return new ScopeContext(ScopeType.AREA, areaId, null, null);
    }

    private ScopeContext resolveRegionScope(String regionCode) {
        if (regionCode == null || regionCode.isBlank()) {
            throw new IllegalArgumentException("regionCode cannot be blank");
        }
        MiningRegion region = miningRegionRepository.findByRegionCode(regionCode)
                .orElseThrow(() -> new ResourceNotFoundException("Mining region not found: " + regionCode));
        return new ScopeContext(ScopeType.REGION, region.getRegionCode(), region.getRegionName(), region.getId());
    }

    private ScopeContext resolveRegionScope(Long regionId) {
        if (regionId == null) {
            throw new IllegalArgumentException("regionId cannot be null");
        }
        MiningRegion region = miningRegionRepository.findById(regionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mining region not found: " + regionId));
        return new ScopeContext(ScopeType.REGION, region.getRegionCode(), region.getRegionName(), region.getId());
    }

    private QueryOptions normalizeRange(Integer startYear, Integer endYear, Double bufferKm) {
        int resolvedStartYear = startYear == null ? DEFAULT_START_YEAR : startYear;
        int resolvedEndYear = endYear == null ? Year.now().getValue() : endYear;
        double resolvedBufferKm = bufferKm == null ? DEFAULT_BUFFER_KM : bufferKm;
        if (resolvedStartYear > resolvedEndYear) {
            throw new IllegalArgumentException("startYear cannot be greater than endYear");
        }
        if (resolvedBufferKm <= 0) {
            throw new IllegalArgumentException("bufferKm must be greater than 0");
        }
        return new QueryOptions(resolvedStartYear, resolvedEndYear, resolvedBufferKm);
    }

    private Pagination normalizePagination(Integer page, Integer pageSize) {
        int resolvedPage = page == null ? DEFAULT_PAGE : page;
        int resolvedPageSize = pageSize == null ? DEFAULT_PAGE_SIZE : pageSize;
        if (resolvedPage < 1) {
            throw new IllegalArgumentException("page must be at least 1");
        }
        if (resolvedPageSize < 1 || resolvedPageSize > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("pageSize must be between 1 and " + MAX_PAGE_SIZE);
        }
        return new Pagination(resolvedPage, resolvedPageSize);
    }

    private MapSqlParameterSource baseParams(String scopeId, QueryOptions options) {
        return new MapSqlParameterSource()
                .addValue("scopeId", scopeId)
                .addValue("startYear", options.startYear())
                .addValue("endYear", options.endYear())
                .addValue("bufferKm", options.bufferKm())
                .addValue("bufferMeters", options.bufferKm() * 1000.0);
    }

    private PagedEventResult queryEvents(
            ScopeContext scope,
            QueryOptions options,
            String impactLevel,
            Pagination pagination,
            String sort) {
        String impactFilter = impactLevelFilter(impactLevel);
        String orderBy = orderByClause(sort);

        MapSqlParameterSource params = baseParams(scope.scopeId(), options);
        params.addValue("limit", pagination.pageSize());
        params.addValue("offset", (pagination.page() - 1) * pagination.pageSize());

        String itemsSql = baseImpactCte(scope.scopeType()) + String.format("""
                SELECT
                    sid,
                    name,
                    season,
                    basin,
                    ROUND(min_distance_km::numeric, 2) AS min_distance_km,
                    closest_time,
                    influence_start,
                    influence_end,
                    ROUND(COALESCE(influence_duration_hours, 0)::numeric, 2) AS influence_duration_hours,
                    max_wind_near_area,
                    min_pres_near_area,
                    %s AS impact_level,
                    COUNT(*) OVER() AS total_count
                FROM event_impacts
                WHERE %s
                ORDER BY %s
                OFFSET :offset
                LIMIT :limit
                """, impactLevelCase("min_distance_km"), impactFilter, orderBy);

        EventPageRows pageRows = jdbcTemplate.query(itemsSql, params, rs -> {
            List<TyphoonAreaEventDTO> items = new ArrayList<>();
            long total = 0L;
            while (rs.next()) {
                if (total == 0L) {
                    total = rs.getLong("total_count");
                }
                items.add(mapAreaEvent(rs));
            }
            return new EventPageRows(items, total);
        });

        long total = pageRows.total();
        if (pageRows.items().isEmpty() && pagination.page() > 1) {
            String countSql = baseImpactCte(scope.scopeType()) + """
                    SELECT COUNT(*)
                    FROM event_impacts
                    WHERE
                    """ + impactFilter;
            Long count = jdbcTemplate.queryForObject(countSql, baseParams(scope.scopeId(), options), Long.class);
            total = count == null ? 0L : count;
        }

        return new PagedEventResult(total, pageRows.items());
    }

    private String baseImpactCte(ScopeType scopeType) {
        return scopeGeometryCte(scopeType) + """
                , buffered_scope AS (
                    SELECT
                        geom,
                        buffer_geom,
                        ST_Envelope(buffer_geom) AS buffer_envelope
                    FROM (
                        SELECT
                            geom,
                            ST_Buffer(geom::geography, :bufferMeters)::geometry AS buffer_geom
                        FROM scope_geometry
                    ) scoped
                ),
                candidate_points AS (
                    SELECT
                        e.sid,
                        e.name,
                        e.season,
                        e.basin,
                        p.iso_time,
                        p.wmo_wind,
                        p.wmo_pres,
                        p.geom
                    FROM typhoon_track_points p
                    JOIN typhoon_events e ON e.sid = p.sid
                    CROSS JOIN buffered_scope
                    WHERE e.season BETWEEN :startYear AND :endYear
                      AND p.geom && buffered_scope.buffer_envelope
                      AND ST_Intersects(p.geom, buffered_scope.buffer_geom)
                ),
                impacted_points AS (
                    SELECT
                        sid,
                        name,
                        season,
                        basin,
                        iso_time,
                        wmo_wind,
                        wmo_pres,
                        ST_Distance(candidate_points.geom::geography, buffered_scope.geom::geography) / 1000.0 AS distance_km
                    FROM candidate_points
                    CROSS JOIN buffered_scope
                    WHERE ST_DWithin(candidate_points.geom::geography, buffered_scope.geom::geography, :bufferMeters)
                ),
                event_impacts AS (
                    SELECT
                        sid,
                        MIN(name) AS name,
                        MIN(season) AS season,
                        MIN(basin) AS basin,
                        MIN(distance_km) AS min_distance_km,
                        MAX(wmo_wind) AS max_wind_near_area,
                        MIN(wmo_pres) AS min_pres_near_area,
                        MIN(iso_time) AS influence_start,
                        MAX(iso_time) AS influence_end,
                        EXTRACT(EPOCH FROM (MAX(iso_time) - MIN(iso_time))) / 3600.0 AS influence_duration_hours,
                        (ARRAY_AGG(iso_time ORDER BY distance_km ASC, iso_time ASC))[1] AS closest_time,
                        COUNT(*) AS track_points_in_buffer
                    FROM impacted_points
                    GROUP BY sid
                )
                """;
    }

    private String scopeGeometryCte(ScopeType scopeType) {
        String geometrySql = switch (scopeType) {
            case AREA -> """
                    SELECT ST_Multi(ST_UnaryUnion(ST_Collect(geometry))) AS geom
                    FROM mining_areas
                    WHERE area_id = :scopeId
                    """;
            case REGION -> """
                    SELECT geometry AS geom
                    FROM mining_regions
                    WHERE region_code = :scopeId
                    """;
        };
        return """
                WITH scope_geometry AS (
                %s
                )
                """.formatted(indentSql(geometrySql, 4));
    }

    private String orderByClause(String sort) {
        String normalized = sort == null ? "season_desc" : sort.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "season_asc" -> "season ASC, min_distance_km ASC, sid ASC";
            case "min_distance" -> "min_distance_km ASC, season DESC, sid ASC";
            case "max_wind" -> "max_wind_near_area DESC NULLS LAST, season DESC, min_distance_km ASC";
            default -> "season DESC, min_distance_km ASC, sid ASC";
        };
    }

    private String normalizeImpactLevel(String impactLevel) {
        if (impactLevel == null || impactLevel.isBlank()) {
            return null;
        }
        String normalized = impactLevel.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "core", "strong", "outer" -> normalized;
            default -> throw new IllegalArgumentException("impactLevel only supports core, strong, outer");
        };
    }

    private String impactLevelFilter(String impactLevel) {
        String normalized = normalizeImpactLevel(impactLevel);
        if (normalized == null) {
            return "1 = 1";
        }
        return switch (normalized) {
            case "core" -> "min_distance_km <= 100";
            case "strong" -> "min_distance_km > 100 AND min_distance_km <= 300";
            case "outer" -> "min_distance_km > 300 AND min_distance_km <= 500";
            default -> throw new IllegalArgumentException("impactLevel only supports core, strong, outer");
        };
    }

    private String impactLevelCase(String column) {
        return """
                CASE
                    WHEN %s <= 100 THEN 'core'
                    WHEN %s <= 300 THEN 'strong'
                    WHEN %s <= 500 THEN 'outer'
                    ELSE 'none'
                END
                """.formatted(column, column, column);
    }

    private TyphoonAreaEventDTO mapAreaEvent(ResultSet rs) throws SQLException {
        TyphoonAreaEventDTO dto = new TyphoonAreaEventDTO();
        dto.setSid(rs.getString("sid"));
        dto.setName(rs.getString("name"));
        dto.setSeason((Integer) rs.getObject("season"));
        dto.setBasin(rs.getString("basin"));
        dto.setMinDistanceKm(getNullableDouble(rs, "min_distance_km"));
        dto.setClosestTime(rs.getObject("closest_time", OffsetDateTime.class));
        dto.setInfluenceStart(rs.getObject("influence_start", OffsetDateTime.class));
        dto.setInfluenceEnd(rs.getObject("influence_end", OffsetDateTime.class));
        dto.setInfluenceDurationHours(getNullableDouble(rs, "influence_duration_hours"));
        dto.setMaxWindNearArea(getNullableDouble(rs, "max_wind_near_area"));
        dto.setMinPresNearArea(getNullableDouble(rs, "min_pres_near_area"));
        dto.setImpactLevel(rs.getString("impact_level"));
        return dto;
    }

    private TyphoonAreaReferenceDTO mapReference(ResultSet rs, String prefix) throws SQLException {
        String sid = rs.getString(prefix + "_sid");
        if (sid == null) {
            return null;
        }
        TyphoonAreaReferenceDTO dto = new TyphoonAreaReferenceDTO();
        dto.setSid(sid);
        dto.setName(rs.getString(prefix + "_name"));
        dto.setSeason((Integer) rs.getObject(prefix + "_season"));
        dto.setMaxWindNearArea(getNullableDouble(rs, prefix + "_max_wind_near_area"));
        dto.setMinDistanceKm(getNullableDouble(rs, prefix + "_min_distance_km"));
        dto.setClosestTime(rs.getObject(prefix + "_closest_time", OffsetDateTime.class));
        return dto;
    }

    private Double getNullableDouble(ResultSet rs, String column) throws SQLException {
        Object value = rs.getObject(column);
        return value == null ? null : ((Number) value).doubleValue();
    }

    private Double getDouble(ResultSet rs, String column, Double defaultValue) throws SQLException {
        Double value = getNullableDouble(rs, column);
        return value == null ? defaultValue : value;
    }

    private String indentSql(String sql, int spaces) {
        String indent = " ".repeat(spaces);
        return indent + sql.stripIndent().replace("\n", "\n" + indent);
    }

    private record QueryOptions(int startYear, int endYear, double bufferKm) {}

    private record Pagination(int page, int pageSize) {}

    private record ScopeContext(ScopeType scopeType, String scopeId, String scopeName, Long scopeNumericId) {}

    private enum ScopeType {
        AREA,
        REGION
    }

    private record EventPageRows(List<TyphoonAreaEventDTO> items, long total) {}

    private record PagedEventResult(long total, List<TyphoonAreaEventDTO> items) {}
}
