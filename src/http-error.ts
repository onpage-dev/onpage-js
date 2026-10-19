import { AxiosError } from 'axios'
import {
  HttpError,
  HttpInternalRequestConfig,
  HttpResponse,
} from './http-types'

export type ApiError<T = unknown, D = any, P = any> = HttpError<T, D, P>
type ApiErrorConstructor = Omit<typeof AxiosError, 'prototype' | 'from'> & {
  new <T = unknown, D = any, P = any>(
    message?: string,
    code?: string,
    config?: HttpInternalRequestConfig<D, P>,
    request?: any,
    response?: HttpResponse<T, D, unknown, P>
  ): ApiError<T, D, P>
  prototype: ApiError
  from<T = unknown, D = any, P = any>(
    error: unknown,
    code?: string,
    config?: HttpInternalRequestConfig<D, P>,
    request?: any,
    response?: HttpResponse<T, D, unknown, P>,
    customProps?: object
  ): ApiError<T, D, P>
}

// Preserve constructor identity, instanceof and the static Axios error codes.
export const ApiError = AxiosError as ApiErrorConstructor
