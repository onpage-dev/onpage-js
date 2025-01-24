import { Api, ApiOptions, Backend } from '.'
import { isNullOrUndefined } from './utils'

export const IMAGE_EXPORT_FORMATS = ['webp', 'png', 'jpg'] as const
export type ImageExportFormat = (typeof IMAGE_EXPORT_FORMATS)[number]
export const IMAGE_EXPORT_FIT = ['contain', 'fit'] as const
export type ImageExportFit = (typeof IMAGE_EXPORT_FIT)[number]

export interface OpFileRaw {
  name: string
  token: string
  extension?: string
  thumb?: string
  size?: number
  width?: number
  height?: number
  color_r?: number
  color_b?: number
  color_g?: number
  focus?: [number, number]
}

export interface FileLinkOptions {
  x?: number
  y?: number
  download?: boolean
  inline?: boolean
  ext?: string
  name?: string
  /**
   * Default zoom/crop
   * also for internal use trim-{n}
   */
  mode?: 'contain' | 'fit'
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
    'ai',
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
  api: Backend

  constructor(file: OpFileRaw, api?: Backend | ApiOptions) {
    this.api = api instanceof Backend ? api : new Api(api)
    this.token = file.token
    this.name = file.name ?? file.token
    Object.assign(this, file)
  }

  clone() {
    return new OpFile(this, this.api)
  }

  link(opts: FileLinkOptions = {}): string {
    let suffix = ''
    if (this.isImage()) {
      if (!isNullOrUndefined(opts.x)) {
        suffix += `.${opts.x}x`

        if (!isNullOrUndefined(opts.y)) {
          suffix += `${opts.y}`
        }
      } else {
        if (!isNullOrUndefined(opts.y)) {
          suffix += `.x${opts.y}`
        }
      }

      if (opts.mode) {
        suffix += '-' + opts.mode
      } else if (opts.x && opts.y && this.focus) {
        suffix += `-focus-${Math.floor(this.focus[0] * 100)}-${Math.floor(this.focus[1] * 100)}`
      }
    }
    if (suffix || !isNullOrUndefined(opts.ext)) {
      if (!opts.ext) {
        opts.ext = 'webp'
      }
      suffix += `.${opts.ext}`
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
}
