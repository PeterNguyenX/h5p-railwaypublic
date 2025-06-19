import { Cache } from 'cache-manager';
import { IKeyValueStorage } from '../../types';
/**
 * Caches arbitrary key-value pairs.
 */
export default class CachedKeyValueStorage implements IKeyValueStorage {
    private prefix;
    private cache?;
    /**
     * @param cache the cache backend, if left undefined, an in-memory cache is
     * created.
     */
    constructor(prefix: string, cache?: Cache);
    load(key: string): Promise<any>;
    save(key: string, value: any): Promise<any>;
}
