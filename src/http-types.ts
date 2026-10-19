import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'

/** HTTP options accepted across Axios copies, without importing their recursive header types. */
export type HttpHeaderValue =
  | string
  | string[]
  | number
  | boolean
  | null
  | undefined
  | HttpHeadersObject
export interface HttpHeadersObject {
  toJSON(asStrings?: boolean): Record<string, unknown>
}
export type HttpHeadersInput =
  | Record<string, HttpHeaderValue>
  | HttpHeadersObject

export interface HttpCancelReason {
  message: string | undefined
}
export interface HttpCancelToken {
  promise: Promise<HttpCancelReason>
  reason?: HttpCancelReason
  throwIfRequested(): void
  subscribe?(listener: (reason: HttpCancelReason) => void): void
  unsubscribe?(listener: (reason: HttpCancelReason) => void): void
  toAbortSignal?(): AbortSignal
}

// Axios callbacks expose transport-owned configs and headers. Keep those callback
// arguments open across copies, while checking ordinary options and response data.
export type HttpTransformer = (
  this: any,
  data: any,
  headers: any,
  status?: number
) => any
export type HttpAdapter = {
  invoke(config: HttpInternalRequestConfig): Promise<HttpResponse>
}['invoke']
export type HttpBeforeRedirect = {
  invoke(
    options: Record<string, any>,
    response: { headers: Record<string, string>; statusCode: number },
    request: { headers: Record<string, string>; url: string; method: string }
  ): void
}['invoke']
export type HttpLookup =
  | {
      invoke(
        hostname: string,
        options: object,
        callback: (...args: any[]) => void
      ): void
    }['invoke']
  | ((hostname: string, options: object) => Promise<any>)

export type HttpRequestConfig<D = any, P = any> = Omit<
  AxiosRequestConfig<D, P>,
  | 'headers'
  | 'cancelToken'
  | 'transformRequest'
  | 'transformResponse'
  | 'adapter'
  | 'withXSRFToken'
  | 'beforeRedirect'
  | 'lookup'
> & {
  headers?: HttpHeadersInput
  cancelToken?: HttpCancelToken
  transformRequest?: HttpTransformer | HttpTransformer[]
  transformResponse?: HttpTransformer | HttpTransformer[]
  adapter?: HttpAdapter | string | Array<HttpAdapter | string>
  withXSRFToken?:
    | boolean
    | ((config: HttpInternalRequestConfig<D, P>) => boolean | undefined)
  beforeRedirect?: HttpBeforeRedirect
  lookup?: HttpLookup
}

export type HttpInternalRequestConfig<D = any, P = any> = Omit<
  HttpRequestConfig<D, P>,
  | 'headers'
  | 'cancelToken'
  | 'adapter'
  | 'transformRequest'
  | 'transformResponse'
  | 'withXSRFToken'
  | 'beforeRedirect'
  | 'paramsSerializer'
  | 'responseType'
  | 'lookup'
  | 'onUploadProgress'
  | 'onDownloadProgress'
> & {
  // Transport-owned metadata can contain recursive classes and hook signatures
  // from either installation. Request inputs and response data remain checked.
  headers: any
  cancelToken?: any
  adapter?: any
  transformRequest?: any
  transformResponse?: any
  withXSRFToken?: any
  beforeRedirect?: any
  paramsSerializer?: any
  responseType?: any
  lookup?: any
  onUploadProgress?: any
  onDownloadProgress?: any
}

export interface HttpResponse<T = any, D = any, H = unknown, P = any> {
  data: T
  status: number
  statusText: string
  headers: H & Record<string, any>
  config: HttpInternalRequestConfig<D, P>
  request?: any
}

export interface HttpError<T = unknown, D = any, P = any>
  extends Omit<AxiosError<T, D, P>, 'config' | 'response'> {
  config?: HttpInternalRequestConfig<D, P>
  response?: HttpResponse<T, D, unknown, P>
}

export interface HttpInterceptorManager<V> {
  use(
    onFulfilled?: ((value: V) => V | Promise<V>) | null,
    onRejected?: ((error: any) => any) | null,
    options?: {
      synchronous?: boolean
      runWhen?: ((config: HttpInternalRequestConfig) => boolean) | null
    }
  ): number
  eject(id: number): void
  clear(): void
}

interface HttpCalls {
  call<T = any, R = HttpResponse<T>, D = any>(
    config: HttpRequestConfig<D>
  ): Promise<R>
  call<T = any, R = HttpResponse<T>, D = any>(
    url: string,
    config?: HttpRequestConfig<D>
  ): Promise<R>
}
interface HttpRead {
  invoke<T = any, R = HttpResponse<T>, D = any>(
    url: string,
    config?: HttpRequestConfig<D>
  ): Promise<R>
}
interface HttpWrite {
  invoke<T = any, R = HttpResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: HttpRequestConfig<D>
  ): Promise<R>
}
export type HttpCreateConfig = Omit<HttpRequestConfig, 'headers'> & {
  headers?: HttpHeadersInput | Record<string, unknown>
}
export type HttpClient = HttpCalls['call'] & {
  defaults: Omit<HttpInternalRequestConfig, 'headers'> & { headers: any }
  interceptors: {
    request: HttpInterceptorManager<HttpInternalRequestConfig>
    response: HttpInterceptorManager<HttpResponse>
  }
  create(config?: HttpCreateConfig): HttpClient
  getUri(config?: HttpRequestConfig): string
  request<T = any, R = HttpResponse<T>, D = any>(
    config: HttpRequestConfig<D>
  ): Promise<R>
  get: HttpRead['invoke']
  delete: HttpRead['invoke']
  head: HttpRead['invoke']
  options: HttpRead['invoke']
  post: HttpWrite['invoke']
  put: HttpWrite['invoke']
  patch: HttpWrite['invoke']
  postForm: HttpWrite['invoke']
  putForm: HttpWrite['invoke']
  patchForm: HttpWrite['invoke']
  query: HttpWrite['invoke']
}

/** Native modern overloads plus the transport-independent overloads for older consumers. */
export type HttpInstance = {
  create(config?: HttpCreateConfig): HttpInstance
} & HttpClient &
  AxiosInstance

/** A caller may supply an Axios instance from its own installation. */
export interface HttpClientSource {
  (...args: any[]): any
  defaults: { headers: any }
  interceptors: {
    request: { use: (...args: any[]) => any }
    response: { use: (...args: any[]) => any }
  }
  request(...args: any[]): Promise<any>
  get(...args: any[]): Promise<any>
  post(...args: any[]): Promise<any>
  delete(...args: any[]): Promise<any>
  head(...args: any[]): Promise<any>
  options(...args: any[]): Promise<any>
  put(...args: any[]): Promise<any>
  patch(...args: any[]): Promise<any>
  postForm(...args: any[]): Promise<any>
  putForm(...args: any[]): Promise<any>
  patchForm(...args: any[]): Promise<any>
  getUri(...args: any[]): string
  create?(...args: any[]): HttpClientSource
}
