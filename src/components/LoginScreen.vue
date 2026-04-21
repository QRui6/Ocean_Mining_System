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
                <div class="login-overview__grid">
                    <div
                        v-for="item in overviewItems"
                        :key="item.key"
                        class="overview-module"
                    >
                        <span class="overview-module__name" :data-text="item.title">{{ item.title }}</span>
                    </div>
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
        const overviewItems = TOP_TABS.map((tab, index) => ({
            key: `tab-${index}`,
            title: tab
        }));

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
            overviewItems,
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
    top: calc(var(--login-panel-top) + 28px);
    left: clamp(8px, 1.2vw, 24px);
    z-index: 3;
    width: clamp(286px, 18vw, 344px);
    height: auto;
}

.login-overview::before {
    content: '';
    position: absolute;
    top: 10px;
    bottom: 10px;
    left: -12px;
    width: 2px;
    border-radius: 999px;
    background: linear-gradient(180deg, transparent, rgba(221, 236, 247, 0.52), rgba(118, 184, 227, 0.34), transparent);
    box-shadow:
        0 0 16px rgba(111, 201, 251, 0.2),
        0 0 30px rgba(71, 162, 218, 0.12);
    pointer-events: none;
}

.login-overview::after {
    content: '';
    position: absolute;
    top: 10px;
    bottom: 10px;
    left: -22px;
    width: 34px;
    background:
        repeating-linear-gradient(180deg, rgba(221, 236, 247, 0.14) 0 2px, transparent 2px 30px);
    opacity: 0.46;
    pointer-events: none;
}

.login-overview__card {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    overflow: visible;
}

.login-overview__grid {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 11px;
    width: 100%;
    padding: 4px 0;
}

.overview-module {
    position: relative;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 58px;
    padding: 0 38px 0 44px;
    border: 0;
    border-radius: 0;
    background:
        linear-gradient(105deg, rgba(206, 235, 249, 0.54) 0%, rgba(126, 191, 228, 0.5) 32%, rgba(48, 110, 154, 0.54) 100%);
    clip-path: polygon(28px 0, 100% 0, calc(100% - 28px) 100%, 0 100%);
    filter:
        drop-shadow(0 14px 22px rgba(2, 12, 22, 0.16))
        drop-shadow(0 0 12px rgba(95, 179, 245, 0.14));
    overflow: hidden;
    text-align: center;
    isolation: isolate;
}

.overview-module:nth-child(3n) {
    background:
        linear-gradient(105deg, rgba(196, 228, 245, 0.5) 0%, rgba(104, 174, 216, 0.48) 38%, rgba(35, 88, 128, 0.56) 100%);
}

.overview-module::before {
    content: '';
    position: absolute;
    inset: 1px;
    z-index: 0;
    background:
        linear-gradient(180deg, rgba(118, 184, 227, 0.42) 0%, rgba(35, 88, 128, 0.52) 100%),
        linear-gradient(105deg, rgba(255, 255, 255, 0.16) 0%, rgba(120, 192, 230, 0.1) 36%, rgba(6, 29, 48, 0.16) 100%);
    clip-path: polygon(28px 0, 100% 0, calc(100% - 28px) 100%, 0 100%);
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
        linear-gradient(90deg, transparent 8%, rgba(248, 253, 255, 0.62) 36%, rgba(154, 223, 255, 0.26) 74%, transparent 96%) top / 100% 1px no-repeat,
        linear-gradient(90deg, transparent 0%, rgba(2, 12, 22, 0.24) 18%, transparent 42%) bottom / 100% 1px no-repeat,
        linear-gradient(118deg, transparent 0 70%, rgba(245, 251, 255, 0.34) 70% 72%, rgba(14, 58, 88, 0.18) 72% 100%),
        linear-gradient(105deg, rgba(255, 255, 255, 0.1), transparent 24%, rgba(4, 24, 39, 0.14) 100%);
    clip-path: polygon(28px 0, 100% 0, calc(100% - 28px) 100%, 0 100%);
    pointer-events: none;
}

.overview-module__name {
    position: relative;
    z-index: 2;
    display: block;
    margin: 0;
    color: transparent;
    transform: translateX(-12px);
    background: linear-gradient(180deg, #ffffff 0%, #ffffff 34%, #f8fdff 72%, #edf9ff 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-stroke: 0.45px rgba(255, 255, 255, 0.34);
    font-size: 1.3rem;
    line-height: 1.2;
    font-weight: 700;
    letter-spacing: 0.035em;
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
