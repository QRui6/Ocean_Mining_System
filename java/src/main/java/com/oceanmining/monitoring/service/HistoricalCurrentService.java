package com.oceanmining.monitoring.service;

import com.oceanmining.monitoring.dto.response.HistoricalCurrentMonthlyOverviewDTO;
import com.oceanmining.monitoring.dto.response.HistoricalCurrentPointSeriesDTO;
import com.oceanmining.monitoring.dto.response.HistoricalWindMonthlyOverviewDTO;
import com.oceanmining.monitoring.dto.response.HistoricalWindPointSeriesDTO;
import com.oceanmining.monitoring.exception.ResourceNotFoundException;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class HistoricalCurrentService {

    private static final String DATASET_CODE = "copernicus_monthly_current";
    private static final double POINT_MATCH_EPSILON = 0.000001;

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public HistoricalCurrentService(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public HistoricalCurrentPointSeriesDTO queryPointMonthlySeries(double lat, double lon, Integer startYear, Integer endYear) {
        validateCoordinates(lat, lon);
        validateYearRange(startYear, endYear);

        List<HistoricalCurrentPointSeriesDTO.MonthlyCurrentPointDTO> cachedItems =
                loadCachedMonthlyItems(lat, lon, startYear, endYear);
        if (!cachedItems.isEmpty()) {
            HistoricalDatasetMeta cachedMeta = loadDatasetMeta();
            HistoricalCurrentPointSeriesDTO response = new HistoricalCurrentPointSeriesDTO();
            response.setDatasetCode(cachedMeta.datasetCode());
            response.setDatasetName(cachedMeta.datasetName());
            response.setStartYear(startYear);
            response.setEndYear(endYear);
            response.setTotal(cachedItems.size());
            response.setLocation(new HistoricalWindPointSeriesDTO.LocationInfo(lat, lon));
            response.setItems(cachedItems);
            return response;
        }

        HistoricalDatasetMeta meta = loadDatasetMeta();
        List<HistoricalCurrentPointSeriesDTO.MonthlyCurrentPointDTO> items = loadMonthlyItems(meta, lat, lon, startYear, endYear);
        if (items.isEmpty()) {
            throw new ResourceNotFoundException("No historical current data found for dataset " + DATASET_CODE + buildRangeSuffix(startYear, endYear));
        }

        HistoricalCurrentPointSeriesDTO response = new HistoricalCurrentPointSeriesDTO();
        response.setDatasetCode(meta.datasetCode());
        response.setDatasetName(meta.datasetName());
        response.setStartYear(startYear);
        response.setEndYear(endYear);
        response.setTotal(items.size());
        response.setLocation(new HistoricalWindPointSeriesDTO.LocationInfo(lat, lon));
        response.setItems(items);
        return response;
    }

    private List<HistoricalCurrentPointSeriesDTO.MonthlyCurrentPointDTO> loadCachedMonthlyItems(
            double lat, double lon, Integer startYear, Integer endYear) {
        Long regionId = findRegionIdByCenter(lat, lon);
        if (regionId != null) {
            List<HistoricalCurrentPointSeriesDTO.MonthlyCurrentPointDTO> items =
                    loadCachedRegionMonthlyItems(regionId, startYear, endYear);
            if (!items.isEmpty()) {
                return items;
            }
        }

        Long siteId = findSiteIdByCoordinate(lat, lon);
        if (siteId != null) {
            return loadCachedSiteMonthlyItems(siteId, startYear, endYear);
        }
        return List.of();
    }

    private Long findRegionIdByCenter(double lat, double lon) {
        String regionSql = """
                SELECT id
                FROM mining_regions
                WHERE ABS(center_lat - :lat) < :epsilon
                  AND ABS(center_lng - :lon) < :epsilon
                LIMIT 1
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("lat", lat)
                .addValue("lon", lon)
                .addValue("epsilon", POINT_MATCH_EPSILON);
        List<Long> regionIds = jdbcTemplate.query(regionSql, params, (rs, rowNum) -> rs.getLong("id"));
        return regionIds.isEmpty() ? null : regionIds.get(0);
    }

    private Long findSiteIdByCoordinate(double lat, double lon) {
        String siteSql = """
                SELECT id
                FROM forecast_sites
                WHERE is_active = true
                  AND ABS(lat - :lat) < :epsilon
                  AND ABS(lng - :lon) < :epsilon
                LIMIT 1
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("lat", lat)
                .addValue("lon", lon)
                .addValue("epsilon", POINT_MATCH_EPSILON);
        List<Long> siteIds = jdbcTemplate.query(siteSql, params, (rs, rowNum) -> rs.getLong("id"));
        return siteIds.isEmpty() ? null : siteIds.get(0);
    }

    private List<HistoricalCurrentPointSeriesDTO.MonthlyCurrentPointDTO> loadCachedRegionMonthlyItems(
            long regionId, Integer startYear, Integer endYear) {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    year, month, month_label, month_start, data_time, depth_m,
                    u_value, v_value, speed_value, direction_value
                FROM historical_current_region_cache
                WHERE region_id = :regionId
                """);
        MapSqlParameterSource params = new MapSqlParameterSource("regionId", regionId);
        if (startYear != null) {
            sql.append("\n  AND year >= :startYear");
            params.addValue("startYear", startYear);
        }
        if (endYear != null) {
            sql.append("\n  AND year <= :endYear");
            params.addValue("endYear", endYear);
        }
        sql.append("\nORDER BY year, month");
        return mapCachedMonthlyItems(sql.toString(), params);
    }

    private List<HistoricalCurrentPointSeriesDTO.MonthlyCurrentPointDTO> loadCachedSiteMonthlyItems(
            long siteId, Integer startYear, Integer endYear) {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    year, month, month_label, month_start, data_time, depth_m,
                    u_value, v_value, speed_value, direction_value
                FROM historical_current_site_cache
                WHERE site_id = :siteId
                """);
        MapSqlParameterSource params = new MapSqlParameterSource("siteId", siteId);
        if (startYear != null) {
            sql.append("\n  AND year >= :startYear");
            params.addValue("startYear", startYear);
        }
        if (endYear != null) {
            sql.append("\n  AND year <= :endYear");
            params.addValue("endYear", endYear);
        }
        sql.append("\nORDER BY year, month");
        return mapCachedMonthlyItems(sql.toString(), params);
    }

    private List<HistoricalCurrentPointSeriesDTO.MonthlyCurrentPointDTO> mapCachedMonthlyItems(
            String sql,
            MapSqlParameterSource params) {
        return jdbcTemplate.query(sql.toString(), params, (rs, rowNum) -> {
            HistoricalCurrentPointSeriesDTO.MonthlyCurrentPointDTO dto =
                    new HistoricalCurrentPointSeriesDTO.MonthlyCurrentPointDTO();
            dto.setYear(rs.getInt("year"));
            dto.setMonth(rs.getInt("month"));
            dto.setMonthLabel(rs.getString("month_label"));
            dto.setMonthStart(rs.getObject("month_start", LocalDate.class));
            dto.setCurrentTime(rs.getObject("data_time", OffsetDateTime.class));
            dto.setDepthMeters(getNullableDouble(rs, "depth_m"));

            Double u = getNullableDouble(rs, "u_value");
            Double v = getNullableDouble(rs, "v_value");
            Double speed = getNullableDouble(rs, "speed_value");
            Double direction = getNullableDouble(rs, "direction_value");
            if (u == null || v == null || speed == null || direction == null) {
                dto.setCurrent(null);
            } else {
                dto.setCurrent(new HistoricalWindPointSeriesDTO.WindVectorDTO(
                        round(u),
                        round(v),
                        round(speed),
                        round(direction)
                ));
            }
            return dto;
        });
    }

    public HistoricalCurrentMonthlyOverviewDTO queryMonthlyOverview(Integer startYear, Integer endYear) {
        validateYearRange(startYear, endYear);

        HistoricalDatasetMeta meta = loadDatasetMeta();
        List<HistoricalCurrentMonthlyOverviewDTO.MonthlyOverviewItemDTO> items = loadMonthlyOverviewItems(startYear, endYear);
        if (items.isEmpty()) {
            throw new ResourceNotFoundException("No historical current data found for dataset " + DATASET_CODE + buildRangeSuffix(startYear, endYear));
        }

        HistoricalCurrentMonthlyOverviewDTO response = new HistoricalCurrentMonthlyOverviewDTO();
        response.setDatasetCode(meta.datasetCode());
        response.setDatasetName(meta.datasetName());
        response.setStartYear(startYear);
        response.setEndYear(endYear);
        response.setTotal(items.size());
        response.setGrid(new HistoricalWindMonthlyOverviewDTO.GridInfo(
                meta.gridWidth(), meta.gridHeight(), meta.lonMin(), meta.lonMax(), meta.latMin(), meta.latMax()
        ));
        response.setDepthMeters(meta.depthMeters());
        response.setItems(items);
        return response;
    }

    private HistoricalDatasetMeta loadDatasetMeta() {
        String sql = """
                SELECT dataset_code, dataset_name, grid_width, grid_height, lon_min, lon_max, lat_min, lat_max, depth_m
                FROM historical_current_metadata
                WHERE dataset_code = :datasetCode
                """;
        List<HistoricalDatasetMeta> metas = jdbcTemplate.query(
                sql,
                new MapSqlParameterSource("datasetCode", DATASET_CODE),
                (rs, rowNum) -> new HistoricalDatasetMeta(
                        rs.getString("dataset_code"),
                        rs.getString("dataset_name"),
                        rs.getInt("grid_width"),
                        rs.getInt("grid_height"),
                        rs.getBigDecimal("lon_min").doubleValue(),
                        rs.getBigDecimal("lon_max").doubleValue(),
                        rs.getBigDecimal("lat_min").doubleValue(),
                        rs.getBigDecimal("lat_max").doubleValue(),
                        rs.getBigDecimal("depth_m").doubleValue()
                )
        );
        if (metas.isEmpty()) {
            throw new ResourceNotFoundException("Historical current dataset not found: " + DATASET_CODE);
        }
        return metas.get(0);
    }

    private List<HistoricalCurrentPointSeriesDTO.MonthlyCurrentPointDTO> loadMonthlyItems(
            HistoricalDatasetMeta meta, double lat, double lon, Integer startYear, Integer endYear) {
        PointSampleContext pointContext = buildPointSampleContext(meta, lat, lon);
        StringBuilder sql = new StringBuilder("""
                SELECT
                    d.year, d.month, d.month_label, d.month_start, d.data_time, d.depth_m,
                    substring(d.u_component from :uOffset for 4) AS u_bytes,
                    substring(d.v_component from :vOffset for 4) AS v_bytes
                FROM historical_current_monthly_data d
                JOIN historical_current_metadata m ON m.id = d.metadata_id
                WHERE m.dataset_code = :datasetCode
                """);
        MapSqlParameterSource params = new MapSqlParameterSource("datasetCode", DATASET_CODE)
                .addValue("uOffset", pointContext.uOffset())
                .addValue("vOffset", pointContext.uOffset());
        appendYearFilters(sql, params, startYear, endYear);
        sql.append("\nORDER BY d.year, d.month");
        return jdbcTemplate.query(sql.toString(), params, (rs, rowNum) -> mapMonthlyPoint(rs, pointContext));
    }

    private List<HistoricalCurrentMonthlyOverviewDTO.MonthlyOverviewItemDTO> loadMonthlyOverviewItems(Integer startYear, Integer endYear) {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    d.year, d.month, d.month_label, d.month_start, d.data_time, d.depth_m,
                    d.u_min, d.u_max, d.v_min, d.v_max,
                    d.data_size, d.source_file_name, d.source_file_path, d.source_file_size_bytes, d.imported_at
                FROM historical_current_monthly_data d
                JOIN historical_current_metadata m ON m.id = d.metadata_id
                WHERE m.dataset_code = :datasetCode
                """);
        MapSqlParameterSource params = new MapSqlParameterSource("datasetCode", DATASET_CODE);
        appendYearFilters(sql, params, startYear, endYear);
        sql.append("\nORDER BY d.year, d.month");
        return jdbcTemplate.query(sql.toString(), params, (rs, rowNum) -> {
            HistoricalCurrentMonthlyOverviewDTO.MonthlyOverviewItemDTO dto = new HistoricalCurrentMonthlyOverviewDTO.MonthlyOverviewItemDTO();
            dto.setYear(rs.getInt("year"));
            dto.setMonth(rs.getInt("month"));
            dto.setMonthLabel(rs.getString("month_label"));
            dto.setMonthStart(rs.getObject("month_start", java.time.LocalDate.class));
            dto.setCurrentTime(rs.getObject("data_time", OffsetDateTime.class));
            dto.setDepthMeters(getNullableDouble(rs, "depth_m"));
            dto.setUMin(rs.getFloat("u_min"));
            dto.setUMax(rs.getFloat("u_max"));
            dto.setVMin(rs.getFloat("v_min"));
            dto.setVMax(rs.getFloat("v_max"));
            dto.setDataSize(rs.getInt("data_size"));
            dto.setSourceFileName(rs.getString("source_file_name"));
            dto.setSourceFilePath(rs.getString("source_file_path"));
            dto.setSourceFileSizeBytes(getNullableLong(rs, "source_file_size_bytes"));
            dto.setImportedAt(rs.getObject("imported_at", OffsetDateTime.class));
            return dto;
        });
    }

    private HistoricalCurrentPointSeriesDTO.MonthlyCurrentPointDTO mapMonthlyPoint(ResultSet rs, PointSampleContext pointContext) throws SQLException {
        float u = bytesToFloat(rs.getBytes("u_bytes"));
        float v = bytesToFloat(rs.getBytes("v_bytes"));

        HistoricalCurrentPointSeriesDTO.MonthlyCurrentPointDTO dto = new HistoricalCurrentPointSeriesDTO.MonthlyCurrentPointDTO();
        dto.setYear(rs.getInt("year"));
        dto.setMonth(rs.getInt("month"));
        dto.setMonthLabel(rs.getString("month_label"));
        dto.setMonthStart(rs.getObject("month_start", LocalDate.class));
        dto.setCurrentTime(rs.getObject("data_time", OffsetDateTime.class));
        dto.setDepthMeters(getNullableDouble(rs, "depth_m"));

        if (containsInvalid(u, v)) {
            dto.setCurrent(null);
            return dto;
        }

        double speed = Math.sqrt(u * u + v * v);
        double direction = Math.toDegrees(Math.atan2(u, v));
        if (direction < 0) {
            direction += 360.0;
        }

        dto.setCurrent(new HistoricalWindPointSeriesDTO.WindVectorDTO(round(u), round(v), round(speed), round(direction)));
        return dto;
    }

    private PointSampleContext buildPointSampleContext(HistoricalDatasetMeta meta, double lat, double lon) {
        double adjustedLon = adjustLongitude(lon, meta.lonMin(), meta.lonMax());
        double x = ((adjustedLon - meta.lonMin()) / (meta.lonMax() - meta.lonMin())) * (meta.gridWidth() - 1);
        double y = ((lat - meta.latMin()) / (meta.latMax() - meta.latMin())) * (meta.gridHeight() - 1);
        if (x < 0 || x >= meta.gridWidth() || y < 0 || y >= meta.gridHeight()) {
            throw new ResourceNotFoundException("Requested point is outside the historical current grid");
        }

        int nearestX = (int) Math.round(x);
        int nearestY = (int) Math.round(y);
        nearestX = Math.max(0, Math.min(meta.gridWidth() - 1, nearestX));
        nearestY = Math.max(0, Math.min(meta.gridHeight() - 1, nearestY));

        return new PointSampleContext(
                toByteaOffset(meta.gridWidth(), nearestX, nearestY)
        );
    }

    private int toByteaOffset(int width, int x, int y) {
        return (y * width + x) * 4 + 1;
    }

    private boolean containsInvalid(float... values) {
        for (float value : values) {
            if (Float.isNaN(value) || Float.isInfinite(value)) {
                return true;
            }
        }
        return false;
    }

    private double adjustLongitude(double lon, double west, double east) {
        if (west >= 0 && east > 180 && lon < 0) {
            return lon + 360.0;
        }
        return lon;
    }

    private float bytesToFloat(byte[] bytes) {
        if (bytes == null || bytes.length < 4) {
            throw new ResourceNotFoundException("Historical current cell value is missing");
        }
        int intBits = (bytes[0] & 0xFF)
                | ((bytes[1] & 0xFF) << 8)
                | ((bytes[2] & 0xFF) << 16)
                | ((bytes[3] & 0xFF) << 24);
        return Float.intBitsToFloat(intBits);
    }

    private void appendYearFilters(StringBuilder sql, MapSqlParameterSource params, Integer startYear, Integer endYear) {
        if (startYear != null) {
            sql.append("\n  AND d.year >= :startYear");
            params.addValue("startYear", startYear);
        }
        if (endYear != null) {
            sql.append("\n  AND d.year <= :endYear");
            params.addValue("endYear", endYear);
        }
    }

    private void validateCoordinates(double lat, double lon) {
        if (lat < -90.0 || lat > 90.0) {
            throw new IllegalArgumentException("lat must be between -90 and 90");
        }
        if (lon < -180.0 || lon > 180.0) {
            throw new IllegalArgumentException("lon must be between -180 and 180");
        }
    }

    private void validateYearRange(Integer startYear, Integer endYear) {
        if (startYear != null && startYear < 1900) {
            throw new IllegalArgumentException("startYear must be at least 1900");
        }
        if (endYear != null && endYear < 1900) {
            throw new IllegalArgumentException("endYear must be at least 1900");
        }
        if (startYear != null && endYear != null && startYear > endYear) {
            throw new IllegalArgumentException("startYear cannot be greater than endYear");
        }
    }

    private String buildRangeSuffix(Integer startYear, Integer endYear) {
        List<String> parts = new ArrayList<>();
        if (startYear != null) {
            parts.add("startYear=" + startYear);
        }
        if (endYear != null) {
            parts.add("endYear=" + endYear);
        }
        return parts.isEmpty() ? "" : " (" + String.join(", ", parts) + ")";
    }

    private Double getNullableDouble(ResultSet rs, String column) throws SQLException {
        Object value = rs.getObject(column);
        return value == null ? null : ((Number) value).doubleValue();
    }

    private Long getNullableLong(ResultSet rs, String column) throws SQLException {
        Object value = rs.getObject(column);
        return value == null ? null : ((Number) value).longValue();
    }

    private double round(double value) {
        return Math.round(value * 1000.0) / 1000.0;
    }

    private record HistoricalDatasetMeta(
            String datasetCode,
            String datasetName,
            int gridWidth,
            int gridHeight,
            double lonMin,
            double lonMax,
            double latMin,
            double latMax,
            double depthMeters) {}

    private record PointSampleContext(int uOffset) {}
}
