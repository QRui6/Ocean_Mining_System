package com.oceanmining.monitoring.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;

public class SiteCurrentForecastHourlyDTO {

    private Long siteId;
    private Long regionId;
    private String regionName;
    private String siteCode;
    private String siteName;
    private LocalDate baseDate;
    private String runCycle;
    private LocalDate forecastDate;
    private ZonedDateTime forecastTime;
    private Integer forecastHour;
    private BigDecimal currentSpeed;
    private BigDecimal currentDir;

    public Long getSiteId() { return siteId; }
    public void setSiteId(Long siteId) { this.siteId = siteId; }

    public Long getRegionId() { return regionId; }
    public void setRegionId(Long regionId) { this.regionId = regionId; }

    public String getRegionName() { return regionName; }
    public void setRegionName(String regionName) { this.regionName = regionName; }

    public String getSiteCode() { return siteCode; }
    public void setSiteCode(String siteCode) { this.siteCode = siteCode; }

    public String getSiteName() { return siteName; }
    public void setSiteName(String siteName) { this.siteName = siteName; }

    public LocalDate getBaseDate() { return baseDate; }
    public void setBaseDate(LocalDate baseDate) { this.baseDate = baseDate; }

    public String getRunCycle() { return runCycle; }
    public void setRunCycle(String runCycle) { this.runCycle = runCycle; }

    public LocalDate getForecastDate() { return forecastDate; }
    public void setForecastDate(LocalDate forecastDate) { this.forecastDate = forecastDate; }

    public ZonedDateTime getForecastTime() { return forecastTime; }
    public void setForecastTime(ZonedDateTime forecastTime) { this.forecastTime = forecastTime; }

    public Integer getForecastHour() { return forecastHour; }
    public void setForecastHour(Integer forecastHour) { this.forecastHour = forecastHour; }

    public BigDecimal getCurrentSpeed() { return currentSpeed; }
    public void setCurrentSpeed(BigDecimal currentSpeed) { this.currentSpeed = currentSpeed; }

    public BigDecimal getCurrentDir() { return currentDir; }
    public void setCurrentDir(BigDecimal currentDir) { this.currentDir = currentDir; }
}
