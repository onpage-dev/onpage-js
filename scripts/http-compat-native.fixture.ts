import axios from 'axios'
import { Api, HttpClientSource } from '../dist'

// A subclass could already replace the public native client before adaptation.
class NativeFieldApi extends Api {
  http = axios.create()
}
class AssignedApi extends Api {
  constructor() {
    super()
    this.http = axios.create()
  }
}
const nativeField = new NativeFieldApi()
const assigned = new AssignedApi()
const nativeClient: ReturnType<typeof axios.create> = nativeField.http
const source: HttpClientSource = axios.create()
// Historical Axios declarations omit create even when the runtime has it.
delete source.create
assigned.http = source

const api = new Api()
const unwrapped: Promise<string> = api.http.get<{ ok: boolean }, string>('things')
