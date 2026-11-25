package com.oceanmining.monitoring.service;

import com.oceanmining.monitoring.dto.response.HistoricalWaveMonthlyOverviewDTO;
import com.oceanmining.monitoring.dto.response.HistoricalWavePointSeriesDTO;
import com.oceanmining.monitoring.dto.response.HistoricalWindMonthlyOverviewDTO;
import com.oceanmining.monitoring.dto.response.HistoricalWindPointSeriesDTO;
import com.oceanmining.monitoring.exception.ResourceNotFoundException;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class HistoricalWaveService {

    private static final String DATASET_CODE = "era5_monthly_wave";

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final HistoricalPointCacheService pointCache;

    public HistoricalWaveService(NamedParameterJdbcTemplate jdbcTemplate,HistoricalPointCacheService pointCache) {
        this.jdbcTemplate = jdbcTemplate;
        this.pointCache = pointCache;
    }

    public HistoricalWavePointSeriesDTO queryPointMonthlySeries(double lat, double lon, Integer startYear, Integer endYear) {
        validateCoordinates(lat, lon);
        validateYearRange(startYear, endYear);

        HistoricalDatasetMeta meta = loadDatasetMeta();
        var series = pointCache.get(HistoricalDataset.WAVE,lat,lon,HistoricalWavePointSeriesDTO.MonthlyWavePointDTO.class,
                () -> loadMonthlyItems(lat, lon, null, null));
        List<HistoricalWavePointSeriesDTO.MonthlyWavePointDTO> items = series.items().stream()
                .filter(item -> (startYear == null || item.getYear() >= startYear)
                        && (endYear == null || item.getYear() <= endYear)).toList();
        if (items.isEmpty()) {
            throw new ResourceNotFoundException("No historical wave data found for dataset " + DATASET_CODE + buildRangeSuffix(startYear, endYear));
        }

        HistoricalWavePointSeriesDTO response = new HistoricalWavePointSeriesDTO();
        response.setDataVersion(series.version());
        response.setDatasetCode(meta.datasetCode());
        response.setDatasetName(meta.datasetName());
        response.setStartYear(startYear);
        response.setEndYear(endYear);
        response.setTotal(items.size());
        response.setLocation(new HistoricalWindPointSeriesDTO.LocationInfo(lat, lon));
        response.setItems(items);
        return response;
    }

    public HistoricalWaveMonthlyOverviewDTO queryMonthlyOverview(Integer startYear, Integer endYear) {
        validateYearRange(startYear, endYear);

        HistoricalDatasetMeta meta = loadDatasetMeta();
        List<HistoricalWaveMonthlyOverviewDTO.MonthlyOverviewItemDTO> items = loadMonthlyOverviewItems(startYear, endYear);
        if (items.isEmpty()) {
            throw new ResourceNotFoundException("No historical wave data found for dataset " + DATASET_CODE + buildRangeSuffix(startYear, endYear));
        }

        HistoricalWaveMonthlyOverviewDTO response = new HistoricalWaveMonthlyOverviewDTO();
        response.setDatasetCode(meta.datasetCode());
        response.setDatasetName(meta.datasetName());
        response.setStartYear(startYear);
        response.setEndYear(endYear);
        response.setTotal(items.size());
        response.setGrid(new HistoricalWindMonthlyOverviewDTO.GridInfo(
                meta.gridWidth(), meta.gridHeight(), meta.lonMin(), meta.lonMax(), meta.latMin(), meta.latMax()
        ));
        response.setItems(items);
        return response;
    }

    private HistoricalDatasetMeta loadDatasetMeta() {
        String sql = """
                SELECT dataset_code, dataset_name, grid_width, grid_height, lon_min, lon_max, lat_min, lat_max
                FROM historical_wave_metadata
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
                        rs.getBigDecimal("lat_max").doubleValue()
                )
        );
        if (metas.isEmpty()) {
            throw new ResourceNotFoundException("Historical wave dataset not found: " + DATASET_CODE);
        }
        return metas.get(0);
    }

    public int precomputePoints(List<HistoricalPointCacheStore.Point> points) {
        return pointCache.warm(HistoricalDataset.WAVE,points,HistoricalWavePointSeriesDTO.MonthlyWavePointDTO.class, requested -> {
            var meta=loadDatasetMeta();
            var contexts=requested.stream().map(point->buildPointSampleContext(meta,point.lat(),point.lon())).toList();
            String offsets=contexts.stream().map(context->Integer.toString(context.valueOffset())).collect(java.util.stream.Collectors.joining(",","{","}"));
            String sql="""
                SELECT d.year,d.month,d.month_label,d.month_start,d.wave_time,d.wave_valid_time,d.wave_step_hours,
                       samples.point_index,samples.a_bytes[1] AS s_bytes,samples.b_bytes[1] AS p_bytes,samples.c_bytes[1] AS d_bytes
                FROM historical_wave_monthly_data d
                JOIN historical_wave_metadata m ON m.id=d.metadata_id
                CROSS JOIN LATERAL ocean_history_vector_samples(d.swh_component,d.mwp_component,d.mwd_component,CAST(:offsets AS integer[]),1) samples
                WHERE m.dataset_code=:datasetCode
                ORDER BY d.year,d.month,samples.point_index
                """;
            return jdbcTemplate.query(sql,new MapSqlParameterSource("offsets",offsets).addValue("datasetCode",DATASET_CODE),rs->{
                var result=new java.util.LinkedHashMap<HistoricalPointCacheStore.Point,List<HistoricalWavePointSeriesDTO.MonthlyWavePointDTO>>();
                requested.forEach(point->result.put(point,new ArrayList<>()));
                while(rs.next()) {
                    int index=rs.getInt("point_index")-1;
                    result.get(requested.get(index)).add(mapMonthlyPoint(rs,contexts.get(index)));
                }
                return result;
            });
        });
    }

    private List<HistoricalWavePointSeriesDTO.MonthlyWavePointDTO> loadMonthlyItems(double lat, double lon, Integer startYear, Integer endYear) {
        HistoricalDatasetMeta meta = loadDatasetMeta();
        PointSampleContext pointContext = buildPointSampleContext(meta, lat, lon);
        StringBuilder sql = new StringBuilder("""
                SELECT
                    d.year, d.month, d.month_label, d.month_start,
                    d.wave_time, d.wave_valid_time, d.wave_step_hours,
                    substring(d.swh_component from :sOffset for 4) AS s_bytes,
                    substring(d.mwp_component from :pOffset for 4) AS p_bytes,
                    substring(d.mwd_component from :dOffset for 4) AS d_bytes
                FROM historical_wave_monthly_data d
                JOIN historical_wave_metadata m ON m.id = d.metadata_id
                WHERE m.dataset_code = :datasetCode
                """);
        MapSqlParameterSource params = new MapSqlParameterSource("datasetCode", DATASET_CODE)
                .addValue("sOffset", pointContext.valueOffset())
                .addValue("pOffset", pointContext.valueOffset())
                .addValue("dOffset", pointContext.valueOffset());
        appendYearFilters(sql, params, startYear, endYear);
        sql.append("\nORDER BY d.year, d.month");
        return jdbcTemplate.query(sql.toString(), params, (rs, rowNum) -> mapMonthlyPoint(rs, pointContext));
    }

    private List<HistoricalWaveMonthlyOverviewDTO.MonthlyOverviewItemDTO> loadMonthlyOverviewItems(Integer startYear, Integer endYear) {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    d.year, d.month, d.month_label, d.month_start,
                    d.wave_time, d.wave_valid_time, d.wave_step_hours,
                    d.swh_min, d.swh_max, d.mwp_min, d.mwp_max, d.mwd_min, d.mwd_max,
                    d.data_size, d.source_file_name, d.source_file_path, d.source_file_size_bytes, d.imported_at
                FROM historical_wave_monthly_data d
                JOIN historical_wave_metadata m ON m.id = d.metadata_id
                WHERE m.dataset_code = :datasetCode
                """);
        MapSqlParameterSource params = new MapSqlParameterSource("datasetCode", DATASET_CODE);
        appendYearFilters(sql, params, startYear, endYear);
        sql.append("\nORDER BY d.year, d.month");
        return jdbcTemplate.query(sql.toString(), params, (rs, rowNum) -> {
            HistoricalWaveMonthlyOverviewDTO.MonthlyOverviewItemDTO dto = new HistoricalWaveMonthlyOverviewDTO.MonthlyOverviewItemDTO();
            dto.setYear(rs.getInt("year"));
            dto.setMonth(rs.getInt("month"));
            dto.setMonthLabel(rs.getString("month_label"));
            dto.setMonthStart(rs.getObject("month_start", java.time.LocalDate.class));
            dto.setWaveTime(rs.getObject("wave_time", OffsetDateTime.class));
            dto.setWaveValidTime(rs.getObject("wave_valid_time", OffsetDateTime.class));
            dto.setWaveStepHours(getNullableDouble(rs, "wave_step_hours"));
            dto.setSwhMin(rs.getFloat("swh_min"));
            dto.setSwhMax(rs.getFloat("swh_max"));
            dto.setMwpMin(rs.getFloat("mwp_min"));
            dto.setMwpMax(rs.getFloat("mwp_max"));
            dto.setMwdMin(rs.getFloat("mwd_min"));
            dto.setMwdMax(rs.getFloat("mwd_max"));
            dto.setDataSize(rs.getInt("data_size"));
            dto.setSourceFileName(rs.getString("source_file_name"));
            dto.setSourceFilePath(rs.getString("source_file_path"));
            dto.setSourceFileSizeBytes(getNullableLong(rs, "source_file_size_bytes"));
            dto.setImportedAt(rs.getObject("imported_at", OffsetDateTime.class));
            return dto;
        });
    }

    private HistoricalWavePointSeriesDTO.MonthlyWavePointDTO mapMonthlyPoint(ResultSet rs, PointSampleContext pointContext) throws SQLException {
        float swh = bytesToFloat(rs.getBytes("s_bytes"));
        float mwp = bytesToFloat(rs.getBytes("p_bytes"));
        float mwd = bytesToFloat(rs.getBytes("d_bytes"));

        HistoricalWavePointSeriesDTO.MonthlyWavePointDTO dto = new HistoricalWavePointSeriesDTO.MonthlyWavePointDTO();
        dto.setYear(rs.getInt("year"));
        dto.setMonth(rs.getInt("month"));
        dto.setMonthLabel(rs.getString("month_label"));
        dto.setMonthStart(rs.getObject("month_start", java.time.LocalDate.class));
        dto.setWaveTime(rs.getObject("wave_time", OffsetDateTime.class));
        dto.setWaveValidTime(rs.getObject("wave_valid_time", OffsetDateTime.class));
        dto.setWaveStepHours(getNullableDouble(rs, "wave_step_hours"));

        if (containsInvalid(swh, mwp, mwd)) {
            dto.setWave(null);
            return dto;
        }

        dto.setWave(new HistoricalWavePointSeriesDTO.WaveDTO(round(swh), round(mwp), round(mwd)));
        return dto;
    }

    private PointSampleContext buildPointSampleContext(HistoricalDatasetMeta meta, double lat, double lon) {
        double adjustedLon = adjustLongitude(lon, meta.lonMin(), meta.lonMax());
        double x = ((adjustedLon - meta.lonMin()) / (meta.lonMax() - meta.lonMin())) * (meta.gridWidth() - 1);
        double y = ((meta.latMax() - lat) / (meta.latMax() - meta.latMin())) * (meta.gridHeight() - 1);
        if (x < 0 || x >= meta.gridWidth() || y < 0 || y >= meta.gridHeight()) {
            throw new ResourceNotFoundException("Requested point is outside the historical wave grid");
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

    private double adjustLongitude(double lon, double west, double east) {
        if (west >= 0 && east > 180 && lon < 0) {
            return lon + 360.0;
        }
        return lon;
    }

    private boolean containsInvalid(float... values) {
        for (float value : values) {
            if (Float.isNaN(value) || Float.isInfinite(value) || value <= -9000.0f) {
                return true;
            }
        }
        return false;
    }

    private float bytesToFloat(byte[] bytes) {
        if (bytes == null || bytes.length < 4) {
            return Float.NaN;
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
            double latMax) {}

    private record PointSampleContext(int valueOffset) {}
}
