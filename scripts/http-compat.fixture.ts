import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import { Api, ApiError, HttpResponse, Query } from 'onpage-js'

const api = new Api()
declare const query: Query
const config: AxiosRequestConfig = { timeout: 1000 }
api.get('things', {}, config)
api.post('things', {}, config)
api.delete('things', {}, config)
query.setAxiosOptions(config)
const token = axios.CancelToken.source().token
api.loadSchema({ cancel_token: token })
api.get(
  'things',
  {},
  { cancelToken: token, headers: axios.AxiosHeaders.from({ 'X-Test': 'yes' }) }
)
const response: Promise<AxiosResponse<{ ok: boolean }>> = api.get<{
  ok: boolean
}>('things')
const http: AxiosInstance = api.http
api.http = axios.create()
api.http.interceptors.request.use((value: InternalAxiosRequestConfig) => value)
api.http.interceptors.response.use((value: AxiosResponse) => value)
declare const error: ApiError
const errorEvent = error.event
const constructedErrorEvent = new ApiError('test').event
error.event = constructedErrorEvent
const consumerError: AxiosError = error
const sdkError: ApiError = new AxiosError('test')
const derived: AxiosInstance = api.http.create({
  headers: { common: { 'X-Default': 'yes' } },
})
const direct: Promise<AxiosResponse<{ ok: boolean }>> = api.http.get<{
  ok: boolean
}>('things', config)
const inlineDirect: Promise<AxiosResponse<{ ok: boolean }>> = api.http.get<{
  ok: boolean
}>('things', { timeout: 1000 })
const callable: Promise<AxiosResponse<{ ok: boolean }>> = api.http<{
  ok: boolean
}>({ url: 'things', timeout: 1000 })
api.http.get<
  { ok: boolean },
  HttpResponse<{ ok: boolean }>,
  unknown,
  { filter: string }
>('things', { params: { filter: 'yes' } })
api.http.get<
  { ok: boolean },
  HttpResponse<{ ok: boolean }>,
  unknown,
  { filter: string }
>('things', {
  // @ts-expect-error the native typed-params overload remains checked
  params: { filter: 1 },
})

// Preserve useful checking at the boundary; compatibility must not make the whole API any.
// @ts-expect-error timeout must remain numeric
api.get('things', {}, { timeout: 'invalid' })
// @ts-expect-error direct HTTP calls must also check options
api.http.get('things', { timeout: 'invalid' })
// @ts-expect-error a token needs the cancellation protocol
api.loadSchema({ cancel_token: {} })
// @ts-expect-error an arbitrary object is not a header value
api.get('things', {}, { headers: { 'X-Test': { invalid: true } } })
// @ts-expect-error Axios has no such method
api.http.teleport('things')
async function checkResponseData() {
  const result = await response
  const ok: boolean = result.data.ok
  // @ts-expect-error response data must retain its generic type
  const invalid: string = result.data.ok
  return ok
}
