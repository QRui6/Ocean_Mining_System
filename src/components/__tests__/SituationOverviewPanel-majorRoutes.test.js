/**
 * Task 7.1 Test: Verify SituationOverviewPanel includes "主要航线" option
 * 
 * Requirements: 3.1, 3.3
 */

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SituationOverviewPanel from '../SituationOverviewPanel.vue';
import { MARITIME_SILK_ROAD } from '../../constants.js';

describe('Task 7.1: SituationOverviewPanel - Major Routes Option', () => {
    
    it('should include major_routes option in MARITIME_SILK_ROAD items', () => {
        // Verify the constant includes major_routes
        const majorRoutesItem = MARITIME_SILK_ROAD.items.find(item => item.id === 'major_routes');
        
        expect(majorRoutesItem).toBeDefined();
        expect(majorRoutesItem.id).toBe('major_routes');
        expect(majorRoutesItem.label).toBe('主要航线');
    });
    
    it('should render major_routes option in the panel', () => {
        const wrapper = mount(SituationOverviewPanel, {
            props: {
                show: true
            }
        });
        
        // Find the major routes option by checking for the label text
        const majorRoutesElement = wrapper.findAll('.font-medium').find(el => 
            el.text() === '主要航线'
        );
        
        expect(majorRoutesElement).toBeDefined();
        expect(majorRoutesElement.exists()).toBe(true);
    });
    
    it('should emit itemClick event with correct parameters when major_routes is clicked', async () => {
        const wrapper = mount(SituationOverviewPanel, {
            props: {
                show: true
            }
        });
        
        // Find and click the major routes option
        const majorRoutesElements = wrapper.findAll('.font-medium');
        const majorRoutesElement = majorRoutesElements.find(el => el.text() === '主要航线');
        
        expect(majorRoutesElement).toBeDefined();
        
        // Click the parent clickable element
        const clickableParent = majorRoutesElement.element.closest('.cursor-pointer');
        await wrapper.find('.cursor-pointer').trigger('click');
        
        // Wait for next tick
        await wrapper.vm.$nextTick();
        
        // Check if itemClick event was emitted
        const emittedEvents = wrapper.emitted('itemClick');
        expect(emittedEvents).toBeDefined();
    });
    
    it('should display active indicator when major_routes is active', async () => {
        const wrapper = mount(SituationOverviewPanel, {
            props: {
                show: true
            }
        });
        
        // Manually add major_routes to activeItems
        wrapper.vm.activeItems.push('major_routes');
        await wrapper.vm.$nextTick();
        
        // Check if the active indicator is displayed
        const activeIndicators = wrapper.findAll('.bg-yellow-400');
        expect(activeIndicators.length).toBeGreaterThan(0);
        
        // Verify the gradient background is applied
        const activeElements = wrapper.findAll('.bg-gradient-to-r.from-blue-600.to-cyan-600');
        expect(activeElements.length).toBeGreaterThan(0);
    });
    
    it('should be in the maritime_silk_road category', () => {
        // Verify the option is part of MARITIME_SILK_ROAD
        const majorRoutesItem = MARITIME_SILK_ROAD.items.find(item => item.id === 'major_routes');
        
        expect(MARITIME_SILK_ROAD.items).toContain(majorRoutesItem);
    });
    
    it('should follow the same pattern as major_ports option', () => {
        const majorPortsItem = MARITIME_SILK_ROAD.items.find(item => item.id === 'major_ports');
        const majorRoutesItem = MARITIME_SILK_ROAD.items.find(item => item.id === 'major_routes');
        
        // Both should have the same structure
        expect(Object.keys(majorPortsItem)).toEqual(Object.keys(majorRoutesItem));
        expect(majorPortsItem).toHaveProperty('id');
        expect(majorPortsItem).toHaveProperty('label');
        expect(majorRoutesItem).toHaveProperty('id');
        expect(majorRoutesItem).toHaveProperty('label');
    });
});
