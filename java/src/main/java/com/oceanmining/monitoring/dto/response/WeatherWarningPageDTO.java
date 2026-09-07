package com.oceanmining.monitoring.dto.response;

import java.util.List;

public class WeatherWarningPageDTO {

    private Integer page;
    private Integer pageSize;
    private Long total;
    private Integer totalPages;
    private List<WeatherWarningDTO> items;

    public Integer getPage() { return page; }
    public void setPage(Integer page) { this.page = page; }
    public Integer getPageSize() { return pageSize; }
    public void setPageSize(Integer pageSize) { this.pageSize = pageSize; }
    public Long getTotal() { return total; }
    public void setTotal(Long total) { this.total = total; }
    public Integer getTotalPages() { return totalPages; }
    public void setTotalPages(Integer totalPages) { this.totalPages = totalPages; }
    public List<WeatherWarningDTO> getItems() { return items; }
    public void setItems(List<WeatherWarningDTO> items) { this.items = items; }
}
