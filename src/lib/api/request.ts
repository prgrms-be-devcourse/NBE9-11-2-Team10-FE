import { RsData } from "./types";

// lib/api/request.ts
export class ApiError extends Error {
    constructor(
        public readonly resultCode: string,
        message: string,
        public readonly status: number,
        public readonly isAuthError?: boolean // 401/403 구분용
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

interface RequestConfig extends RequestInit {
    skipAuth?: boolean; // 인증 불필요한 엔드포인트용
    retryOnAuthFail?: boolean; // 401 시 자동 재시도 (refresh 용)
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function request<T>(
    endpoint: string,
    config: RequestConfig = {}
): Promise<RsData<T>> {
    const {
        skipAuth,
        retryOnAuthFail = true,
        headers = {},
        ...restConfig
    } = config;

    const url = `${BASE_URL}${endpoint}`;

    const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        ...headers,
    };

    try {
        const response = await fetch(url, {
            ...restConfig,
            headers: defaultHeaders,
            credentials: 'include', // ✅ 쿠키 자동 전송/수신을 위한 필수 옵션
        });

        const rsData: RsData<T> = await response.json();

        // RsData resultCode 기반 에러 처리
        if (rsData.resultCode?.startsWith('F-')) {
            const isAuthError = response.status === 401 || response.status === 403;
            throw new ApiError(rsData.resultCode, rsData.msg, response.status, isAuthError);
        }

        return rsData;

    } catch (error) {
        // 네트워크 오류 또는 파싱 오류
        if (error instanceof ApiError) throw error;

        // fetch 자체 실패 (오프라인 등)
        throw new ApiError(
            'NETWORK_ERROR',
            '서버와 연결할 수 없습니다.',
            0
        );
    }
}

// Helper functions
export const api = {
    get: <T>(url: string, config?: RequestConfig) =>
        request<T>(url, { ...config, method: 'GET' }),

    post: <T>(url: string, body?: unknown, config?: RequestConfig) =>
        request<T>(url, {
            ...config,
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined
        }),

    put: <T>(url: string, body?: unknown, config?: RequestConfig) =>
        request<T>(url, {
            ...config,
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined
        }),

    delete: <T>(url: string, body?: unknown, config?: RequestConfig) =>
        request<T>(url, {
            ...config,
            method: 'DELETE',
            body: body ? JSON.stringify(body) : undefined
        }),
};