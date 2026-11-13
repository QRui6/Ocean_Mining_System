import { FORECAST_PHASES } from '../data/marineForecastMockData.js';

const pad = (value) => String(value).padStart(2, '0');

export const formatForecastTime = (date) => {
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());

    return `${year}-${month}-${day} ${hour}:${minute}`;
};

const getPhase = (hour) => (
    FORECAST_PHASES.find((phase) => hour >= phase.startHour && hour <= phase.endHour)
    || FORECAST_PHASES[FORECAST_PHASES.length - 1]
);

export const generateForecast72h = (miningArea = 'CC区') => {
    const start = new Date();
    start.setMinutes(0, 0, 0);

    return Array.from({ length: 25 }, (_, index) => {
        const hour = index * 3;
        const phase = getPhase(hour);
        const forecastDate = new Date(start.getTime() + hour * 60 * 60 * 1000);
        const trend = Math.sin(index / 2.4);
        const strengthening = hour >= 36 && hour <= 48 ? (hour - 36) / 12 : 0;
        const easing = hour > 48 ? Math.min((hour - 48) / 24, 1) : 0;
        const waveBase = phase.seaState === 3 ? 1.8 : phase.seaState === 4 ? 2.6 : 3.8;
        const typhoonDistance = Math.max(
            220,
            phase.typhoonDistance - strengthening * 140 + easing * 180 + Math.round(trend * 18)
        );

        return {
            id: index + 1,
            miningArea,
            forecastTime: formatForecastTime(forecastDate),
            seaState: hour > 57 ? 3 : phase.seaState,
            waveHeight: Number((waveBase + trend * 0.18 - easing * 0.35).toFixed(2)),
            surfaceCurrent: Number((phase.surfaceBase + trend * 0.04 + strengthening * 0.08 - easing * 0.08).toFixed(2)),
            bottomCurrent: Number((phase.bottomBase + trend * 0.012 + strengthening * 0.02 - easing * 0.02).toFixed(2)),
            windSpeed: Number(((phase.seaState * 2.8) + trend * 1.1 + strengthening * 3 - easing * 2).toFixed(1)),
            typhoonDistance,
            typhoonLevel: hour >= 39 && hour <= 48 ? '影响' : phase.typhoonLevel
        };
    });
};
