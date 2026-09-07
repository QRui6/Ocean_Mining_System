package com.oceanmining.monitoring.dto.response;

import java.util.List;

public class TyphoonAreaEventPageDTO {

    private String areaId;
    private Integer startYear;
    private Integer endYear;
    private Double bufferKm;
    private String impactLevel;
    private Integer page;
    private Integer pageSize;
    private Long total;
    private List<TyphoonAreaEventDTO> items;

    public String getAreaId() { return areaId; }
    public void setAreaId(String areaId) { this.areaId = areaId; }

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
