package com.oceanmining.monitoring.service;

import com.oceanmining.monitoring.repository.MiningRegionRepository;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Objects;
import org.springframework.stereotype.Service;

/** Presentation changes are applied at download time; stored source text is preserved. */
@Service
public class BulletinExportService {
    private final MiningRegionRepository regions;
    public BulletinExportService(MiningRegionRepository regions) { this.regions = regions; }

    public static String initialTime(LocalDate date, String cycle) {
        if (date == null || cycle == null || !cycle.matches("(?i)t?(00|06|12|18)")) return "未提供";
        int hour = Integer.parseInt(cycle.replaceAll("(?i)t", ""));
        return date.atTime(hour, 0).atZone(ZoneOffset.UTC).withZoneSameInstant(ZoneId.of("Asia/Shanghai"))
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) + " UTC+08:00";
    }

    public String normalize(String source, Long regionId, String regionName, LocalDate date, String cycle) {
        var region = regionId == null ? null : regions.findById(regionId).orElse(null);
        String longitude = region == null || region.getCenterLng() == null ? "--" : region.getCenterLng().toPlainString();
        String latitude = region == null || region.getCenterLat() == null ? "--" : region.getCenterLat().toPlainString();
        StringBuilder result = new StringBuilder("预报：" + Objects.toString(regionName, "--")
                + "；经度：" + longitude + "；纬度：" + latitude + "\n初始时间：" + initialTime(date, cycle) + "\n");
        for (String line : Objects.toString(source, "").split("\\R", -1)) {
            if (line.strip().matches("^(预报区域|区域名称|区域代码|生成时间|报文生成时间|初始时间|基准日期|运行周期|运行批次)\\s*[:：].*$")) continue;
            result.append(line.replace("UNKNOWN", "未提供").replace("STABLE", "平稳").replace("RISING", "上升").replace("FALLING", "下降").replace("SAFE", "正常").replace("CRITICAL", "严重").replace("WARNING", "预警").replace("INFO", "关注").replace("重点峰值时段", "峰值时段").replace("重点时段分析", "时段分析").replace("未来重点时段", "未来时段").replace("未来重点日期", "未来日期")).append('\n');
        }
        return result.toString();
    }
}
