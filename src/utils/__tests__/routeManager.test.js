import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RouteManager } from '../routeManager.js';
import * as Cesium from 'cesium';

// Mock Cesium
vi.mock('cesium', () => ({
    Cartesian3: {
        fromDegrees: vi.fn((lng, lat) => ({ lng, lat, z: 0 }))
    },
    Color: {
        fromCssColorString: vi.fn((color) => ({ color }))
    },
    PolylineGlowMaterialProperty: vi.fn(function(options) {
        this.glowPower = options.glowPower;
        this.color = options.color;
    }),
    ClassificationType: {
        BOTH: 'BOTH'
    }
}));

// Mock constants
vi.mock('../../constants.js', () => ({
    ROUTE_CONFIG: {
        colors: {
            normal: '#FFD700',
            highlighted: '#FF4444'
        },
        width: {
            normal: 3,
            highlighted: 5
        },
        glowPower: {
            normal: 0.2,
            highlighted: 0.4
        },
        regions: {
            china: {
                minLng: 100,
                maxLng: 130,
                minLat: 15,
                maxLat: 40
            }
        },
        portProximityThreshold: 2.0
    }
}));

// Mock maritime silk road ports
vi.mock('../../data/maritimeSilkRoadPorts.js', () => ({
    MARITIME_SILK_ROAD_PORTS: [
        { id: 'quanzhou', coordinates: [118.5833, 24.9139] },
        { id: 'guangzhou', coordinates: [113.2644, 23.1291] }
    ]
}));

describe('RouteManager - Task 3.2: 航线渲染和显示控制', () => {
    let mockViewer;
    let routeManager;
    let mockEntities;

    beforeEach(() => {
        // Create mock entities collection
        mockEntities = [];
        mockViewer = {
            entities: {
                add: vi.fn((entity) => {
                    mockEntities.push(entity);
                    return entity;
                }),
                remove: vi.fn((entity) => {
                    const index = mockEntities.indexOf(entity);
                    if (index > -1) {
                        mockEntities.splice(index, 1);
                    }
                })
            }
        };

        routeManager = new RouteManager(mockViewer);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('_renderRoute() 方法', () => {
        it('应该渲染单条航线并设置正确的属性', () => {
            const routeData = {
                feature: { id: 1 },
                coordinates: [[120, 30], [125, 35], [130, 40]],
                region: 'china',
                nearbyPorts: ['quanzhou']
            };

            const entity = routeManager._renderRoute(routeData, false);

            // 验证实体被创建
            expect(entity).toBeDefined();
            expect(mockViewer.entities.add).toHaveBeenCalledTimes(1);

            // 验证实体属性
            expect(entity.properties).toEqual({
                type: 'maritime_silk_road_route',
                routeId: 1,
                isHighlighted: false,
                nearbyPorts: ['quanzhou']
            });
        });

        it('应该使用高亮颜色和宽度渲染高亮航线', () => {
            const routeData = {
                feature: { id: 2 },
                coordinates: [[120, 30], [125, 35]],
                region: 'china',
                nearbyPorts: []
            };

            const entity = routeManager._renderRoute(routeData, true);

            // 验证高亮状态
            expect(entity.properties.isHighlighted).toBe(true);
        });
    });

    describe('show() 方法', () => {
        beforeEach(() => {
            // 设置测试数据
            routeManager.allRoutes = [
                {
                    feature: { id: 1 },
                    coordinates: [[120, 30], [125, 35]],
                    region: 'china',
                    nearbyPorts: ['quanzhou']
                },
                {
                    feature: { id: 2 },
                    coordinates: [[130, 35], [135, 40]],
                    region: 'china',
                    nearbyPorts: []
                }
            ];
        });

        it('应该显示所有筛选后的航线', () => {
            routeManager.show();

            // 验证所有航线都被渲染
            expect(routeManager.routeEntities.length).toBe(2);
            expect(mockViewer.entities.add).toHaveBeenCalledTimes(2);

            // 验证显示状态
            expect(routeManager.isVisible).toBe(true);
        });

        it('如果已经显示，应该不重复渲染', () => {
            routeManager.show();
            const firstCallCount = mockViewer.entities.add.mock.calls.length;

            routeManager.show();
            const secondCallCount = mockViewer.entities.add.mock.calls.length;

            // 第二次调用不应该增加渲染次数
            expect(secondCallCount).toBe(firstCallCount);
        });

        it('单条航线失败不应该影响其他航线', () => {
            // 添加一条会导致错误的航线
            routeManager.allRoutes.push({
                feature: { id: 3 },
                coordinates: null, // 无效坐标
                region: 'china',
                nearbyPorts: []
            });

            // 应该不抛出错误
            expect(() => routeManager.show()).not.toThrow();

            // 应该渲染成功的航线
            expect(routeManager.routeEntities.length).toBe(2);
        });
    });

    describe('hide() 方法', () => {
        beforeEach(() => {
            routeManager.allRoutes = [
                {
                    feature: { id: 1 },
                    coordinates: [[120, 30], [125, 35]],
                    region: 'china',
                    nearbyPorts: []
                }
            ];
            routeManager.show();
        });

        it('应该隐藏所有航线', () => {
            routeManager.hide();

            // 验证所有实体被移除
            expect(mockViewer.entities.remove).toHaveBeenCalledTimes(1);

            // 验证数组被清空
            expect(routeManager.routeEntities.length).toBe(0);

            // 验证显示状态
            expect(routeManager.isVisible).toBe(false);
        });
    });

    describe('toggle() 方法', () => {
        beforeEach(() => {
            routeManager.allRoutes = [
                {
                    feature: { id: 1 },
                    coordinates: [[120, 30], [125, 35]],
                    region: 'china',
                    nearbyPorts: []
                }
            ];
        });

        it('应该从隐藏切换到显示', () => {
            expect(routeManager.isVisible).toBe(false);

            routeManager.toggle();

            expect(routeManager.isVisible).toBe(true);
            expect(routeManager.routeEntities.length).toBe(1);
        });

        it('应该从显示切换到隐藏', () => {
            routeManager.show();
            expect(routeManager.isVisible).toBe(true);

            routeManager.toggle();

            expect(routeManager.isVisible).toBe(false);
            expect(routeManager.routeEntities.length).toBe(0);
        });
    });

    describe('_createRouteEntity() 方法', () => {
        it('应该创建带有正确参数的航线实体', () => {
            const coordinates = [[120, 30], [125, 35], [130, 40]];
            const color = '#FFD700';
            const width = 3;
            const glowPower = 0.2;

            const entity = routeManager._createRouteEntity(coordinates, color, width, glowPower);

            // 验证实体被创建
            expect(entity).toBeDefined();
            expect(mockViewer.entities.add).toHaveBeenCalledTimes(1);

            // 验证 Cartesian3.fromDegrees 被调用
            expect(Cesium.Cartesian3.fromDegrees).toHaveBeenCalledTimes(3);
        });
    });

    describe('highlightRoutesForPort() 方法 - Task 5.1', () => {
        beforeEach(() => {
            // 设置测试数据 - 包含不同港口的航线
            routeManager.allRoutes = [
                {
                    feature: { id: 1 },
                    coordinates: [[118, 25], [119, 26]],
                    region: 'china',
                    nearbyPorts: ['quanzhou', 'xiamen']
                },
                {
                    feature: { id: 2 },
                    coordinates: [[113, 23], [114, 24]],
                    region: 'china',
                    nearbyPorts: ['guangzhou']
                },
                {
                    feature: { id: 3 },
                    coordinates: [[120, 30], [121, 31]],
                    region: 'china',
                    nearbyPorts: ['quanzhou']
                }
            ];
        });

        it('应该高亮显示连接指定港口的所有航线', () => {
            routeManager.highlightRoutesForPort('quanzhou');

            // 验证高亮了2条航线（id 1 和 3）
            expect(routeManager.highlightedEntities.length).toBe(2);
            expect(mockViewer.entities.add).toHaveBeenCalledTimes(2);

            // 验证高亮航线的属性
            routeManager.highlightedEntities.forEach(entity => {
                expect(entity.properties.isHighlighted).toBe(true);
            });
        });

        it('应该只高亮指定港口的航线', () => {
            routeManager.highlightRoutesForPort('guangzhou');

            // 验证只高亮了1条航线（id 2）
            expect(routeManager.highlightedEntities.length).toBe(1);
            expect(routeManager.highlightedEntities[0].properties.routeId).toBe(2);
        });

        it('当港口没有相关航线时应该正确处理', () => {
            routeManager.highlightRoutesForPort('unknown_port');

            // 验证没有高亮任何航线
            expect(routeManager.highlightedEntities.length).toBe(0);
            expect(mockViewer.entities.add).not.toHaveBeenCalled();
        });

        it('应该在高亮新航线前清除之前的高亮', () => {
            // 第一次高亮
            routeManager.highlightRoutesForPort('quanzhou');
            const firstHighlightCount = routeManager.highlightedEntities.length;
            expect(firstHighlightCount).toBe(2);

            // 第二次高亮不同的港口
            routeManager.highlightRoutesForPort('guangzhou');

            // 验证之前的高亮被清除
            expect(mockViewer.entities.remove).toHaveBeenCalledTimes(2);
            // 验证新的高亮
            expect(routeManager.highlightedEntities.length).toBe(1);
        });

        it('单条航线渲染失败不应该影响其他航线的高亮', () => {
            // 添加一条会导致错误的航线
            routeManager.allRoutes.push({
                feature: { id: 4 },
                coordinates: null, // 无效坐标
                region: 'china',
                nearbyPorts: ['quanzhou']
            });

            // 应该不抛出错误
            expect(() => routeManager.highlightRoutesForPort('quanzhou')).not.toThrow();

            // 应该高亮成功的航线（2条，不包括失败的那条）
            expect(routeManager.highlightedEntities.length).toBe(2);
        });

        it('应该使用高亮样式渲染航线', () => {
            routeManager.highlightRoutesForPort('quanzhou');

            // 验证所有高亮实体都标记为高亮
            routeManager.highlightedEntities.forEach(entity => {
                expect(entity.properties.isHighlighted).toBe(true);
                expect(entity.properties.nearbyPorts).toContain('quanzhou');
            });
        });
    });

    describe('clearHighlight() 方法 - Task 5.1', () => {
        beforeEach(() => {
            // 设置测试数据
            routeManager.allRoutes = [
                {
                    feature: { id: 1 },
                    coordinates: [[118, 25], [119, 26]],
                    region: 'china',
                    nearbyPorts: ['quanzhou']
                },
                {
                    feature: { id: 2 },
                    coordinates: [[120, 30], [121, 31]],
                    region: 'china',
                    nearbyPorts: ['quanzhou']
                }
            ];
        });

        it('应该清除所有高亮航线', () => {
            // 先高亮一些航线
            routeManager.highlightRoutesForPort('quanzhou');
            expect(routeManager.highlightedEntities.length).toBe(2);

            // 清除高亮
            routeManager.clearHighlight();

            // 验证所有高亮实体被移除
            expect(mockViewer.entities.remove).toHaveBeenCalledTimes(2);
            expect(routeManager.highlightedEntities.length).toBe(0);
        });

        it('当没有高亮航线时应该安全返回', () => {
            // 没有高亮任何航线
            expect(routeManager.highlightedEntities.length).toBe(0);

            // 调用清除方法
            routeManager.clearHighlight();

            // 验证没有调用 remove
            expect(mockViewer.entities.remove).not.toHaveBeenCalled();
        });

        it('应该是幂等的 - 多次调用不会产生错误', () => {
            // 先高亮一些航线
            routeManager.highlightRoutesForPort('quanzhou');

            // 多次清除
            routeManager.clearHighlight();
            routeManager.clearHighlight();
            routeManager.clearHighlight();

            // 验证没有错误，数组保持为空
            expect(routeManager.highlightedEntities.length).toBe(0);
        });

        it('应该清空 highlightedEntities 数组', () => {
            // 先高亮一些航线
            routeManager.highlightRoutesForPort('quanzhou');
            const initialLength = routeManager.highlightedEntities.length;
            expect(initialLength).toBeGreaterThan(0);

            // 清除高亮
            routeManager.clearHighlight();

            // 验证数组被清空
            expect(routeManager.highlightedEntities).toEqual([]);
            expect(routeManager.highlightedEntities.length).toBe(0);
        });
    });
});
