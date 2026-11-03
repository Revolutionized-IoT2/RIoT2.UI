import axios, { type AxiosRequestConfig } from 'axios';
import { apiResult, isUnreachable } from '@/composables/connectionState';

/**
 * A failed orchestrator request: the URL, the HTTP status (0 when there was no response) and the
 * reason the orchestrator gave, if any. The message combines the HTTP error with that reason.
 */
export class ApiError extends Error {
    constructor(message: string, readonly url: string, readonly status: number, readonly detail: string | null) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * The reason the orchestrator gave for a failed request: the detail of a problem response
 * (RFC 9457), or a plain text body. Null when it gave none.
 */
export function responseDetail(error: unknown): string | null {
    if (!axios.isAxiosError(error))
        return null;
    const data = error.response?.data as unknown;
    if (typeof data === 'string' && data.trim() !== '')
        return data;
    if (data != null && typeof data === 'object' && typeof (data as { detail?: unknown }).detail === 'string')
        return (data as { detail: string }).detail;
    // A refused workflow save or LLM connection lists its problems.
    const errors = (data as { errors?: unknown } | null)?.errors;
    if (Array.isArray(errors) && errors.length > 0 && errors.every(x => typeof x === 'string'))
        return errors.join('; ');
    return null;
}

export function toApiError(error: unknown, url: string): ApiError {
    if (error instanceof ApiError)
        return error;
    if (axios.isAxiosError(error)) {
        const detail = responseDetail(error);
        const message = detail == null ? error.message : error.message + ': ' + detail;
        return new ApiError(message, url, error.response?.status ?? 0, detail);
    }
    return new ApiError(error instanceof Error ? error.message : String(error), url, 0, null);
}

// An empty body (204, or 200 without content) is null.
function body<T>(data: T): T | null {
    return data == null || (data as unknown) === '' ? null : data;
}

// Every answer, also an error status, shows the API is reachable; no answer (or a gateway error)
// shows it isn't (the connection banner, I46).
function failed(error: unknown, url: string): ApiError {
    const apiError = toApiError(error, url);
    apiResult(!isUnreachable(apiError.status), apiError.message);
    return apiError;
}

function succeeded<T>(data: T): T | null {
    apiResult(true);
    return body(data);
}

/**
 * The orchestrator's HTTP client. Every method resolves to the response body (null when empty)
 * and rejects with an {@link ApiError}; the stores report failures.
 */
export function useHttpClient() {

    async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T | null> {
        try {
            return succeeded((await axios.get<T>(url, config)).data);
        } catch (error) {
            throw failed(error, url);
        }
    }

    async function post<T, R>(url: string, data: T, config?: AxiosRequestConfig): Promise<R | null> {
        try {
            return succeeded((await axios.post<R>(url, data, config)).data);
        } catch (error) {
            throw failed(error, url);
        }
    }

    async function put<T, R>(url: string, data: T, config?: AxiosRequestConfig): Promise<R | null> {
        try {
            return succeeded((await axios.put<R>(url, data, config)).data);
        } catch (error) {
            throw failed(error, url);
        }
    }

    async function remove<R>(url: string): Promise<R | null> {
        try {
            return succeeded((await axios.delete<R>(url)).data);
        } catch (error) {
            throw failed(error, url);
        }
    }

    return {
        get,
        post,
        put,
        delete: remove
    };
}
