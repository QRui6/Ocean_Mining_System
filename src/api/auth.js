import { AUTH_API_ENDPOINTS } from '../config/auth.js';

const AUTH_REQUEST_TIMEOUT = 10000;

function getErrorMessage(result, fallbackMessage) {
    return result?.error || result?.message || fallbackMessage;
}

export async function login(payload) {
    let response;

    try {
        response = await fetch(AUTH_API_ENDPOINTS.LOGIN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT)
        });
    } catch (error) {
        if (error.name === 'TimeoutError') {
            throw new Error('登录请求超时，请稍后重试');
        }

        throw new Error('无法连接登录服务，请确认接口已启动');
    }

    let result = null;

    try {
        result = await response.json();
    } catch (error) {
        result = null;
    }

    if (!response.ok) {
        throw new Error(getErrorMessage(result, `登录失败 (${response.status})`));
    }

    if (!result?.success) {
        throw new Error(getErrorMessage(result, '登录失败'));
    }

    if (!result.data) {
        throw new Error('登录响应缺少用户信息');
    }

    return result.data;
}
