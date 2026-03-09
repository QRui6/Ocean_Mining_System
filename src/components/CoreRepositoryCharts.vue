<template>
    <transition name="slide-up">
        <div v-if="show && selectedCountry" class="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 w-[900px]">
            <!-- 岩心库列表 -->
            <div class="tech-panel-enhanced p-6">
                <div class="flex items-center mb-4 border-b-2 border-cyan-500/30 pb-3">
                    <div class="w-1.5 h-6 bg-cyan-400 mr-3"></div>
                    <h3 class="text-xl font-bold text-white">三大岩芯库基本概况</h3>
                </div>

                <!-- 表格 -->
                <div class="overflow-hidden rounded-lg border border-cyan-500/30">
                    <table class="w-full text-white">
                        <thead class="bg-slate-800/80">
                            <tr>
                                <th class="px-4 py-3 text-left text-sm font-bold text-cyan-400">岩芯库</th>
                                <th class="px-4 py-3 text-center text-sm font-bold text-cyan-400">岩芯库长度（km）</th>
                                <th class="px-4 py-3 text-center text-sm font-bold text-cyan-400">岩芯所属大洋钻探计划</th>
                                <th class="px-4 py-3 text-left text-sm font-bold text-cyan-400">岩芯所属区域</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr 
                                v-for="(repo, index) in repositories" 
                                :key="index"
                                class="border-t border-slate-700/50 hover:bg-slate-800/50 transition-colors"
                            >
                                <td class="px-4 py-3 text-sm">{{ repo.name }}</td>
                                <td class="px-4 py-3 text-sm text-center">{{ repo.length }}</td>
                                <td class="px-4 py-3 text-sm text-center">{{ repo.programs }}</td>
                                <td class="px-4 py-3 text-sm">{{ repo.regions }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import { computed } from 'vue';

export default {
    name: 'CoreRepositoryCharts',
    props: {
        show: {
            type: Boolean,
            default: false
        },
        selectedCountry: {
            type: String,
            default: null
        }
    },
    setup(props) {
        // 岩心库数据（完全按照图片内容）
        const allRepositories = [
            { 
                name: '美国得克萨斯农工大学岩芯库', 
                length: '140', 
                programs: 'DSDP、ODP、IODP', 
                regions: '东太平洋、加勒比海、墨西哥湾、南大洋' 
            },
            { 
                name: '德国不来梅大学岩芯库', 
                length: '154', 
                programs: 'DSDP、ODP、IODP', 
                regions: '大西洋、北冰洋、地中海、黑海' 
            },
            { 
                name: '日本高知大学岩芯库', 
                length: '134', 
                programs: 'DSDP、ODP、IODP', 
                regions: '西太平洋、印度洋、白令海' 
            }
        ];

        // 始终显示所有岩心库
        const repositories = computed(() => {
            return allRepositories;
        });

        return {
            repositories
        };
    }
};
</script>

<style scoped>
.tech-panel-enhanced {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
    backdrop-filter: blur(20px);
    border: 2px solid rgba(6, 182, 212, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    border-radius: 8px;
}

.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s ease;
}

.slide-up-enter-from {
    opacity: 0;
    transform: translate(-50%, 20px);
}

.slide-up-leave-to {
    opacity: 0;
    transform: translate(-50%, 20px);
}
</style>
