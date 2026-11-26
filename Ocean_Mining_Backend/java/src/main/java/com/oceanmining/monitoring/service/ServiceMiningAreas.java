package com.oceanmining.monitoring.service;

import com.oceanmining.monitoring.exception.ResourceNotFoundException;
import java.util.List;

/** The contract areas served by the forecast and warning workspaces. */
public final class ServiceMiningAreas {
    public record StationBinding(String sourceRegion, String label) {}
    public record Area(String id, String name, String ocean, List<StationBinding> stations) {}

    public static final List<Area> ALL = List.of(
        new Area("COMRAPMN1", "大洋协会 · CCZ 结核区", "太平洋 (CCZ)",
            List.of(new StationBinding("太平洋 (CCZ)", ""))),
        new Area("CMMPMN1", "中国五矿 · CCZ 结核区", "太平洋 (CCZ)",
            List.of(new StationBinding("太平洋 (CCZ)", ""))),
        new Area("COMRACRFC1", "大洋协会 · 西太平洋富钴结壳区", "西太平洋",
            List.of(new StationBinding("西太平洋", ""))),
        new Area("BPHDCPMN1", "北京先驱 · 西太平洋结核区", "西太平洋",
            List.of(new StationBinding("西太平洋", ""))),
        new Area("COMRAPMS1", "大洋协会 · 西南印度洋硫化物区", "西南印度洋",
            List.of(new StationBinding("印度洋", "东段"), new StationBinding("太平洋", "西段")))
    );

    // The Indian ridge contract includes both sets of polygons. Its raw ocean labels differ.
    // The Beijing Pioneer reserve uses the same area_id but is outside its exploration contract.
    public static final String CONTRACT_FILTER =
        "area_id=? AND category='Exploration' AND sponsor='中国' AND geometry IS NOT NULL";
    public static final String CONTRACT_BOUNDARY =
        "SELECT ST_UnaryUnion(ST_Collect(geometry)) AS g FROM mining_areas WHERE " + CONTRACT_FILTER;

    private ServiceMiningAreas() {}

    public static Area find(String id) {
        return ALL.stream().filter(area -> area.id().equals(id)).findFirst().orElse(null);
    }

    public static Area require(String id) {
        Area area = find(id);
        if (area == null) throw new ResourceNotFoundException("该矿区暂无预报与预警服务");
        return area;
    }
}
