import axios, { Axios, AxiosError } from 'axios';
import { inject } from 'vue';
import { InjectionKeys } from '@/models/injectionKeys';
import AppError from '@/models/appError';
import { useErrorStore } from '@/stores/errorStore';

export function useHttpClient() { 

    //const errorHandler = inject(InjectionKeys.errorHandler);
    const e = useErrorStore();

    function axiosHttpGet<T>(url: string, callback: (data: T | null) => void, completed?: () => void): void {
        axios
            .get<T>(url)
            .then((response) => {
                if(response == null || response.data == null || response.data == '')
                    callback(null);
                else
                    callback(response.data);
            })
            .catch((error: Error | AxiosError) => {
                if(e != undefined) {
                    if(axios.isAxiosError(error)) {
                        e.setError(new AppError("Error in HTTP Client", (error as AxiosError).message, error.stack, url));
                    } else {
                        e.setError(new AppError("Error in HTTP Client", (error as Error).message, error.stack, url));
                    }
                }
            })
            .finally(() => {
                if(completed != null)
                    completed();
            });
    }

    function axiosHttpPost<T, R>(url: string, data: any, callback: (data: R | null) => void, completed?: () => void): void {
        axios
            .post<T, any>(url, data)
            .then((response) => {
                if(response == null || response.data == null || response.data == '')
                    callback(null);
                else
                    callback(response.data);
            })
            .catch((error: Error | AxiosError) => {
                if(e != undefined) {
                    if(axios.isAxiosError(error)) {
                        e.setError(new AppError("Error in HTTP Client", (error as AxiosError).message, error.stack, url));
                    } else {
                        e.setError(new AppError("Error in HTTP Client", (error as Error).message, error.stack, url));
                    }
                }
            })
            .finally(() => {
                if(completed != null)
                    completed();
            });
    }

    return {
        get: axiosHttpGet,
        post: axiosHttpPost
      };
}