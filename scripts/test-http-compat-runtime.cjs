const assert = require('node:assert/strict')
const path = require('node:path')

// Block real fetch before loading Axios; every transport below is simulated.
let fetchImplementation
globalThis.fetch = (...args) => {
  assert.ok(fetchImplementation, 'unexpected fetch blocked')
  return fetchImplementation(...args)
}

async function runtimeChecks(root, consumer, version) {
  const sdk = require(path.join(root, 'dist'))
  const { Api, ApiError, Schema } = sdk
  const native = require(require.resolve('axios', { paths: [root] }))
  const legacy = require(require.resolve('axios', { paths: [consumer] }))
  assert.equal(ApiError, native.AxiosError)
  assert.ok(ApiError.from(new Error('test')) instanceof ApiError)
  const seen = []
  const adapter = async config => {
    seen.push(config)
    return {
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: { 'X-Response': 'yes' },
      config,
    }
  }
  const api = new Api({ token: 'offline-test' })
  api.http.defaults.adapter = adapter
  if (typeof sdk.parseHttpPathWithOpts === 'function') {
    await api.get(
      '.sP/test',
      {},
      { headers: legacy.AxiosHeaders.from({ 'X-Test': version }) }
    )
    assert.equal(seen.at(-1).url, 'test')
    assert.deepEqual(seen.at(-1).opHttp, {
      silenceUserErrors: true,
      priority: true,
    })
    const configured = []
    const uiApi = new Api({
      token: 'offline',
      render_id: 7,
      configureHttp: http => {
        configured.push(http)
        http.defaults.adapter = adapter
        http.interceptors.request.use(actual => {
          actual.headers.set('X-Hook', 'yes')
          return actual
        })
      },
    })
    const cloned = uiApi.clone()
    assert.equal(configured.length, 2)
    await cloned.get('things', {})
    assert.equal(seen.at(-1).headers.get('X-Hook'), 'yes')
    assert.equal(JSON.parse(seen.at(-1).data).render_id, 7)
  }
  const headers = () => legacy.AxiosHeaders.from({ 'X-Test': version })
  const config = () => ({ headers: headers(), timeout: 1234 })
  const assertHeaders = async request => {
    await request
    assert.equal(seen.at(-1).headers.get('X-Test'), version)
  }
  const response = await api.get('test', {}, config())
  assert.equal(response.data.ok, true)
  assert.equal(seen.at(-1).headers.get('X-Test'), version)
  assert.equal(seen.at(-1).timeout, 1234)
  assert.equal(seen.at(-1).method, 'post')
  assert.equal(JSON.parse(seen.at(-1).data)._method, 'get')
  await api.delete('test', {}, config())
  assert.equal(JSON.parse(seen.at(-1).data)._method, 'delete')

  // Callable instance, request(), method helpers, and create() all normalize headers.
  await assertHeaders(api.http({ url: 'test', ...config() }))
  await assertHeaders(api.http('test', config()))
  await assertHeaders(api.http.request({ url: 'test', ...config() }))
  await assertHeaders(api.http.request('test', config()))
  for (const method of ['get', 'delete', 'head', 'options']) {
    await api.http[method]('test', config())
    assert.equal(seen.at(-1).headers.get('X-Test'), version)
  }
  for (const method of ['post', 'put', 'patch', 'query']) {
    await api.http[method]('test', { value: 1 }, config())
    assert.equal(seen.at(-1).headers.get('X-Test'), version)
    assert.equal(JSON.parse(seen.at(-1).data).value, 1)
  }
  for (const method of ['postForm', 'putForm', 'patchForm']) {
    await assertHeaders(api.http[method]('test', { value: 'form' }, config()))
    assert.equal(typeof seen.at(-1).data.append, 'function')
  }
  const child = api.http.create({ headers: { common: headers() } })
  await child.get('test')
  assert.equal(seen.at(-1).headers.get('X-Test'), version)
  for (const method of ['purge', 'link', 'unlink']) {
    const grouped = api.http.create({ headers: { [method]: headers() } })
    await assertHeaders(grouped.request({ url: 'test', method }))
  }
  api.http.defaults.headers.common['X-Disabled'] = 'default'
  for (const marker of [false, null, undefined]) {
    const disabled = legacy.AxiosHeaders.from({ 'X-Disabled': marker })
    await api.get('test', {}, { headers: disabled })
    assert.equal(seen.at(-1).headers.get('X-Disabled'), marker)
    assert.equal(seen.at(-1).headers.toJSON()['X-Disabled'], undefined)
    assert.equal(disabled.get('X-Disabled'), marker)
  }

  // Native class fields replace the constructor's own accessor. Endpoint
  // methods must still adapt their options through that caller-owned client.
  class NativeFieldApi extends Api {
    http = native.create({ adapter })
  }
  const nativeFieldApi = new NativeFieldApi()
  assert.ok('value' in Object.getOwnPropertyDescriptor(nativeFieldApi, 'http'))
  await assertHeaders(nativeFieldApi.get('test', {}, config()))
  assert.equal(JSON.parse(seen.at(-1).data)._method, 'get')

  // Assignment-style subclass initialization keeps the direct-call facade.
  const subclassTransport = native.create({ adapter })
  class AssignedApi extends Api {
    constructor() {
      super()
      this.http = subclassTransport
    }
  }
  const assignedApi = new AssignedApi()
  assert.notEqual(assignedApi.http, subclassTransport)
  await assertHeaders(assignedApi.http.get('test', config()))

  // Hooks and their registration IDs still belong to the original Axios instance.
  let hookCalls = 0
  const hookId = api.http.interceptors.request.use(value => {
    hookCalls++
    return value
  })
  await api.get('test', {}, config())
  api.http.interceptors.request.eject(hookId)
  await api.get('test', {}, config())
  assert.equal(hookCalls, 1)
  let transforms = 0
  await api.post(
    'test',
    { value: 1 },
    {
      ...config(),
      transformRequest: [
        function (data, actualHeaders) {
          transforms++
          assert.equal(this.timeout, 1234)
          assert.equal(actualHeaders.get('X-Test'), version)
          return JSON.stringify(data)
        },
      ],
    }
  )
  assert.equal(transforms, 1)

  const schemaJson = {
    id: 1,
    company_id: 1,
    label: 'offline',
    langs: ['en'],
    default_lang: 'en',
    created_at: '',
    updated_at: '',
    resources: [],
  }
  api.http.defaults.adapter = async actual => ({
    data: schemaJson,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: actual,
  })
  const loaded = await api.loadSchema({
    cancel_token: legacy.CancelToken.source().token,
  })
  assert.equal(loaded.id, 1)
  const schema = new Schema(api, {
    ...schemaJson,
    resources: [
      {
        id: 1,
        name: 'products',
        fields: [],
        opts: {},
        labels: {},
        created_at: '',
        updated_at: '',
      },
    ],
  })
  api.http.defaults.adapter = async actual => {
    seen.push(actual)
    return {
      data: 12,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: actual,
    }
  }
  assert.equal(
    await schema.query('products').setAxiosOptions(config()).count(),
    12
  )
  assert.equal(seen.at(-1).headers.get('X-Test'), version)
  api.http.defaults.adapter = adapter

  const cancelled = legacy.CancelToken.source()
  cancelled.cancel('already-cancelled')
  const before = seen.length
  await assert.rejects(
    api.get('test', {}, { cancelToken: cancelled.token }),
    error => native.isCancel(error) && error.message === 'already-cancelled'
  )
  assert.equal(seen.length, before)

  const pending = legacy.CancelToken.source()
  let entered = false
  fetchImplementation = request => {
    entered = true
    setTimeout(() => pending.cancel('in-flight'), 0)
    return new Promise((resolve, reject) =>
      request.signal.addEventListener(
        'abort',
        () => reject(request.signal.reason),
        { once: true }
      )
    )
  }
  await assert.rejects(
    api.get(
      'test',
      {},
      { adapter: 'fetch', cancelToken: pending.token, timeout: 1000 }
    ),
    error => native.isCancel(error) && error.message === 'in-flight'
  )
  assert.equal(entered, true)
  fetchImplementation = undefined

  // A caller-supplied instance retains its defaults and interceptors.
  const supplied = legacy.create({ adapter })
  api.http = supplied
  assert.equal(api.http.defaults, supplied.defaults)
  assert.equal(api.http.interceptors, supplied.interceptors)
  await api.get('test', {}, config())
  assert.equal(seen.at(-1).headers.get('X-Test'), version)
  await api.http.query('test', { value: 2 }, config())
  assert.equal(seen.at(-1).method, 'query')
  const original = api.http.get
  let replaced = 0
  api.http.get = async () => {
    replaced++
    return { data: 'mock' }
  }
  assert.equal((await api.http.get('test')).data, 'mock')
  api.http.get = original
  await api.http.get('test', config())
  assert.equal(replaced, 1)
  assert.equal(seen.at(-1).headers.get('X-Test'), version)

  // Decorated callable methods retain their own metadata and restore helpers.
  const decoratedApi = new Api()
  decoratedApi.http.defaults.adapter = adapter
  const originalDecoratedGet = decoratedApi.http.get
  let decoratedCalls = 0
  const decorated = async () => {
    decoratedCalls++
    return { data: 'decorated' }
  }
  Object.defineProperty(decorated, 'callCount', { get: () => decoratedCalls })
  decorated.restore = () => { decoratedApi.http.get = originalDecoratedGet }
  decoratedApi.http.get = decorated
  assert.equal(decoratedApi.http.get.restore, decorated.restore)
  assert.equal((await decoratedApi.http.get('test')).data, 'decorated')
  assert.equal(decoratedApi.http.get.callCount, 1)
  decoratedApi.http.get.restore()
  await assertHeaders(decoratedApi.http.get('test', config()))

  // Older declarations omit create(); a custom transport may omit it at runtime.
  const withoutCreate = legacy.create({
    adapter,
    timeout: 987,
    headers: { common: { 'X-Parent': 'yes' } },
  })
  delete withoutCreate.create
  const fallbackApi = new Api()
  fallbackApi.http = withoutCreate
  const fallbackChild = fallbackApi.http.create({ headers: { common: headers() } })
  await assertHeaders(fallbackChild.get('test'))
  assert.equal(seen.at(-1).headers.get('X-Parent'), 'yes')
  assert.equal(seen.at(-1).timeout, 987)
  assert.notEqual(fallbackChild.interceptors, withoutCreate.interceptors)
  assert.equal(withoutCreate.create, undefined)

  // Property definitions used by mocking libraries reach the selected client.
  const mockedApi = new Api()
  mockedApi.http.defaults.adapter = adapter
  const getDescriptor = Object.getOwnPropertyDescriptor(mockedApi.http, 'get')
  let spyCalls = 0
  const spy = async () => {
    spyCalls++
    return { data: 'spy' }
  }
  Object.defineProperty(mockedApi.http, 'get', {
    value: spy, writable: true, configurable: true, enumerable: true,
  })
  assert.equal((await mockedApi.http.get('test')).data, 'spy')
  assert.equal(spyCalls, 1)
  // Restoring an accessor descriptor must not make it recurse through itself.
  Object.defineProperty(mockedApi.http, 'get', getDescriptor)
  await assertHeaders(mockedApi.http.get('test', config()))
  Object.freeze(mockedApi.http)
  await assertHeaders(mockedApi.http.get('test', config()))
  assert.equal(Reflect.defineProperty(mockedApi.http, 'get', { value: spy }), false)
  await assertHeaders(mockedApi.http.get('test', config()))
  assert.equal(Reflect.defineProperty(mockedApi.http, 'extra', { value: true }), false)

  const readonlyMethod = new Api()
  readonlyMethod.http.defaults.adapter = adapter
  Object.defineProperty(readonlyMethod.http, 'get', {
    writable: false, configurable: false,
  })
  await assertHeaders(readonlyMethod.http.get('test', config()))

  // Frozen caller-owned transports and a frozen facade still adapt requests.
  const immutableTransport = legacy.create({ adapter })
  Object.freeze(immutableTransport)
  const immutableApi = new Api()
  immutableApi.http = immutableTransport
  assert.deepEqual(Object.keys(immutableApi.http), Object.keys(immutableTransport))
  assert.equal(Object.prototype.hasOwnProperty.call(immutableApi.http, 'defaults'), true)
  assert.equal(Object.assign({}, immutableApi.http).defaults, immutableTransport.defaults)
  await assertHeaders(immutableApi.http.get('test', config()))
  const immutableChild = immutableApi.http.create({ headers: { common: headers() } })
  await assertHeaders(immutableChild.get('test'))
  assert.equal(Reflect.set(immutableApi.http, 'get', () => {}), false)
  Object.freeze(immutableApi.http)
  assert.equal(Object.isFrozen(immutableApi.http), true)
  await assertHeaders(immutableApi.http({ url: 'test', ...config() }))
  await assertHeaders(immutableApi.http.get('test', config()))
  assert.equal(Reflect.set(immutableApi.http, 'get', () => {}), false)
  assert.equal(Reflect.deleteProperty(immutableApi.http, 'get'), false)
  assert.equal(Reflect.set(immutableApi.http, 'extra', true), false)

  const frozenFacade = new Api()
  frozenFacade.http.defaults.adapter = adapter
  Object.freeze(frozenFacade.http)
  await assertHeaders(frozenFacade.http.get('test', config()))
}
module.exports = { runtimeChecks }
