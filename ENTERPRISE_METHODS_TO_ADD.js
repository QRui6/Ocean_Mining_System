// ==================== 企业主体功能方法 ====================
// 将以下方法添加到 App.vue 的 setup() 函数中，与其他 handle 方法放在一起

/**
 * 处理企业主体显示/隐藏
 * @param {Boolean} show - 是否显示
 */
const handleShowEnterprise = (show) => {
    console.log('🏢 App.vue handleShowEnterprise 被调用, show:', show);
    
    activePanels.value.enterprise = show;
    
    if (show) {
        // 显示企业扩散点
        if (!enterpriseMarkerManager && mapContainerRef.value?.viewer) {
            enterpriseMarkerManager = new EnterpriseMarkerManager(mapContainerRef.value.viewer);
        }
        if (enterpriseMarkerManager) {
            enterpriseMarkerManager.addEnterpriseMarkers(CHINA_ENTERPRISES);
            enterpriseMarkerManager.flyToOverview();
        }
    } else {
        // 隐藏企业扩散点
        if (enterpriseMarkerManager) {
            enterpriseMarkerManager.clear();
        }
    }
};

/**
 * 切换企业主体面板
 */
const toggleEnterprise = () => {
    handleShowEnterprise(!activePanels.value.enterprise);
};

// ==================== 在 return 语句中添加 ====================
// 在 setup() 函数的 return { ... } 中添加以下两行：
//     handleShowEnterprise,
//     toggleEnterprise,
