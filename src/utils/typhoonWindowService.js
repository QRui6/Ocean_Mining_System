const MONTH_LABELS = Array.from({ length: 12 }, (_, index) => `${index + 1}月`);

const getEventMonth = (event) => {
    const source = event?.closestTime || event?.influenceStart || event?.influenceEnd;
    const date = source ? new Date(source) : null;

    return date && !Number.isNaN(date.getTime()) ? date.getMonth() : -1;
};

const getBestContinuousWindow = (monthCounts, threshold) => {
    const activeMonths = monthCounts.map((item) => item.count >= threshold);
    if (activeMonths.every(Boolean)) {
        return monthCounts;
    }

    const segments = monthCounts.reduce((result, item, index) => {
        const previousIndex = (index + monthCounts.length - 1) % monthCounts.length;
        if (!activeMonths[index] || activeMonths[previousIndex]) {
            return result;
        }

        const segment = [];
        let currentIndex = index;

        while (activeMonths[currentIndex] && segment.length < monthCounts.length) {
            segment.push(monthCounts[currentIndex]);
            currentIndex = (currentIndex + 1) % monthCounts.length;
        }

        result.push(segment);
        return result;
    }, []);

    return segments.sort((first, second) => (
        second.length - first.length
        || second.reduce((total, item) => total + item.count, 0) - first.reduce((total, item) => total + item.count, 0)
    ))[0] || [];
};

export const createEmptyTyphoonWindowSummary = () => ({
    hasData: false,
    monthCounts: MONTH_LABELS.map((label, index) => ({
        month: index + 1,
        label,
        count: 0,
        inWindow: false
    })),
    totalCount: 0,
    windowCount: 0,
    windowLabel: '--',
    peakMonthLabel: '--',
    peakCount: 0
});

export const calculateTyphoonWindowSummary = (events = []) => {
    const summary = createEmptyTyphoonWindowSummary();

    events.forEach((event) => {
        const monthIndex = getEventMonth(event);
        if (monthIndex >= 0) {
            summary.monthCounts[monthIndex].count += 1;
        }
    });

    const validEvents = summary.monthCounts.reduce((total, item) => total + item.count, 0);
    if (!validEvents) {
        return summary;
    }

    const peak = summary.monthCounts.reduce((best, item) => (
        item.count > best.count ? item : best
    ), summary.monthCounts[0]);
    const threshold = Math.max(1, Math.ceil(peak.count * 0.5));
    const windowMonths = getBestContinuousWindow(summary.monthCounts, threshold);
    const windowMonthSet = new Set(windowMonths.map((item) => item.month));

    summary.monthCounts = summary.monthCounts.map((item) => ({
        ...item,
        inWindow: windowMonthSet.has(item.month)
    }));
    summary.hasData = true;
    summary.totalCount = validEvents;
    summary.windowCount = windowMonths.reduce((total, item) => total + item.count, 0);
    summary.windowLabel = windowMonths.length > 1
        ? `${windowMonths[0].label}-${windowMonths[windowMonths.length - 1].label}`
        : windowMonths[0]?.label || '--';
    summary.peakMonthLabel = peak.label;
    summary.peakCount = peak.count;

    return summary;
};
