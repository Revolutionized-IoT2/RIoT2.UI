import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import AppError from '@/models/appError';
import { useErrorStore } from '@/stores/errorStore';

/**
 * Awaits `request`, then forwards the result to `callback` and invokes
 * `completed` (if provided). Centralizes the callback/completed bridging
 * so API composables don't have to repeat it after every request.
 */
export async function withCallback<T>(request: Promise<T | null>, callback: (data: T | null) => void, completed?: () => void): Promise<void> {
    const data = await request;
    callback(data);
    completed?.();
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
    return null;
}

export function useHttpClient() {

    const e = useErrorStore();

    function handleError(error: Error | AxiosError, url: string): void {
        if(e == undefined)
            return;

        if(axios.isAxiosError(error)) {
            const detail = responseDetail(error);
            const message = detail == null ? error.message : error.message + ': ' + detail;
            e.setError(new AppError("Error in HTTP Client", message, error.stack, url));
        } else {
            e.setError(new AppError("Error in HTTP Client", (error as Error).message, error.stack, url));
        }
    }

    async function axiosHttpGet<T>(url: string, config?: AxiosRequestConfig): Promise<T | null> {
        try {
            const response = await axios.get<T>(url, config);
            if(response == null || response.data == null || (response.data as unknown) === '')
                return null;

            return response.data;
        } catch (error) {
            handleError(error as Error | AxiosError, url);
            return null;
        }
    }

    async function axiosHttpPost<T, R>(url: string, data: T, config?: AxiosRequestConfig): Promise<R | null> {
        try {
            const response = await axios.post<R>(url, data, config);
            if(response == null || response.data == null || (response.data as unknown) === '')
                return null;

            return response.data;
        } catch (error) {
            handleError(error as Error | AxiosError, url);
            return null;
        }
    }

    async function axiosHttpDelete<R>(url: string): Promise<R | null> {
        try {
            const response = await axios.delete<R>(url);
            if(response == null || response.data == null || (response.data as unknown) === '')
                return null;

            return response.data;
        } catch (error) {
            handleError(error as Error | AxiosError, url);
            return null;
        }
    }

    return {
        get: axiosHttpGet,
        post: axiosHttpPost,
        delete: axiosHttpDelete
      };
}