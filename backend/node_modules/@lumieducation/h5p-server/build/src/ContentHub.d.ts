import { IH5PConfig, IKeyValueStorage } from './types';
export default class ContentHub {
    private config;
    private storage;
    /**
     *
     * @param config The configuration to use.
     * @param storage The storage object.
     */
    constructor(config: IH5PConfig, storage: IKeyValueStorage);
    private httpClient;
    getMetadata: (lang?: string) => Promise<any>;
}
