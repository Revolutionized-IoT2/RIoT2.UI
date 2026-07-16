import axios, { AxiosError } from 'axios';
import AppError from '@/models/appError';
import { useErrorStore } from '@/stores/errorStore';

export function useHttpClient() {

    const e = useErrorStore();

    function handleError(error: Error | AxiosError, url: string): void {
        if(e == undefined)
            return;

        if(axios.isAxiosError(error)) {
            e.setError(new AppError("Error in HTTP Client", (error as AxiosError).message, error.stack, url));
        } else {
            e.setError(new AppError("Error in HTTP Client", (error as Error).message, error.stack, url));
        }
    }

    async function axiosHttpGet<T>(url: string): Promise<T | null> {
        try {
            const response = await axios.get<T>(url);
            if(response == null || response.data == null || (response.data as unknown) === '')
                return null;

            return response.data;
        } catch (error) {
            handleError(error as Error | AxiosError, url);
            return null;
        }
    }

    async function axiosHttpPost<T, R>(url: string, data: any): Promise<R | null> {
        try {
            const response = await axios.post<R>(url, data);
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
        post: axiosHttpPost
      };
}