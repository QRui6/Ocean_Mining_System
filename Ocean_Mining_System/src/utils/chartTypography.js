// Shared big-screen typography constants for ECharts across workspaces (1920x1080 base, minimum 14px).
export const CHART_FONT_FAMILY = '"Noto Sans SC", sans-serif';

export const CHART_COLORS = {
  primary: '#ffffff',
  secondary: '#e2eff7',
  label: '#b6d0e2',
  axisLine: '#64829c',
  splitLine: 'rgba(148, 179, 204, 0.24)',
};

export const chartAxisLabel = (extra = {}) => ({
  color: CHART_COLORS.secondary,
  fontFamily: CHART_FONT_FAMILY,
  fontSize: 14,
  fontWeight: 600,
  ...extra,
});

export const chartAxisName = (extra = {}) => ({
  color: CHART_COLORS.label,
  fontFamily: CHART_FONT_FAMILY,
  fontSize: 14,
  fontWeight: 600,
  ...extra,
});

export const chartLegendText = (extra = {}) => ({
  color: CHART_COLORS.secondary,
  fontFamily: CHART_FONT_FAMILY,
  fontSize: 14,
  fontWeight: 600,
  ...extra,
});

export const chartTooltipStyle = (extra = {}) => ({
  backgroundColor: 'rgba(8, 20, 38, 0.96)',
  borderColor: '#38bdf8',
  borderWidth: 1,
  textStyle: {
    color: '#ffffff',
    fontFamily: CHART_FONT_FAMILY,
    fontSize: 15,
  },
  ...extra,
});
