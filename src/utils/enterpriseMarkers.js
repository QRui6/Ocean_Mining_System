import * as Cesium from 'cesium';

export class EnterpriseMarkerManager {
    constructor(viewer) {
        this.viewer = viewer;
        this.entities = [];
    }

    addEnterpriseMarkers(enterprises) {
        this.clear();

        enterprises.forEach(enterprise => {
            // 只在3D模式下创建扩散圆圈
            if (this.viewer.scene.mode === Cesium.SceneMode.SCENE3D) {
                this.createPulsingCircle(enterprise);
            }
            this.createEnterpriseLabel(enterprise);
        });
    }

    createPulsingCircle(enterprise) {
        const { lng, lat } = enterprise.location;
        const color = Cesium.Color.fromCssColorString(enterprise.color);

        for (let i = 0; i < 3; i++) {
            const entity = this.viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(lng, lat, 0),
                ellipse: {
                    semiMinorAxis: new Cesium.CallbackProperty(() => {
                        const time = Date.now() / 1000;
                        const phase = (time + i * 0.5) % 2;
                        return 50000 + phase * 100000;
                    }, false),
                    semiMajorAxis: new Cesium.CallbackProperty(() => {
                        const time = Date.now() / 1000;
                        const phase = (time + i * 0.5) % 2;
                        return 50000 + phase * 100000;
                    }, false),
                    material: new Cesium.ColorMaterialProperty(
                        new Cesium.CallbackProperty(() => {
                            const time = Date.now() / 1000;
                            const phase = (time + i * 0.5) % 2;
                            const alpha = 0.6 * (1 - phase / 2);
                            return color.withAlpha(alpha);
                        }, false)
                    ),
                    height: 0,
                    outline: false
                }
            });
            this.entities.push(entity);
        }

        const centerEntity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lng, lat, 0),
            point: {
                pixelSize: 15,
                color: color,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2
            }
        });
        this.entities.push(centerEntity);
    }

    createEnterpriseLabel(enterprise) {
        const { lng, lat } = enterprise.location;

        const labelEntity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lng, lat, 0),
            label: {
                text: enterprise.name,
                font: '16px sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -20),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            },
            billboard: {
                image: this.createPinImage(enterprise.color),
                width: 32,
                height: 48,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        });
        this.entities.push(labelEntity);
    }

    createPinImage(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(16, 16, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(16, 28);
        ctx.lineTo(10, 40);
        ctx.lineTo(22, 40);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(16, 16, 12, 0, Math.PI * 2);
        ctx.stroke();

        return canvas.toDataURL();
    }

    flyToOverview() {
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(110, 35, 3500000),
            duration: 2,
            orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-45),
                roll: 0.0
            }
        });
    }

    clear() {
        this.entities.forEach(entity => {
            this.viewer.entities.remove(entity);
        });
        this.entities = [];
    }
}
