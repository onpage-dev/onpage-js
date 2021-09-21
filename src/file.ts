import { Api } from './api'

export class OpFile {
    public name: string;
    public token: string;

    constructor(public api: Api, file: any) {
        this.name = file.name;
        this.token = file.token;
    }

    link(opts: Object = {}): string {
        let suffix = '';
        if (this.isImage()) {

            if ('x' in opts) {
                suffix += `.${opts['x']}x`;

                if ('y' in opts) {
                    suffix += `${opts['y']}`;
                }
            } else {
                if ('y' in opts) {
                    suffix += `.x${opts['y']}`;
                }
            }

            if ('contain' in opts) {
                suffix += '-contain';
            }
        }
        if (suffix || ('ext' in opts)) {
            if (!('ext' in opts)) {
                opts['ext'] = 'jpg';
            }
            suffix += `.${opts['ext']}`;
        }
        return this.api.storageLink(`${this.token}${suffix}`, this.name);
    }

    isImage(): boolean {
        let ext = this.name.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif'].includes(ext);
    }
}