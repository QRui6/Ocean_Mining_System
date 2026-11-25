<template>
    <PipelineSafetyPanel :show="show" @close="emit('close')" @locate-site="emit('locate-site', $event)" />
</template>

<script setup>
import PipelineSafetyPanel from '../pipelinesafety/pipelinesafetypanel.vue';

defineProps({
    show: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['close', 'locate-site']);
</script>
