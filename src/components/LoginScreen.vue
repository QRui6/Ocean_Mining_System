<template>
    <div class="login-screen" :style="backgroundStyle">
        <div class="login-screen__time">{{ currentDateTime }}</div>

        <header class="login-screen__header">
            <div class="login-screen__brand">
                <h1 :data-text="APP_TITLE">{{ APP_TITLE }}</h1>
            </div>
        </header>

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
import { APP_TITLE } from '../constants.js';
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
            submitLogin
        };
    }
};
</script>

<style scoped>
.login-screen {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    color: #f5fbff;
    background-color: #081826;
    background-position: center center;
    background-repeat: no-repeat;
    background-size: cover;
}

.login-screen__header {
    position: absolute;
    top: 24px;
    left: 50%;
    z-index: 2;
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
    -webkit-text-stroke: 1px rgba(231, 243, 250, 0.3);
    text-shadow:
        0 1px 0 rgba(255, 255, 255, 0.5),
        0 3px 0 rgba(59, 103, 132, 0.12),
        0 9px 18px rgba(0, 0, 0, 0.18),
        0 16px 28px rgba(1, 10, 18, 0.2),
        0 0 30px rgba(182, 220, 241, 0.2);
    filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.12));
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
    transform: translate(0.05em, 0.085em);
    color: rgba(7, 24, 39, 0.38);
    filter: blur(0.9px);
}

.login-screen__brand h1::after {
    z-index: -1;
    transform: translate(0.028em, 0.045em);
    color: rgba(244, 251, 255, 0.38);
    mix-blend-mode: screen;
}

.login-screen__time {
    position: absolute;
    top: 28px;
    left: 32px;
    z-index: 2;
    flex-shrink: 0;
    padding: 10px 14px;
    border: 1px solid rgba(221, 236, 247, 0.14);
    border-radius: 999px;
    background: rgba(7, 22, 36, 0.3);
    backdrop-filter: blur(10px);
    font-family: 'Rajdhani', sans-serif;
    font-size: 1.28rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    white-space: nowrap;
    color: rgba(245, 250, 255, 0.94);
}

.login-screen__content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: min(1680px, 100vw);
    height: 100%;
    margin-left: auto;
    padding: 134px clamp(18px, 4.6vw, 92px) 0 0;
}

.login-card {
    position: relative;
    width: min(100%, 472px);
    min-height: 452px;
    padding: 48px 36px 42px;
    overflow: hidden;
    border: 1px solid rgba(221, 236, 247, 0.24);
    border-radius: 28px;
    background:
        linear-gradient(180deg, rgba(17, 42, 65, 0.42) 0%, rgba(9, 25, 39, 0.54) 100%);
    box-shadow:
        0 26px 82px rgba(2, 8, 15, 0.24),
        0 12px 28px rgba(2, 8, 15, 0.12),
        inset 0 1px 0 rgba(255, 255, 255, 0.14),
        inset 0 -14px 32px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(26px) saturate(145%);
}

.login-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 160px;
    height: 2px;
    background: linear-gradient(90deg, rgba(231, 242, 250, 0.74), rgba(217, 93, 42, 0.3), transparent);
}

.login-card::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
    pointer-events: none;
}

.login-card__header {
    position: relative;
    margin-bottom: 30px;
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
    background: linear-gradient(90deg, rgba(214, 226, 236, 0.9), rgba(214, 93, 42, 0.72));
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
    color: rgba(213, 227, 239, 0.82);
    font-size: 1.02rem;
    font-weight: 600;
    letter-spacing: 0.08em;
}

.login-form__input {
    height: 54px;
    padding: 0 16px;
    border: 1px solid rgba(154, 180, 200, 0.2);
    border-radius: 16px;
    outline: none;
    background:
        linear-gradient(180deg, rgba(12, 31, 48, 0.56) 0%, rgba(7, 19, 31, 0.68) 100%);
    -webkit-appearance: none;
    appearance: none;
    color: #f6fbff;
    -webkit-text-fill-color: #f6fbff;
    font-size: 1.08rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, background 0.2s ease;
}

.login-form__input::placeholder {
    color: rgba(173, 193, 208, 0.42);
}

.login-form__input[type='password'] {
    background:
        linear-gradient(180deg, rgba(12, 31, 48, 0.56) 0%, rgba(7, 19, 31, 0.68) 100%);
}

.login-form__input:-webkit-autofill,
.login-form__input:-webkit-autofill:hover,
.login-form__input:-webkit-autofill:focus,
.login-form__input:-webkit-autofill:active {
    -webkit-text-fill-color: #f6fbff;
    -webkit-box-shadow: 0 0 0 1000px rgba(10, 26, 40, 0.82) inset;
    box-shadow: 0 0 0 1000px rgba(10, 26, 40, 0.82) inset;
    caret-color: #f6fbff;
    transition: background-color 99999s ease-out 0s;
}

.login-form__input:focus {
    border-color: rgba(217, 93, 42, 0.56);
    box-shadow:
        0 0 0 1px rgba(217, 93, 42, 0.28),
        0 0 0 4px rgba(217, 93, 42, 0.08);
    transform: translateY(-1px);
}

.login-form__submit {
    height: 56px;
    margin-top: 18px;
    border: 1px solid rgba(209, 226, 238, 0.16);
    border-radius: 16px;
    background:
        linear-gradient(135deg, rgba(14, 62, 96, 0.96) 0%, rgba(10, 40, 66, 0.98) 100%);
    color: #edf7ff;
    font-size: 1.12rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    cursor: pointer;
    box-shadow:
        0 18px 36px rgba(2, 12, 22, 0.34),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
    transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease, border-color 0.22s ease;
}

.login-form__submit:hover {
    transform: translateY(-2px);
    border-color: rgba(217, 93, 42, 0.28);
    box-shadow:
        0 22px 42px rgba(2, 12, 22, 0.38),
        0 0 24px rgba(217, 93, 42, 0.12),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
    filter: brightness(1.04);
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
        padding: 140px 0 40px;
    }

    .login-card {
        width: min(100%, 472px);
    }
}

@media (max-width: 640px) {
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
        min-height: auto;
        padding: 36px 18px 30px;
    }

    .login-card__header h2 {
        font-size: 2.2rem;
    }
}
</style>
