<template>
    <LoginScreen v-if="!isAuthenticated" @loginSuccess="handleLoginSuccess" />
    <SystemShell v-else />
</template>

<script>
import { ref } from 'vue';
import LoginScreen from './components/LoginScreen.vue';
import SystemShell from './SystemShell.vue';
import { AUTH_SESSION_KEY } from './config/auth.js';

export default {
    name: 'App',
    components: {
        LoginScreen,
        SystemShell
    },
    setup() {
        const isAuthenticated = ref(false);

        const applyStoredTheme = () => {
            if (typeof window === 'undefined') {
                return;
            }
            const savedTheme = localStorage.getItem('ocean-mining-theme') || 'dark';
            document.documentElement.setAttribute('data-theme', savedTheme);
        };

        const restoreSession = () => {
            if (typeof window === 'undefined') {
                return;
            }
            const rawSession = sessionStorage.getItem(AUTH_SESSION_KEY);
            if (!rawSession) {
                return;
            }

            try {
                JSON.parse(rawSession);
                isAuthenticated.value = true;
            } catch (error) {
                sessionStorage.removeItem(AUTH_SESSION_KEY);
            }
        };

        const handleLoginSuccess = (user) => {
            sessionStorage.setItem(
                AUTH_SESSION_KEY,
                JSON.stringify({
                    ...user,
                    loginAt: new Date().toISOString()
                })
            );
            isAuthenticated.value = true;
        };

        if (typeof window !== 'undefined') {
            applyStoredTheme();
            restoreSession();
        }

        return {
            isAuthenticated,
            handleLoginSuccess
        };
    }
};
</script>
