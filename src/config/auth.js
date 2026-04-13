export const AUTH_SESSION_KEY = 'ocean-mining-auth-session';
export const AUTH_API_BASE_URL = (import.meta.env.VITE_AUTH_API_BASE_URL || 'http://localhost:8081')
    .replace(/\/$/, '');

export const AUTH_API_ENDPOINTS = {
    LOGIN: `${AUTH_API_BASE_URL}/api/auth/login`
};

export const DEMO_CREDENTIALS = {
    username: 'admin',
    password: '123456',
    displayName: '管理员'
};
