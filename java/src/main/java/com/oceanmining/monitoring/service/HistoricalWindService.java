package com.oceanmining.monitoring.service;

import com.oceanmining.monitoring.dto.response.HistoricalWindMonthlyOverviewDTO;
import com.oceanmining.monitoring.dto.response.HistoricalWindPointSeriesDTO;
import com.oceanmining.monitoring.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class HistoricalWindService {

    private static final String DATASET_CODE = "era5_monthly_wind";

    private final NamedParameterJdbcTemplate jdbcTemplate;

    @Autowired
    public HistoricalWindService(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public HistoricalWindPointSeriesDTO queryPointMonthlySeries(
            double lat,
            double lon,
            Integer startYear,
            Integer endYear) {
        validateCoordinates(lat, lon);
        validateYearRange(startYear, endYear);

        HistoricalDatasetMeta meta = loadDatasetMeta();
        List<HistoricalWindPointSeriesDTO.MonthlyWindPointDTO> items = loadMonthlyItems(lat, lon, startYear, endYear);
        if (items.isEmpty()) {
            throw new ResourceNotFoundException(
                    "No historical wind data found for dataset " + DATASET_CODE
                            + buildRangeSuffix(startYear, endYear)
            );
        }

        HistoricalWindPointSeriesDTO response = new HistoricalWindPointSeriesDTO();
        response.setDatasetCode(meta.datasetCode());
        response.setDatasetName(meta.datasetName());
        response.setStartYear(startYear);
        response.setEndYear(endYear);
        response.setTotal(items.size());
        response.setLocation(new HistoricalWindPointSeriesDTO.LocationInfo(lat, lon));
        response.setItems(items);
        return response;
    }

    public HistoricalWindMonthlyOverviewDTO queryMonthlyOverview(Integer startYear, Integer endYear) {
        validateYearRange(startYear, endYear);

        HistoricalDatasetMeta meta = loadDatasetMeta();
        List<HistoricalWindMonthlyOverviewDTO.MonthlyOverviewItemDTO> items =
                loadMonthlyOverviewItems(startYear, endYear);
        if (items.isEmpty()) {
            throw new ResourceNotFoundException(
                    "No historical wind data found for dataset " + DATASET_CODE
                            + buildRangeSuffix(startYear, endYear)
            );
        }

        HistoricalWindMonthlyOverviewDTO response = new HistoricalWindMonthlyOverviewDTO();
        response.setDatasetCode(meta.datasetCode());
        response.setDatasetName(meta.datasetName());
        response.setStartYear(startYear);
        response.setEndYear(endYear);
        response.setTotal(items.size());
        response.setGrid(new HistoricalWindMonthlyOverviewDTO.GridInfo(
                meta.gridWidth(),
                meta.gridHeight(),
                meta.lonMin(),
                meta.lonMax(),
                meta.latMin(),
                meta.latMax()
        ));
        response.setItems(items);
        return response;
    }

    private HistoricalDatasetMeta loadDatasetMeta() {
        String sql = """
                SELECT dataset_code, dataset_name, grid_width, grid_height, lon_min, lon_max, lat_min, lat_max
                FROM historical_wind_metadata
                WHERE dataset_code = :datasetCode
                """;
        MapSqlParameterSource params = new MapSqlParameterSource("datasetCode", DATASET_CODE);
        List<HistoricalDatasetMeta> metas = jdbcTemplate.query(sql, params, (rs, rowNum) ->
                new HistoricalDatasetMeta(
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
            throw new ResourceNotFoundException("Historical wind dataset not found: " + DATASET_CODE);
        }
        return metas.get(0);
    }

    private List<HistoricalWindPointSeriesDTO.MonthlyWindPointDTO> loadMonthlyItems(
            double lat,
            double lon,
            Integer startYear,
            Integer endYear) {
        HistoricalDatasetMeta meta = loadDatasetMeta();
        PointSampleContext pointContext = buildPointSampleContext(meta, lat, lon);
        StringBuilder sql = new StringBuilder("""
                SELECT
                    d.year,
                    d.month,
                    d.month_label,
                    d.month_start,
                    d.u_time,
                    d.u_valid_time,
                    d.gust_time,
                    d.gust_step_hours,
                    d.gust_valid_time,
                    substring(d.u_component from :u00Offset for 4) AS u00_bytes,
                    substring(d.u_component from :u01Offset for 4) AS u01_bytes,
                    substring(d.u_component from :u10Offset for 4) AS u10_bytes,
                    substring(d.u_component from :u11Offset for 4) AS u11_bytes,
                    substring(d.v_component from :v00Offset for 4) AS v00_bytes,
                    substring(d.v_component from :v01Offset for 4) AS v01_bytes,
                    substring(d.v_component from :v10Offset for 4) AS v10_bytes,
                    substring(d.v_component from :v11Offset for 4) AS v11_bytes,
                    substring(d.gust_component from :g00Offset for 4) AS g00_bytes,
                    substring(d.gust_component from :g01Offset for 4) AS g01_bytes,
                    substring(d.gust_component from :g10Offset for 4) AS g10_bytes,
                    substring(d.gust_component from :g11Offset for 4) AS g11_bytes
                FROM historical_wind_monthly_data d
                JOIN historical_wind_metadata m ON m.id = d.metadata_id
                WHERE m.dataset_code = :datasetCode
                """);
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("datasetCode", DATASET_CODE)
                .addValue("u00Offset", pointContext.u00Offset())
                .addValue("u01Offset", pointContext.u01Offset())
                .addValue("u10Offset", pointContext.u10Offset())
                .addValue("u11Offset", pointContext.u11Offset())
                .addValue("v00Offset", pointContext.u00Offset())
                .addValue("v01Offset", pointContext.u01Offset())
                .addValue("v10Offset", pointContext.u10Offset())
                .addValue("v11Offset", pointContext.u11Offset())
                .addValue("g00Offset", pointContext.u00Offset())
                .addValue("g01Offset", pointContext.u01Offset())
                .addValue("g10Offset", pointContext.u10Offset())
                .addValue("g11Offset", pointContext.u11Offset());
        appendYearFilters(sql, params, startYear, endYear);
        sql.append("\nORDER BY d.year, d.month");

        return jdbcTemplate.query(sql.toString(), params, (rs, rowNum) -> mapMonthlyPoint(rs, pointContext));
    }

    private List<HistoricalWindMonthlyOverviewDTO.MonthlyOverviewItemDTO> loadMonthlyOverviewItems(
            Integer startYear,
            Integer endYear) {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    d.year,
                    d.month,
                    d.month_label,
                    d.month_start,
                    d.u_time,
                    d.u_valid_time,
                    d.gust_time,
                    d.gust_step_hours,
                    d.gust_valid_time,
                    d.u_min,
                    d.u_max,
                    d.v_min,
                    d.v_max,
                    d.gust_min,
                    d.gust_max,
                    d.data_size,
                    d.source_file_name,
                    d.source_file_path,
                    d.source_file_size_bytes,
                    d.imported_at
                FROM historical_wind_monthly_data d
                JOIN historical_wind_metadata m ON m.id = d.metadata_id
                WHERE m.dataset_code = :datasetCode
                """);
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("datasetCode", DATASET_CODE);
        appendYearFilters(sql, params, startYear, endYear);
        sql.append("\nORDER BY d.year, d.month");

        return jdbcTemplate.query(sql.toString(), params, (rs, rowNum) -> {
            HistoricalWindMonthlyOverviewDTO.MonthlyOverviewItemDTO dto =
                    new HistoricalWindMonthlyOverviewDTO.MonthlyOverviewItemDTO();
            dto.setYear(rs.getInt("year"));
            dto.setMonth(rs.getInt("month"));
            dto.setMonthLabel(rs.getString("month_label"));
            dto.setMonthStart(rs.getObject("month_start", java.time.LocalDate.class));
            dto.setUTime(rs.getObject("u_time", OffsetDateTime.class));
            dto.setUValidTime(rs.getObject("u_valid_time", OffsetDateTime.class));
            dto.setGustTime(rs.getObject("gust_time", OffsetDateTime.class));
            dto.setGustStepHours(getNullableDouble(rs, "gust_step_hours"));
            dto.setGustValidTime(rs.getObject("gust_valid_time", OffsetDateTime.class));
            dto.setUMin(rs.getFloat("u_min"));
            dto.setUMax(rs.getFloat("u_max"));
            dto.setVMin(rs.getFloat("v_min"));
            dto.setVMax(rs.getFloat("v_max"));
            dto.setGustMin(rs.getFloat("gust_min"));
            dto.setGustMax(rs.getFloat("gust_max"));
            dto.setDataSize(rs.getInt("data_size"));
            dto.setSourceFileName(rs.getString("source_file_name"));
            dto.setSourceFilePath(rs.getString("source_file_path"));
            dto.setSourceFileSizeBytes(getNullableLong(rs, "source_file_size_bytes"));
            dto.setImportedAt(rs.getObject("imported_at", OffsetDateTime.class));
            return dto;
        });
    }

    private void appendYearFilters(
            StringBuilder sql,
            MapSqlParameterSource params,
            Integer startYear,
            Integer endYear) {
        if (startYear != null) {
            sql.append("\n  AND d.year >= :startYear");
            params.addValue("startYear", startYear);
        }
        if (endYear != null) {
            sql.append("\n  AND d.year <= :endYear");
            params.addValue("endYear", endYear);
        }
    }

    private HistoricalWindPointSeriesDTO.MonthlyWindPointDTO mapMonthlyPoint(
            ResultSet rs,
            PointSampleContext pointContext) throws SQLException {
        float u00 = bytesToFloat(rs.getBytes("u00_bytes"));
        float u01 = bytesToFloat(rs.getBytes("u01_bytes"));
        float u10 = bytesToFloat(rs.getBytes("u10_bytes"));
        float u11 = bytesToFloat(rs.getBytes("u11_bytes"));
        float v00 = bytesToFloat(rs.getBytes("v00_bytes"));
        float v01 = bytesToFloat(rs.getBytes("v01_bytes"));
        float v10 = bytesToFloat(rs.getBytes("v10_bytes"));
        float v11 = bytesToFloat(rs.getBytes("v11_bytes"));
        float g00 = bytesToFloat(rs.getBytes("g00_bytes"));
        float g01 = bytesToFloat(rs.getBytes("g01_bytes"));
        float g10 = bytesToFloat(rs.getBytes("g10_bytes"));
        float g11 = bytesToFloat(rs.getBytes("g11_bytes"));

        HistoricalWindPointSeriesDTO.MonthlyWindPointDTO dto =
                new HistoricalWindPointSeriesDTO.MonthlyWindPointDTO();
        dto.setYear(rs.getInt("year"));
        dto.setMonth(rs.getInt("month"));
        dto.setMonthLabel(rs.getString("month_label"));
        dto.setMonthStart(rs.getObject("month_start", java.time.LocalDate.class));
        dto.setUTime(rs.getObject("u_time", OffsetDateTime.class));
        dto.setUValidTime(rs.getObject("u_valid_time", OffsetDateTime.class));
        dto.setGustTime(rs.getObject("gust_time", OffsetDateTime.class));
        dto.setGustStepHours(getNullableDouble(rs, "gust_step_hours"));
        dto.setGustValidTime(rs.getObject("gust_valid_time", OffsetDateTime.class));

        if (containsInvalid(u00, u01, u10, u11, v00, v01, v10, v11)) {
            dto.setWind(null);
        } else {
            double u = bilinearInterpolate(u00, u01, u10, u11, pointContext.xWeight(), pointContext.yWeight());
            double v = bilinearInterpolate(v00, v01, v10, v11, pointContext.xWeight(), pointContext.yWeight());
            double speed = Math.sqrt(u * u + v * v);
            double direction = Math.toDegrees(Math.atan2(u, v));
            if (direction < 0) {
                direction += 360.0;
            }
            dto.setWind(new HistoricalWindPointSeriesDTO.WindVectorDTO(
                    round(u),
                    round(v),
                    round(speed),
                    round(direction)
            ));
        }

        if (containsInvalid(g00, g01, g10, g11)) {
            dto.setGust(null);
        } else {
            double gustValue = bilinearInterpolate(g00, g01, g10, g11, pointContext.xWeight(), pointContext.yWeight());
            dto.setGust(gustValue <= -9000.0 ? null : round(gustValue));
        }
        return dto;
    }

    private PointSampleContext buildPointSampleContext(HistoricalDatasetMeta meta, double lat, double lon) {
        double adjustedLon = adjustLongitude(lon, meta.lonMin(), meta.lonMax());
        double x = ((adjustedLon - meta.lonMin()) / (meta.lonMax() - meta.lonMin())) * (meta.gridWidth() - 1);
        double y = ((meta.latMax() - lat) / (meta.latMax() - meta.latMin())) * (meta.gridHeight() - 1);
        if (x < 0 || x >= meta.gridWidth() - 1 || y < 0 || y >= meta.gridHeight() - 1) {
            throw new ResourceNotFoundException("Requested point is outside the historical wind grid");
        }

        int x0 = (int) Math.floor(x);
        int x1 = x0 + 1;
        int y0 = (int) Math.floor(y);
        int y1 = y0 + 1;
        return new PointSampleContext(
                x - x0,
                y - y0,
                toByteaOffset(meta.gridWidth(), x0, y0),
                toByteaOffset(meta.gridWidth(), x1, y0),
                toByteaOffset(meta.gridWidth(), x0, y1),
                toByteaOffset(meta.gridWidth(), x1, y1)
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

    private double bilinearInterpolate(float q00, float q01, float q10, float q11, double xWeight, double yWeight) {
        return (1 - xWeight) * (1 - yWeight) * q00
                + xWeight * (1 - yWeight) * q01
                + (1 - xWeight) * yWeight * q10
                + xWeight * yWeight * q11;
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

    private record PointSampleContext(
            double xWeight,
            double yWeight,
            int u00Offset,
            int u01Offset,
            int u10Offset,
            int u11Offset) {}
}
