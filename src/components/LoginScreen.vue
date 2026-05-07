<template>
    <div class="login-screen">
        <div class="login-screen__background login-screen__background--ambient" :style="backgroundStyle" aria-hidden="true"></div>
        <div class="login-screen__background login-screen__background--image" :style="backgroundStyle" aria-hidden="true"></div>
        <div class="login-screen__overlay" aria-hidden="true"></div>
        <div class="login-screen__time">{{ currentDateTime }}</div>

        <header class="login-screen__header">
            <div class="login-screen__brand">
                <h1 :data-text="APP_TITLE">{{ APP_TITLE }}</h1>
            </div>
        </header>

        <section class="login-overview" aria-label="系统模块">
            <div class="login-overview__card">
                <div class="login-overview__halo"></div>
                <div class="login-overview__radar"></div>

                <div class="login-overview__center">
                    <div class="overview-core">
                        <div class="overview-core__ring overview-core__ring--outer"></div>
                        <div class="overview-core__ring overview-core__ring--middle"></div>
                        <div class="overview-core__ring overview-core__ring--inner"></div>
                        <div class="overview-core__pulse"></div>
                        <div class="overview-core__grid"></div>
                        <div class="overview-core__globe">
                            <div class="overview-core__meridian overview-core__meridian--v"></div>
                            <div class="overview-core__meridian overview-core__meridian--h"></div>
                            <div class="overview-core__meridian overview-core__meridian--d1"></div>
                            <div class="overview-core__meridian overview-core__meridian--d2"></div>
                        </div>
                    </div>
                    <span
                        v-for="dot in connectorDots"
                        :key="dot.key"
                        class="login-overview__dot"
                        :style="dot.style"
                    ></span>
                </div>

                <div
                    v-for="item in positionedOverviewItems"
                    :key="item.key"
                    class="overview-module"
                    :class="[`overview-module--${item.side}`, `overview-module--${item.positionClass}`]"
                >
                    <span class="overview-module__icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                            <path
                                v-for="(path, pathIndex) in item.iconPaths"
                                :key="`${item.key}-${pathIndex}`"
                                :d="path"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.7"
                            />
                        </svg>
                    </span>
                    <span class="overview-module__name" :data-text="item.title">{{ item.title }}</span>
                </div>
            </div>
        </section>

        <div class="login-screen__content">
            <section class="login-card">
                <div class="login-card__header">
                    <h2>登录</h2>
                </div>

                <form class="login-form" @submit.prevent="submitLogin">
                    <label class="login-form__label" for="username">用户名</label>
                    <input
                        id="username"
                        v-model.trim="form.username"
                        class="login-form__input"
                        type="text"
                        autocomplete="username"
                        placeholder="请输入用户名"
                    >

                    <label class="login-form__label" for="password">密码</label>
                    <input
                        id="password"
                        v-model="form.password"
                        class="login-form__input"
                        type="password"
                        autocomplete="current-password"
                        placeholder="请输入密码"
                    >

                    <button class="login-form__submit" type="submit" :disabled="isSubmitting">
                        {{ isSubmitting ? '登录中...' : '登录系统' }}
                    </button>
                </form>
            </section>
        </div>
    </div>
</template>

<script>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { APP_TITLE, TOP_TABS } from '../constants.js';
import { login } from '../api/auth.js';
import { DEMO_CREDENTIALS } from '../config/auth.js';

export default {
    name: 'LoginScreen',
    emits: ['loginSuccess'],
    setup(props, { emit }) {
        const now = ref(new Date());
        const backgroundStyle = {
            backgroundImage: "url('/image/%E6%A2%A6%E6%83%B3%E5%8F%B7.jpg')"
        };
        const form = reactive({
            username: DEMO_CREDENTIALS.username,
            password: ''
        });
        const isSubmitting = ref(false);
        const iconPathMap = [
            ['M12 7v5l3 3', 'M21 12a9 9 0 11-18 0 9 9 0 0118 0', 'M9 2h6'],
            ['M4.5 10.5l7.5-4.5 7.5 4.5', 'M5.5 10.5V18l6.5 3.5 6.5-3.5v-7.5', 'M12 6v7.5'],
            ['M3 18h18', 'M5 16l3-5 3 3 4-7 4 9', 'M5 18V7'],
            ['M8 19c0-3 1.5-5.5 4-8 2.5 2.5 4 5 4 8', 'M12 3v8', 'M7 19h10'],
            ['M3 16h18', 'M5 13h6l2-3 2 3h4', 'M7 10l1.5-2 1.5 2', 'M17 8h.01'],
            ['M6 15a4 4 0 117.75-1.25A3.5 3.5 0 1118 19H7', 'M9 19l1.5-3', 'M13 16.5L11.5 19'],
            ['M12 4v16', 'M4 12h16', 'M7 7c4 2 6 8 10 10', 'M17 7c-4 2-6 8-10 10'],
            ['M5 6h14', 'M5 12h14', 'M5 18h14', 'M7 8v8', 'M17 8v8']
        ];
        const overviewItems = TOP_TABS.map((tab, index) => ({
            key: `tab-${index}`,
            title: tab,
            iconPaths: iconPathMap[index] || iconPathMap[0]
        }));
        const positionedOverviewItems = computed(() => overviewItems.map((item, index) => ({
            ...item,
            side: index < 4 ? 'left' : 'right',
            positionClass: `p${index}`
        })));
        const connectorDots = [
            { key: 'top-left', style: { top: '92px', left: '246px' } },
            { key: 'upper-left', style: { top: '168px', left: '198px' } },
            { key: 'lower-left', style: { top: '274px', left: '198px' } },
            { key: 'bottom-left', style: { top: '350px', left: '246px' } },
            { key: 'top-right', style: { top: '92px', right: '246px' } },
            { key: 'upper-right', style: { top: '168px', right: '198px' } },
            { key: 'lower-right', style: { top: '274px', right: '198px' } },
            { key: 'bottom-right', style: { top: '350px', right: '246px' } }
        ];

        let timer = null;

        const currentDateTime = computed(() => {
            const year = now.value.getFullYear();
            const month = String(now.value.getMonth() + 1).padStart(2, '0');
            const day = String(now.value.getDate()).padStart(2, '0');
            const hours = String(now.value.getHours()).padStart(2, '0');
            const minutes = String(now.value.getMinutes()).padStart(2, '0');
            const seconds = String(now.value.getSeconds()).padStart(2, '0');
            return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
        });

        const submitLogin = async () => {
            if (isSubmitting.value) {
                return;
            }

            if (!form.username || !form.password) {
                ElMessage.warning('请输入用户名和密码');
                return;
            }

            const isDemoUser =
                form.username === DEMO_CREDENTIALS.username &&
                form.password === DEMO_CREDENTIALS.password;

            if (isDemoUser) {
                emit('loginSuccess', {
                    userId: 1,
                    username: DEMO_CREDENTIALS.displayName,
                    displayName: DEMO_CREDENTIALS.displayName,
                    account: DEMO_CREDENTIALS.username
                });
                form.password = '';
                ElMessage.success('登录成功');
                return;
            }

            isSubmitting.value = true;

            try {
                const user = await login({
                    username: form.username,
                    password: form.password
                });

                emit('loginSuccess', {
                    userId: user.userId,
                    username: user.displayName || user.username,
                    displayName: user.displayName || user.username,
                    account: user.username
                });
                form.password = '';
                ElMessage.success('登录成功');
            } catch (error) {
                ElMessage.error(error.message || '登录失败，请稍后重试');
            } finally {
                isSubmitting.value = false;
            }
        };

        onMounted(() => {
            timer = window.setInterval(() => {
                now.value = new Date();
            }, 1000);
        });

        onUnmounted(() => {
            if (timer) {
                window.clearInterval(timer);
            }
        });

        return {
            APP_TITLE,
            backgroundStyle,
            currentDateTime,
            form,
            isSubmitting,
            positionedOverviewItems,
            connectorDots,
            submitLogin
        };
    }
};
</script>

<style scoped>
.login-screen {
    --content-top-offset: 134px;
    --login-card-body-height: 492px;
    --login-card-padding-top: 52px;
    --login-card-padding-right: 38px;
    --login-card-padding-bottom: 40px;
    --login-card-padding-left: 38px;
    --login-card-outer-height: calc(var(--login-card-body-height) + var(--login-card-padding-top) + var(--login-card-padding-bottom) + 2px);
    --login-panel-top: calc((100vh - var(--login-card-outer-height)) / 2);
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    color: #f5fbff;
    background-color: #081826;
}

.login-screen__background,
.login-screen__overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.login-screen__background {
    background-position: center center;
    background-repeat: no-repeat;
    transform-origin: center;
}

.login-screen__background--ambient {
    background-size: cover;
    filter: blur(34px) brightness(0.68) saturate(1.1);
    transform: scale(1.16);
    opacity: 0.9;
}

.login-screen__background--image {
    background-size: cover;
    background-position: 58% center;
    filter: brightness(1.08) saturate(1.06) contrast(1.01);
    opacity: 0.96;
}

.login-screen__overlay {
    background:
        linear-gradient(90deg, rgba(5, 17, 29, 0.17) 0%, rgba(5, 17, 29, 0.05) 18%, rgba(5, 17, 29, 0.01) 36%, rgba(5, 17, 29, 0.01) 64%, rgba(5, 17, 29, 0.05) 82%, rgba(5, 17, 29, 0.17) 100%),
        radial-gradient(circle at 12% 16%, rgba(123, 209, 255, 0.24) 0%, rgba(123, 209, 255, 0.11) 18%, transparent 34%),
        radial-gradient(circle at 88% 12%, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.07) 16%, transparent 32%),
        linear-gradient(180deg, rgba(5, 17, 29, 0.014) 0%, rgba(5, 17, 29, 0.004) 26%, rgba(5, 17, 29, 0.028) 100%);
}

.login-screen__header {
    position: absolute;
    top: 24px;
    left: 50%;
    z-index: 3;
    transform: translateX(-50%);
    width: max-content;
    max-width: calc(100vw - 280px);
    text-align: center;
}

.login-screen__brand {
    max-width: 100%;
}

.login-screen__brand h1 {
    position: relative;
    display: inline-block;
    margin: 0;
    padding-bottom: 0.08em;
    font-size: clamp(1.34rem, 3.08vw, 3.72rem);
    line-height: 1.05;
    font-weight: 700;
    letter-spacing: 0.045em;
    white-space: nowrap;
    color: transparent;
    background: linear-gradient(180deg, #ffffff 0%, #ffffff 24%, #eef8ff 62%, #d6ebf8 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-stroke: 0.8px rgba(231, 243, 250, 0.22);
    text-shadow:
        0 1px 0 rgba(255, 255, 255, 0.38),
        0 6px 14px rgba(0, 0, 0, 0.16),
        0 0 22px rgba(182, 220, 241, 0.14);
    filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.08));
    isolation: isolate;
}

.login-screen__brand h1::before,
.login-screen__brand h1::after {
    content: attr(data-text);
    position: absolute;
    inset: 0;
    white-space: nowrap;
    pointer-events: none;
}

.login-screen__brand h1::before {
    z-index: -2;
    transform: translate(0.032em, 0.058em);
    color: rgba(7, 24, 39, 0.24);
    filter: blur(0.6px);
}

.login-screen__brand h1::after {
    z-index: -1;
    transform: translate(0.018em, 0.03em);
    color: rgba(244, 251, 255, 0.28);
    mix-blend-mode: screen;
}

.login-screen__time {
    position: absolute;
    top: 28px;
    left: 32px;
    z-index: 3;
    flex-shrink: 0;
    padding: 10px 14px;
    border: 1px solid rgba(221, 236, 247, 0.14);
    border-radius: 999px;
    background: rgba(11, 29, 43, 0.22);
    box-shadow:
        0 14px 28px rgba(3, 11, 19, 0.12),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(8px);
    font-family: 'Rajdhani', sans-serif;
    font-size: 1.28rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    white-space: nowrap;
    color: rgba(245, 250, 255, 0.94);
}

.login-screen__content {
    position: relative;
    z-index: 3;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    width: min(1680px, 100vw);
    height: 100%;
    margin-left: auto;
    padding: var(--login-panel-top) clamp(8px, 2.2vw, 40px) 0 0;
}

.login-overview {
    position: absolute;
    top: auto;
    bottom: 53vh;
    left: -40px;
    z-index: 3;
    width: clamp(500px, 34vw, 620px);
    height: 368px;
}

.login-overview::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background:
        radial-gradient(circle at center, rgba(90, 185, 255, 0.14) 0%, rgba(90, 185, 255, 0.06) 38%, transparent 66%);
    filter: blur(16px);
    pointer-events: none;
}

.login-overview__card {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    overflow: visible;
}

.login-overview__halo,
.login-overview__radar {
    position: absolute;
    top: 50%;
    left: 50%;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
}

.login-overview__halo {
    width: 296px;
    height: 296px;
    border: 1px solid rgba(128, 207, 255, 0.12);
    background:
        radial-gradient(circle, rgba(140, 212, 255, 0.08) 0%, rgba(140, 212, 255, 0.03) 46%, transparent 72%);
    box-shadow:
        0 0 46px rgba(61, 177, 248, 0.12),
        inset 0 0 32px rgba(84, 189, 255, 0.06);
}

.login-overview__radar {
    width: 232px;
    height: 232px;
    border: 1px solid rgba(128, 207, 255, 0.14);
    background:
        repeating-radial-gradient(circle, rgba(163, 225, 255, 0.1) 0 1px, transparent 1px 26px),
        repeating-linear-gradient(0deg, rgba(157, 223, 255, 0.08) 0 1px, transparent 1px 36px),
        repeating-linear-gradient(90deg, rgba(157, 223, 255, 0.08) 0 1px, transparent 1px 36px);
    opacity: 0.76;
}

.login-overview__center {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 2;
    width: 144px;
    height: 144px;
    transform: translate(-50%, -50%);
}

.login-overview__dot {
    position: absolute;
    width: 7px;
    height: 7px;
    border: 1.5px solid rgba(188, 236, 255, 0.9);
    border-radius: 50%;
    background: rgba(114, 209, 255, 0.9);
    box-shadow:
        0 0 16px rgba(114, 209, 255, 0.55),
        0 0 28px rgba(114, 209, 255, 0.24);
}

.overview-core {
    position: relative;
    width: 100%;
    height: 100%;
}

.overview-core::before,
.overview-core::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
}

.overview-core::before {
    width: 124px;
    height: 124px;
    background:
        radial-gradient(circle, rgba(102, 205, 255, 0.2) 0%, rgba(102, 205, 255, 0.06) 54%, transparent 72%);
    box-shadow: 0 0 42px rgba(60, 177, 248, 0.2);
}

.overview-core::after {
    width: 160px;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(176, 232, 255, 0.76), transparent);
    opacity: 0.4;
}

.overview-core__ring,
.overview-core__pulse,
.overview-core__globe,
.overview-core__grid {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
}

.overview-core__ring {
    border: 1px solid rgba(138, 217, 255, 0.3);
    box-shadow: inset 0 0 20px rgba(82, 188, 255, 0.1);
}

.overview-core__ring--outer {
    width: 126px;
    height: 126px;
}

.overview-core__ring--middle {
    width: 100px;
    height: 100px;
}

.overview-core__ring--inner {
    width: 72px;
    height: 72px;
}

.overview-core__pulse {
    width: 36px;
    height: 36px;
    background: radial-gradient(circle, rgba(188, 238, 255, 0.96) 0%, rgba(102, 205, 255, 0.74) 34%, rgba(30, 105, 154, 0.3) 76%, transparent 100%);
    box-shadow:
        0 0 22px rgba(121, 219, 255, 0.55),
        0 0 42px rgba(74, 190, 255, 0.24);
}

.overview-core__grid {
    width: 88px;
    height: 88px;
    border: 1px solid rgba(162, 228, 255, 0.18);
    background:
        repeating-linear-gradient(0deg, rgba(156, 225, 255, 0.12) 0 1px, transparent 1px 16px),
        repeating-linear-gradient(90deg, rgba(156, 225, 255, 0.12) 0 1px, transparent 1px 16px);
    opacity: 0.8;
}

.overview-core__globe {
    width: 58px;
    height: 58px;
    border: 1px solid rgba(185, 237, 255, 0.65);
    background:
        radial-gradient(circle at 50% 32%, rgba(217, 246, 255, 0.88), rgba(113, 208, 255, 0.4) 44%, rgba(12, 58, 92, 0.6) 100%);
    box-shadow:
        inset 0 0 18px rgba(255, 255, 255, 0.16),
        0 0 26px rgba(91, 200, 255, 0.26);
}

.overview-core__meridian {
    position: absolute;
    top: 50%;
    left: 50%;
    background: rgba(225, 247, 255, 0.42);
    transform-origin: center;
}

.overview-core__meridian--v {
    width: 1px;
    height: 44px;
    transform: translate(-50%, -50%);
}

.overview-core__meridian--h {
    width: 44px;
    height: 1px;
    transform: translate(-50%, -50%);
}

.overview-core__meridian--d1 {
    width: 36px;
    height: 1px;
    transform: translate(-50%, -50%) rotate(45deg);
}

.overview-core__meridian--d2 {
    width: 36px;
    height: 1px;
    transform: translate(-50%, -50%) rotate(-45deg);
}

.overview-module {
    position: absolute;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 10px;
    width: 148px;
    min-height: 52px;
    padding: 0 16px;
    border: 1px solid rgba(159, 225, 255, 0.3);
    border-radius: 18px;
    background:
        linear-gradient(135deg, rgba(166, 223, 252, 0.18) 0%, rgba(59, 124, 171, 0.22) 44%, rgba(6, 31, 56, 0.48) 100%);
    clip-path: polygon(18px 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 18px 100%, 0 50%);
    filter:
        drop-shadow(0 12px 22px rgba(2, 12, 22, 0.18))
        drop-shadow(0 0 16px rgba(95, 179, 245, 0.18));
    overflow: hidden;
    isolation: isolate;
}

.overview-module--left {
    justify-content: flex-start;
}

.overview-module--right {
    justify-content: flex-start;
}

.overview-module--p0 {
    top: 30px;
    left: 118px;
    transform: scale(0.97);
}

.overview-module--p1 {
    top: 106px;
    left: 58px;
}

.overview-module--p2 {
    top: 194px;
    left: 58px;
}

.overview-module--p3 {
    top: 270px;
    left: 118px;
    transform: scale(0.97);
}

.overview-module--p4 {
    top: 30px;
    right: 118px;
    transform: scale(0.97);
}

.overview-module--p5 {
    top: 106px;
    right: 58px;
}

.overview-module--p6 {
    top: 194px;
    right: 58px;
}

.overview-module--p7 {
    top: 270px;
    right: 118px;
    transform: scale(0.97);
}

.overview-module::before {
    content: '';
    position: absolute;
    inset: 1px;
    z-index: 0;
    background:
        linear-gradient(180deg, rgba(130, 203, 244, 0.2) 0%, rgba(18, 60, 94, 0.42) 100%),
        linear-gradient(115deg, rgba(255, 255, 255, 0.14) 0%, transparent 32%, rgba(7, 31, 53, 0.22) 100%);
    clip-path: polygon(18px 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 18px 100%, 0 50%);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.28),
        inset 0 -10px 18px rgba(3, 20, 34, 0.16);
    backdrop-filter: blur(12px) saturate(136%);
}

.overview-module::after {
    content: '';
    position: absolute;
    inset: 1px;
    z-index: 1;
    background:
        linear-gradient(90deg, transparent 0%, rgba(247, 252, 255, 0.62) 18%, rgba(154, 223, 255, 0.2) 52%, transparent 96%) top / 100% 1px no-repeat,
        linear-gradient(90deg, rgba(115, 210, 255, 0.18), transparent 32%, rgba(115, 210, 255, 0.14) 68%, transparent) center / 100% 100% no-repeat;
    clip-path: polygon(18px 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 18px 100%, 0 50%);
    pointer-events: none;
}

.overview-module__icon {
    position: relative;
    z-index: 2;
    flex: 0 0 30px;
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(176, 231, 255, 0.34);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(174, 232, 255, 0.12) 0%, rgba(67, 143, 193, 0.06) 70%, transparent 100%);
    color: rgba(234, 248, 255, 0.92);
    box-shadow:
        inset 0 0 12px rgba(255, 255, 255, 0.08),
        0 0 18px rgba(95, 179, 245, 0.18);
}

.overview-module__icon svg {
    width: 15px;
    height: 15px;
}

.overview-module__name {
    position: relative;
    z-index: 2;
    display: block;
    margin: 0;
    color: transparent;
    background: linear-gradient(180deg, #ffffff 0%, #ffffff 34%, #f8fdff 72%, #edf9ff 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-stroke: 0.45px rgba(255, 255, 255, 0.34);
    font-size: 0.8rem;
    line-height: 1.2;
    font-weight: 700;
    letter-spacing: 0.045em;
    text-shadow:
        0 1px 0 rgba(255, 255, 255, 0.44),
        0 4px 10px rgba(0, 0, 0, 0.14),
        0 0 18px rgba(238, 249, 255, 0.24);
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
    isolation: isolate;
}

.overview-module__name::before,
.overview-module__name::after {
    content: attr(data-text);
    position: absolute;
    inset: 0;
    white-space: nowrap;
    pointer-events: none;
}

.overview-module__name::before {
    z-index: -2;
    transform: translate(0.035em, 0.062em);
    color: rgba(5, 22, 36, 0.24);
    filter: blur(0.6px);
}

.overview-module__name::after {
    z-index: -1;
    transform: translate(0.018em, 0.032em);
    color: rgba(255, 255, 255, 0.34);
    mix-blend-mode: screen;
}

.login-card {
    position: relative;
    box-sizing: border-box;
    width: min(100%, 424px);
    height: var(--login-card-outer-height);
    min-height: 0;
    padding:
        var(--login-card-padding-top)
        var(--login-card-padding-right)
        var(--login-card-padding-bottom)
        var(--login-card-padding-left);
    overflow: hidden;
    border: 1px solid rgba(221, 236, 247, 0.5);
    border-radius: 28px;
    background:
        linear-gradient(180deg, rgba(118, 184, 227, 0.44) 0%, rgba(35, 88, 128, 0.56) 100%);
    box-shadow:
        0 22px 46px rgba(2, 8, 15, 0.08),
        0 12px 24px rgba(17, 58, 92, 0.1),
        0 0 26px rgba(95, 179, 245, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.34),
        inset 0 -8px 18px rgba(0, 0, 0, 0.02);
    backdrop-filter: blur(14px) saturate(145%);
}

.login-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 180px;
    height: 3px;
    background: linear-gradient(90deg, rgba(245, 251, 255, 0.95), rgba(154, 223, 255, 0.72), transparent);
}

.login-card::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background:
        radial-gradient(circle at top left, rgba(255, 255, 255, 0.2), transparent 32%);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.09);
    pointer-events: none;
}

.login-card__header {
    position: relative;
    margin-bottom: 28px;
    padding-bottom: 18px;
}

.login-card__header::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: 68px;
    height: 2px;
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(229, 239, 246, 0.97), rgba(138, 216, 255, 0.92));
}

.login-card__header h2 {
    margin: 0;
    font-size: 2.7rem;
    line-height: 1;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: #f7fbff;
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.login-form__label {
    margin-top: 4px;
    color: rgba(221, 233, 243, 0.88);
    font-size: 1.02rem;
    font-weight: 600;
    letter-spacing: 0.08em;
}

.login-form__input {
    --login-input-bg: linear-gradient(180deg, rgba(73, 126, 168, 0.38) 0%, rgba(22, 60, 90, 0.46) 100%);
    --login-input-autofill-bg: rgba(73, 126, 168, 0.4);
    height: 58px;
    padding: 0 18px;
    border: 1px solid rgba(186, 212, 230, 0.42);
    border-radius: 16px;
    outline: none;
    background: var(--login-input-bg);
    -webkit-appearance: none;
    appearance: none;
    color: #f6fbff;
    -webkit-text-fill-color: #f6fbff;
    font-size: 1.08rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, background 0.2s ease;
}

.login-form__input::placeholder {
    color: rgba(210, 226, 238, 0.7);
}

.login-form__input[type='password'] {
    background: var(--login-input-bg);
    border-color: rgba(186, 212, 230, 0.42);
}

.login-form__input:-webkit-autofill,
.login-form__input:-webkit-autofill:hover,
.login-form__input:-webkit-autofill:focus,
.login-form__input:-webkit-autofill:active {
    -webkit-text-fill-color: #f6fbff !important;
    -webkit-box-shadow: 0 0 0 1000px var(--login-input-autofill-bg) inset !important;
    box-shadow: 0 0 0 1000px var(--login-input-autofill-bg) inset !important;
    border: 1px solid rgba(186, 212, 230, 0.42) !important;
    caret-color: #f6fbff;
    transition: background-color 99999s ease-out 0s;
}

.login-form__input:focus {
    border-color: rgba(111, 201, 251, 0.78);
    box-shadow:
        0 0 0 1px rgba(111, 201, 251, 0.38),
        0 0 0 4px rgba(111, 201, 251, 0.16);
    transform: translateY(-1px);
}

.login-form__submit {
    height: 58px;
    margin-top: 16px;
    border: 1px solid rgba(214, 230, 241, 0.4);
    border-radius: 16px;
    background:
        linear-gradient(135deg, rgba(108, 198, 247, 0.92) 0%, rgba(52, 150, 214, 0.95) 100%);
    color: #edf7ff;
    font-size: 1.12rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    cursor: pointer;
    box-shadow:
        0 16px 30px rgba(2, 12, 22, 0.28),
        inset 0 1px 0 rgba(255, 255, 255, 0.16);
    transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease, border-color 0.22s ease;
}

.login-form__submit:hover {
    transform: translateY(-2px);
    border-color: rgba(148, 220, 255, 0.56);
    box-shadow:
        0 22px 42px rgba(2, 12, 22, 0.32),
        0 0 24px rgba(122, 207, 252, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
    filter: brightness(1.08);
}

.login-form__submit:disabled {
    cursor: not-allowed;
    opacity: 0.7;
    transform: none;
    box-shadow:
        0 18px 36px rgba(2, 12, 22, 0.24),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
    filter: none;
}

@media (max-width: 1180px) {
    .login-screen {
        --login-card-body-height: 468px;
        --login-card-padding-top: 48px;
        --login-card-padding-right: 34px;
        --login-card-padding-bottom: 36px;
        --login-card-padding-left: 34px;
        --login-panel-top: 140px;
    }

    .login-overview {
        display: none;
    }

    .login-screen__background--image {
        background-size: cover;
        background-position: 56% center;
    }

    .login-screen__header {
        top: 24px;
        max-width: calc(100vw - 220px);
    }

    .login-screen__brand {
        max-width: 100%;
    }

    .login-screen__content {
        width: min(100vw - 40px, 920px);
        height: auto;
        justify-content: center;
        padding: var(--login-panel-top) 0 40px;
    }
}

@media (max-width: 640px) {
    .login-screen__background--image {
        background-size: contain;
        background-position: center center;
    }

    .login-screen__header {
        top: 18px;
        max-width: calc(100vw - 112px);
    }

    .login-screen__brand h1 {
        font-size: clamp(1rem, 3.95vw, 1.48rem);
        letter-spacing: 0.02em;
    }

    .login-screen__time {
        top: 18px;
        left: 12px;
        font-size: 1rem;
    }

    .login-screen__content {
        width: calc(100vw - 24px);
        padding: 120px 0 24px;
    }

    .login-card {
        width: 100%;
        height: auto;
        min-height: auto;
        padding: 40px 18px 34px;
    }

    .login-card__header h2 {
        font-size: 2.2rem;
    }
}
</style>
