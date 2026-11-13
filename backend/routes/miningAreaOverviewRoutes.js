const express = require('express');

const router = express.Router();

const createTimeline = () => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, index) => {
        const item = new Date(now);
        item.setMonth(now.getMonth() - (11 - index));
        return item.toISOString();
    });
};

router.get('/:id/overview', async (req, res) => {
    const { id } = req.params;
    const timeline = createTimeline();

    res.json({
        success: true,
        data: {
            id,
            waterDepth: {
                average: null,
                min: null,
                max: null,
                unit: 'm',
                message: '暂无矿区水深数据'
            },
            historical: {
                timestamps: timeline,
                windSpeed: timeline.map(() => null),
                waveHeight: timeline.map(() => null),
                currentSpeed: timeline.map(() => null),
                unitMap: {
                    windSpeed: 'm/s',
                    waveHeight: 'm',
                    currentSpeed: 'm/s'
                }
            },
            notices: [
                '矿区总览接口已创建，后续可直接接入实测水深数据。',
                '风浪流历史序列当前返回空值占位，方便前端先完成图表联调。'
            ],
            dataStatus: 'placeholder'
        }
    });
});

module.exports = router;
