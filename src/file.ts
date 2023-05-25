import { Api, Backend } from '.'

export interface OpFileRaw {
  name: string
  token: string
  ext?: string
  extension?: string
  size?: number
  width?: number
  height?: number
  color_r?: number
  color_b?: number
  color_g?: number
}

export interface FileLinkOptions {
  x?: number
  y?: number
  download?: boolean
  ext?: string
  name?: string
  mode?: 'contain' | 'max' | 'trim'
  inline?: boolean
}

export class OpFile {
  static readonly IMAGE_FORMATS = [
    'png',
    'jpg',
    'jpeg',
    'webp',
    'gif',
    'eps',
    'dwg',
    'svg',
    'tif',
    'tiff',
    'pdf',
    'psd',
  ]

  public name: string
  public token: string
  public ext?: string
  public extension?: string
  public size?: number
  public width?: number
  public height?: number
  public color_r?: number
  public color_b?: number
  public color_g?: number
  public color_a?: number
  public thumb?: string
  public focus?: [number, number]

  constructor(public api: Backend, file: OpFileRaw) {
    this.token = file.token
    this.name = file.name ?? file.token
    Object.assign(this, file)
  }

  clone() {
    return new OpFile(this.api, this)
  }

  link(opts: FileLinkOptions = {}): string {
    let suffix = ''
    if (this.isImage()) {
      if ('x' in opts) {
        suffix += `.${opts['x']}x`

        if ('y' in opts) {
          suffix += `${opts['y']}`
        }
      } else {
        if ('y' in opts) {
          suffix += `.x${opts['y']}`
        }
      }

      if (opts.mode) {
        suffix += '-' + opts.mode
      }
    }
    if (suffix || 'ext' in opts) {
      if (!('ext' in opts)) {
        opts['ext'] = 'webp'
      }
      suffix += `.${opts['ext']}`
    }
    return this.api.storageLink(
      `${this.token}${suffix}`,
      opts.name ?? this.name,
      opts.download
    )
  }

  isImage(): boolean {
    const ext = this.extension ?? this.name.split('.').pop()!.toLowerCase()
    return OpFile.IMAGE_FORMATS.includes(ext)
  }

  getExt(): string {
    return this.extension ?? this.name.split('.').pop()!.toLowerCase()
  }

  serialize() {
    return {
      name: this.name,
      token: this.token,
    }
  }

  resolutionRatio(): undefined | number {
    if (!this.height || !this.width) return
    return this.height / this.width
  }
  colorRgb(a = false): string | undefined {
    if (!this.color_r) return
    return `rgb(${this.color_r},${this.color_g},${this.color_b}${
      a ? ',' + (this.color_a! / 255).toFixed(2) : ''
    })`
  }

  static fromRaw(raw: OpFileRaw): OpFile {
    const api = new Api('app', '')
    return new OpFile(api, raw)
  }
}
