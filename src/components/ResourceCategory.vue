<template>
    <div class="space-y-3">
        <h4 class="text-base font-bold px-3 py-2 rounded-lg" 
            style="background: var(--panel-item-bg); color: var(--accent-cyan);">
            {{ title }}
        </h4>
        
        <div class="space-y-2">
            <div v-for="(resource, index) in resources" :key="index"
                 class="p-3 rounded-lg border transition-all hover:border-cyan-500/50"
                 style="background: var(--panel-item-bg); border-color: var(--panel-border);">
                
                <!-- 资源类型 -->
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-2 h-2 rounded-full" style="background: var(--accent-cyan);"></div>
                    <span class="font-bold text-base" style="color: var(--text-primary);">{{ resource.type }}</span>
                </div>
                
                <!-- 资源信息表格 -->
                <table class="w-full text-sm">
                    <tbody>
                        <tr v-if="resource.distribution" class="border-b" style="border-color: var(--panel-border);">
                            <td class="py-2 pr-3 font-medium whitespace-nowrap" style="color: var(--text-secondary);">分布区域</td>
                            <td class="py-2" style="color: var(--text-primary);">{{ resource.distribution }}</td>
                        </tr>
                        <tr v-if="resource.reserves" class="border-b" style="border-color: var(--panel-border);">
                            <td class="py-2 pr-3 font-medium whitespace-nowrap" style="color: var(--text-secondary);">资源量与价值</td>
                            <td class="py-2" style="color: var(--text-primary);">{{ resource.reserves }}</td>
                        </tr>
                        <tr v-if="resource.features">
                            <td class="py-2 pr-3 font-medium whitespace-nowrap align-top" style="color: var(--text-secondary);">核心特点</td>
                            <td class="py-2" style="color: var(--text-primary);">{{ resource.features }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ResourceCategory',
    props: {
        title: {
            type: String,
            required: true
        },
        resources: {
            type: Array,
            required: true
        }
    }
};
</script>

<style scoped>
table {
    border-collapse: collapse;
}

td {
    vertical-align: top;
}
</style>
