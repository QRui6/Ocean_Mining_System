<template>
    <div class="organization-chart">
        <!-- 根节点 -->
        <div class="org-level">
            <div class="org-node root-node" :style="{ backgroundColor: data.color }">
                <div class="node-title">{{ data.name }}</div>
                <div v-if="data.nameEn" class="node-subtitle">{{ data.nameEn }}</div>
            </div>
        </div>
        
        <!-- 连接线 -->
        <div v-if="data.children && data.children.length > 0" class="connector-line"></div>
        
        <!-- 子节点 -->
        <div v-if="data.children && data.children.length > 0" class="org-level children-level">
            <div class="org-row">
                <div v-for="(child, index) in data.children" :key="index" class="org-branch">
                    <!-- 垂直连接线 -->
                    <div class="vertical-line"></div>
                    
                    <!-- 子节点 -->
                    <div class="org-node child-node" 
                         :style="{ backgroundColor: child.color }"
                         @click="handleNodeClick(child)">
                        <div class="node-title">{{ child.name }}</div>
                        <div v-if="child.nameEn" class="node-subtitle">{{ child.nameEn }}</div>
                        <div v-if="child.description" class="node-description">{{ child.description }}</div>
                    </div>
                    
                    <!-- 递归渲染孙节点 -->
                    <template v-if="child.children && child.children.length > 0">
                        <div class="connector-line small"></div>
                        <div class="org-row sub-row">
                            <div v-for="(grandchild, gIndex) in child.children" :key="gIndex" class="org-branch small">
                                <div class="vertical-line small"></div>
                                <div class="org-node grandchild-node" 
                                     :style="{ backgroundColor: grandchild.color }"
                                     @click="handleNodeClick(grandchild)">
                                    <div class="node-title small">{{ grandchild.name }}</div>
                                    <div v-if="grandchild.description" class="node-description small">
                                        {{ grandchild.description }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'OrganizationChart',
    props: {
        data: {
            type: Object,
            required: true
        }
    },
    emits: ['nodeClick'],
    setup(props, { emit }) {
        const handleNodeClick = (node) => {
            if (node.clickable !== false) {
                emit('nodeClick', node);
            }
        };
        
        return {
            handleNodeClick
        };
    }
};
</script>

<style scoped>
.organization-chart {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    min-height: 100%;
    width: 100%;
    overflow-x: auto;  /* 允许横向滚动 */
    overflow-y: auto;  /* 允许纵向滚动 */
}

.org-level {
    display: flex;
    justify-content: center;
    margin: 1rem 0;
}

.org-row {
    display: flex;
    justify-content: center;
    gap: 1.5rem;  /* 减小间距 */
    flex-wrap: wrap;  /* 允许换行 */
    max-width: 100%;
}

.sub-row {
    gap: 1rem;
    margin-top: 1rem;
}

.org-branch {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
}

/* 为每个分支添加顶部连接点 */
.org-branch::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 3px;
    height: 40px;
    background: #64C8FF;
    box-shadow: 0 0 10px rgba(100, 200, 255, 0.9);
    border-radius: 2px;
    z-index: 1;
}

.org-branch.small {
    min-width: 150px;
}

/* 小分支的连接线 */
.org-branch.small::before {
    height: 30px;
}

/* 节点样式 - 允许文字换行 */
.org-node {
    padding: 1rem 1.5rem;
    border-radius: 8px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    min-width: 180px;
    max-width: 280px;
    text-align: center;
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
    word-wrap: break-word;
    word-break: break-all;
    white-space: normal;
    line-height: 1.5;
    background-clip: padding-box;  /* 确保背景不被遮挡 */
    z-index: 2;  /* 确保节点在连接线上方 */
}

.org-node:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
    border-color: rgba(255, 255, 255, 0.6);
}

.root-node {
    min-width: 220px;
    max-width: 300px;
    padding: 1.5rem 2rem;
    font-size: 1.1rem;
}

.child-node {
    min-width: 160px;
    max-width: 240px;
}

.grandchild-node {
    min-width: 140px;
    max-width: 280px;  /* 孙节点允许更宽，因为文字较多 */
    padding: 0.75rem 1rem;
}

.node-title {
    font-weight: bold;
    color: #1a1a1a;
    margin-bottom: 0.25rem;
    font-size: 0.95rem;
    word-wrap: break-word;
    word-break: keep-all;  /* 中文尽量不在词中间断开 */
    line-height: 1.4;
}

.node-title.small {
    font-size: 0.85rem;
}

.node-subtitle {
    font-size: 0.75rem;
    color: #4a4a4a;
    font-style: italic;
    word-wrap: break-word;
    line-height: 1.3;
}

.node-description {
    font-size: 0.7rem;
    color: #2a2a2a;
    margin-top: 0.5rem;
    line-height: 1.4;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    word-wrap: break-word;
    word-break: keep-all;  /* 中文尽量不在词中间断开 */
}

.node-description.small {
    font-size: 0.65rem;
    margin-top: 0.25rem;
    padding-top: 0.25rem;
}

/* 连接线样式 - 增强可见度 */
.connector-line {
    width: 3px;
    height: 40px;
    background: linear-gradient(to bottom, 
        #64C8FF,
        #64C8FF
    );
    margin: 0;
    box-shadow: 0 0 10px rgba(100, 200, 255, 0.9);
    border-radius: 2px;
}

.connector-line.small {
    height: 30px;
    width: 3px;
}

.vertical-line {
    width: 3px;
    height: 40px;
    background: linear-gradient(to bottom, 
        #64C8FF,
        #64C8FF
    );
    margin: 0;
    box-shadow: 0 0 10px rgba(100, 200, 255, 0.9);
    border-radius: 2px;
}

.vertical-line.small {
    height: 30px;
    width: 3px;
}

/* 水平连接线 - 重新设计 */
.children-level {
    position: relative;
    padding-top: 40px;  /* 为垂直线留出空间 */
}

.children-level::before {
    content: '';
    position: absolute;
    top: 0;
    left: 5%;
    right: 5%;
    height: 3px;
    background: #64C8FF;
    box-shadow: 0 0 10px rgba(100, 200, 255, 0.9);
    border-radius: 2px;
}

/* 响应式 */
@media (max-width: 1024px) {
    .org-row {
        gap: 1rem;
    }
    
    .org-node {
        min-width: 150px;
        padding: 0.75rem 1rem;
    }
    
    .root-node {
        min-width: 200px;
    }
}
</style>
