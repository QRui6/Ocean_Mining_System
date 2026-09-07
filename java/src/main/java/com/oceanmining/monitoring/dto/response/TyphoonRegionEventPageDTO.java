package com.oceanmining.monitoring.dto.response;

import java.util.List;

public class TyphoonRegionEventPageDTO {

    private Long regionId;
    private String regionCode;
    private String regionName;
    private Integer startYear;
    private Integer endYear;
    private Double bufferKm;
    private String impactLevel;
    private Integer page;
    private Integer pageSize;
    private Long total;
    private List<TyphoonAreaEventDTO> items;

    public Long getRegionId() { return regionId; }
    public void setRegionId(Long regionId) { this.regionId = regionId; }

    public String getRegionCode() { return regionCode; }
    public void setRegionCode(String regionCode) { this.regionCode = regionCode; }

    public String getRegionName() { return regionName; }
    public void setRegionName(String regionName) { this.regionName = regionName; }

    public Integer getStartYear() { return startYear; }
    public void setStartYear(Integer startYear) { this.startYear = startYear; }

    public Integer getEndYear() { return endYear; }
    public void setEndYear(Integer endYear) { this.endYear = endYear; }

    public Double getBufferKm() { return bufferKm; }
    public void setBufferKm(Double bufferKm) { this.bufferKm = bufferKm; }

    public String getImpactLevel() { return impactLevel; }
    public void setImpactLevel(String impactLevel) { this.impactLevel = impactLevel; }

    public Integer getPage() { return page; }
    public void setPage(Integer page) { this.page = page; }

    public Integer getPageSize() { return pageSize; }
    public void setPageSize(Integer pageSize) { this.pageSize = pageSize; }

    public Long getTotal() { return total; }
    public void setTotal(Long total) { this.total = total; }

    public List<TyphoonAreaEventDTO> getItems() { return items; }
    public void setItems(List<TyphoonAreaEventDTO> items) { this.items = items; }
}
