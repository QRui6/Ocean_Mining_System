<template>
    <LoginScreen v-show="!isAuthenticated" @loginSuccess="handleLoginSuccess" />
    <SystemShell v-if="hasInitializedShell" v-show="isAuthenticated" @logout="handleLogout" />
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import LoginScreen from './components/LoginScreen.vue';
import SystemShell from './SystemShell.vue';
import { AUTH_SESSION_KEY } from './config/auth.js';

const LOGIN_HASH = '#login';
const APP_HASH = '#app';

export default {
    name: 'App',
    components: {
        LoginScreen,
        SystemShell
    },
    setup() {
        const isAuthenticated = ref(false);
        const hasInitializedShell = ref(false);

        const applyStoredTheme = () => {
            if (typeof window === 'undefined') {
                return;
            }
            const savedTheme = localStorage.getItem('ocean-mining-theme') || 'dark';
            document.documentElement.setAttribute('data-theme', savedTheme);
        };

        const hasStoredSession = () => {
            if (typeof window === 'undefined') {
                return false;
            }
            const rawSession = sessionStorage.getItem(AUTH_SESSION_KEY);
            if (!rawSession) {
                return false;
            }

            try {
                JSON.parse(rawSession);
                return true;
            } catch (error) {
                sessionStorage.removeItem(AUTH_SESSION_KEY);
                return false;
            }
        };

        const syncHistoryState = (authenticated, replace = false) => {
            if (typeof window === 'undefined') {
                return;
            }

            const hash = authenticated ? APP_HASH : LOGIN_HASH;
            const state = { screen: authenticated ? 'app' : 'login' };

            if (window.location.hash === hash) {
                return;
            }

            const historyMethod = replace ? 'replaceState' : 'pushState';
            window.history[historyMethod](state, '', hash);
        };

        const syncScreenFromLocation = (replace = false) => {
            if (typeof window === 'undefined') {
                return;
            }

            const hasSession = hasStoredSession();
            const currentHash = window.location.hash;

            if (currentHash === LOGIN_HASH) {
                isAuthenticated.value = false;
                return;
            }

            if (currentHash === APP_HASH) {
                if (hasSession) {
                    isAuthenticated.value = true;
                    hasInitializedShell.value = true;
                } else {
                    isAuthenticated.value = false;
                    syncHistoryState(false, true);
                }
                return;
            }

            isAuthenticated.value = hasSession;
            hasInitializedShell.value = hasSession;
            syncHistoryState(hasSession, replace);
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
            hasInitializedShell.value = true;
            syncHistoryState(true);
        };

        const handleLogout = () => {
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem(AUTH_SESSION_KEY);
            }
            isAuthenticated.value = false;
            syncHistoryState(false);
        };

        const handlePopState = () => {
            syncScreenFromLocation();
        };

        onMounted(() => {
            applyStoredTheme();
            syncScreenFromLocation(true);
            window.addEventListener('popstate', handlePopState);
        });

        onUnmounted(() => {
            if (typeof window === 'undefined') {
                return;
            }
            window.removeEventListener('popstate', handlePopState);
        });

        return {
            isAuthenticated,
            hasInitializedShell,
            handleLoginSuccess,
            handleLogout
        };
    }
};
</script>
