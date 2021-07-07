import { Api } from './api'

export default class OpFile {
    public name: string;
    public token: string;
    private api: Api

    constructor(api: Api, file: any) {
        this.api = api;
        this.name = file.name;
        this.token = file.token;
    }

    link(opts: string[] = []): string {
        let suffix = '';
        if (this.isImage() && ('x' in opts) || 'y' in opts) {
            suffix += `.${opts['x']}x${opts['y']}`;

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