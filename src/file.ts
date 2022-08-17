import { Backend } from '.'

export interface OpFileRaw {
  name: string
  token: string
  ext?: string
  size?: number
  width?: number
  height?: number
  color_r?: number
  color_b?: number
  color_g?: number
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
  ]

  public name: string
  public token: string
  public ext?: string
  public size?: number
  public width?: number
  public height?: number
  public color_r?: number
  public color_b?: number
  public color_g?: number
  public thumb?: string

  constructor(public api: Backend, file: OpFileRaw) {
    this.token = file.token
    this.name = file.name ?? file.token
    Object.assign(this, file)
  }

  clone() {
    return new OpFile(this.api, this)
  }

  link(
    opts: Partial<{ x: number; y: number; contain: 'contain' }> = {}
  ): string {
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

      if ('contain' in opts) {
        suffix += '-contain'
      }
    }
    if (suffix || 'ext' in opts) {
      if (!('ext' in opts)) {
        opts['ext'] = 'webp'
      }
      suffix += `.${opts['ext']}`
    }
    return this.api.storageLink(`${this.token}${suffix}`, this.name)
  }

  isImage(): boolean {
    let ext = this.name.split('.').pop().toLowerCase()
    return OpFile.IMAGE_FORMATS.includes(ext)
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
  colorRgb(): string | undefined {
    if (!this.color_r) return
    return `rgb(${this.color_r},${this.color_g},${this.color_b})`
  }
}
