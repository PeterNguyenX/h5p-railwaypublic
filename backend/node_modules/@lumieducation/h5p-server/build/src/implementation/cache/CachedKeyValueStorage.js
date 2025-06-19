"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_manager_1 = require("cache-manager");
/**
 * Caches arbitrary key-value pairs.
 */
class CachedKeyValueStorage {
    prefix;
    cache;
    /**
     * @param cache the cache backend, if left undefined, an in-memory cache is
     * created.
     */
    constructor(prefix, cache) {
        this.prefix = prefix;
        this.cache = cache;
        if (!this.cache) {
            this.cache = (0, cache_manager_1.caching)({
                store: 'memory',
                ttl: 60 * 60 * 24,
                max: 2 ** 10
            });
        }
    }
    async load(key) {
        return this.cache.get(`${this.prefix}-${key}`);
    }
    async save(key, value) {
        return this.cache.set(`${this.prefix}-${key}`, value, { ttl: 0 });
    }
}
exports.default = CachedKeyValueStorage;
//# sourceMappingURL=CachedKeyValueStorage.js.map