package com.oceanmining.monitoring.enums;

import java.time.Duration;

public enum ForecastRange {
    HOURS_12("12h", Duration.ofHours(12), "未来12小时"),
    DAYS_7("7d", Duration.ofDays(7), "未来7天"),
    DAYS_15("15d", Duration.ofDays(15), "未来15天");

    private final String code;
    private final Duration duration;
    private final String displayName;

    ForecastRange(String code, Duration duration, String displayName) {
        this.code = code;
        this.duration = duration;
        this.displayName = displayName;
    }

    public String getCode() {
        return code;
    }

    public Duration getDuration() {
        return duration;
    }

    public int getDays() {
        return Math.toIntExact(duration.toDays());
    }

    public String getDisplayName() {
        return displayName;
    }

    public static ForecastRange fromCode(String value) {
        for (ForecastRange range : values()) {
            if (range.code.equalsIgnoreCase(value)) {
                return range;
            }
        }
        throw new IllegalArgumentException("Unsupported forecast range: " + value + ". Use 12h, 7d or 15d.");
    }
}
