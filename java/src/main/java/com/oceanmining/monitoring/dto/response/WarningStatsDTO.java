package com.oceanmining.monitoring.dto.response;

public class WarningStatsDTO {

    private Long total;
    private Long active;
    private Long resolved;
    private Long info;
    private Long warning;
    private Long critical;

    public Long getTotal() { return total; }
    public void setTotal(Long total) { this.total = total; }
    public Long getActive() { return active; }
    public void setActive(Long active) { this.active = active; }
    public Long getResolved() { return resolved; }
    public void setResolved(Long resolved) { this.resolved = resolved; }
    public Long getInfo() { return info; }
    public void setInfo(Long info) { this.info = info; }
    public Long getWarning() { return warning; }
    public void setWarning(Long warning) { this.warning = warning; }
    public Long getCritical() { return critical; }
    public void setCritical(Long critical) { this.critical = critical; }
}
