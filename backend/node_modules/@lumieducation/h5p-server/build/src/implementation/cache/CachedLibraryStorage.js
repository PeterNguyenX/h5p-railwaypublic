"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cache_manager_1 = require("cache-manager");
const LibraryName_1 = __importDefault(require("../../LibraryName"));
const InstalledLibrary_1 = __importDefault(require("../../InstalledLibrary"));
/**
 * A wrapper around an actual library storage which adds caching and also
 * handles cache invalidation for you. You can use this method as a drop-in
 * replacement for other library storages.
 *
 * It uses [the NPM package
 * `cache-manager`](https://www.npmjs.com/package/cache-manager) to abstract the
 * caching, so you can pass in any of the store engines supported by it (e.g.
 * redis, mongodb, fs, memcached). See the documentation page of `cache-manager`
 * for more details.
 *
 * Note: If you construct `CachedLibraryStorage` without a cache, it will
 * default to an in-memory cache that **is not suitable for multi-process or
 * multi-machine setups**!
 */
class CachedLibraryStorage {
    storage;
    cache;
    /**
     * @param storage the uncached storage behind the cache
     * @param cache the cache to use; if undefined an in-memory cache will be
     * used; **IMPORTANT: The default in-memory cache does not with
     * multi-process or multi-machine setups!**
     */
    constructor(storage, cache) {
        this.storage = storage;
        this.cache = cache;
        if (!this.cache) {
            this.cache = (0, cache_manager_1.caching)({
                store: 'memory',
                ttl: 60 * 60 * 24,
                max: 2 ** 10
            });
        }
    }
    ADDONS_CACHE_KEY = 'addons';
    FILE_EXISTS_CACHE_KEY = 'exists';
    FILE_LIST = 'files';
    INSTALLED_LIBRARY_NAMES_CACHE_KEY = 'installed-library-names';
    JSON_CACHE_KEY = 'json';
    LANGUAGES_CACHE_KEY = 'languages';
    LIBRARY_IS_INSTALLED_CACHE_KEY = 'is-installed';
    METADATA_CACHE_KEY = 'metadata';
    STATS_CACHE_KEY = 'stats';
    STRING_CACHE_KEY = 'string';
    async addFile(library, filename, readStream) {
        const result = await this.storage.addFile(library, filename, readStream);
        await this.deleteFileCache(library, filename);
        return result;
    }
    async addLibrary(libraryData, restricted) {
        const result = this.storage.addLibrary(libraryData, restricted);
        await this.cache.del(this.INSTALLED_LIBRARY_NAMES_CACHE_KEY);
        await this.cache.del(this.ADDONS_CACHE_KEY);
        await this.cache.del(this.getCacheKeyForMetadata(libraryData, this.LIBRARY_IS_INSTALLED_CACHE_KEY));
        await this.cache.del(this.getCacheKeyForLibraryListByMachineName(libraryData.machineName));
        await this.cache.del(this.getCacheKeyForMetadata(libraryData, this.FILE_LIST));
        return result;
    }
    /**
     * Invalidates the whole cache.
     */
    async clearCache() {
        return this.cache.reset();
    }
    async clearFiles(library) {
        const files = await this.storage.listFiles(library);
        await this.storage.clearFiles(library);
        await this.cache.del(this.getCacheKeyForMetadata(library, this.FILE_LIST));
        await Promise.all(files.map((file) => this.deleteFileCache(library, file)));
    }
    async deleteLibrary(library) {
        const files = await this.storage.listFiles(library);
        await this.storage.deleteLibrary(library);
        await Promise.all(files
            .map((file) => this.deleteFileCache(library, file))
            .concat([
            this.cache.del(this.getCacheKeyForMetadata(library, this.METADATA_CACHE_KEY)),
            this.cache.del(this.getCacheKeyForMetadata(library, this.LANGUAGES_CACHE_KEY)),
            this.cache.del(this.getCacheKeyForMetadata(library, this.LIBRARY_IS_INSTALLED_CACHE_KEY)),
            this.cache.del(this.INSTALLED_LIBRARY_NAMES_CACHE_KEY),
            this.cache.del(this.getCacheKeyForLibraryListByMachineName(library.machineName)),
            this.cache.del(this.ADDONS_CACHE_KEY),
            this.cache.del(this.getCacheKeyForMetadata(library, this.FILE_LIST))
        ]));
    }
    async fileExists(library, filename) {
        return this.cache.wrap(this.getCacheKeyForFile(library, filename, this.FILE_EXISTS_CACHE_KEY), () => this.storage.fileExists(library, filename));
    }
    /**
     * Not cached as the function will be called only very rarely.
     */
    async getAllDependentsCount() {
        return this.storage.getAllDependentsCount();
    }
    /**
     * Not cached as the function will be called only very rarely.
     */
    async getDependentsCount(library) {
        return this.storage.getDependentsCount(library);
    }
    async getFileAsJson(library, file) {
        return this.cache.wrap(this.getCacheKeyForFile(library, file, this.JSON_CACHE_KEY), () => this.storage.getFileAsJson(library, file));
    }
    async getFileAsString(library, file) {
        return this.cache.wrap(this.getCacheKeyForFile(library, file, this.STRING_CACHE_KEY), () => this.storage.getFileAsString(library, file));
    }
    async getFileStats(library, file) {
        return this.cache.wrap(this.getCacheKeyForFile(library, file, this.STATS_CACHE_KEY), () => this.storage.getFileStats(library, file));
    }
    /**
     * We don't cache file streams, as this doesn't make much sense. A better
     * way to improve performance of files requested individually by the client
     * is to serve them statically, i.e. directly via Express or by offloading
     * them to S3 storage or a CDN.
     */
    async getFileStream(library, file) {
        return this.storage.getFileStream(library, file);
    }
    async getInstalledLibraryNames(machineName) {
        if (machineName) {
            return this.cache.wrap(this.getCacheKeyForLibraryListByMachineName(machineName), () => this.storage.getInstalledLibraryNames(machineName));
        }
        return this.cache.wrap(this.INSTALLED_LIBRARY_NAMES_CACHE_KEY, () => this.storage.getInstalledLibraryNames());
    }
    async getLanguages(library) {
        return this.cache.wrap(this.getCacheKeyForMetadata(library, this.LANGUAGES_CACHE_KEY), () => this.storage.getLanguages(library));
    }
    async getLibrary(library) {
        const result = await this.cache.wrap(this.getCacheKeyForMetadata(library, this.METADATA_CACHE_KEY), () => this.storage.getLibrary(library));
        // The ILibraryInterface contains methods, so we must construct an
        // object with these methods if we obtained the data from the cache.
        if (!result.compare) {
            return InstalledLibrary_1.default.fromMetadata(result);
        }
        return result;
    }
    async isInstalled(library) {
        return this.cache.wrap(this.getCacheKeyForMetadata(library, this.LIBRARY_IS_INSTALLED_CACHE_KEY), () => this.storage.isInstalled(library));
    }
    async listAddons() {
        if (this.storage.listAddons) {
            return this.cache.wrap(this.ADDONS_CACHE_KEY, () => this.storage.listAddons());
        }
        return [];
    }
    async listFiles(library) {
        return this.cache.wrap(this.getCacheKeyForMetadata(library, this.FILE_LIST), () => this.storage.listFiles(library));
    }
    async updateAdditionalMetadata(library, additionalMetadata) {
        const result = await this.storage.updateAdditionalMetadata(library, additionalMetadata);
        await this.cache.del(this.getCacheKeyForMetadata(library, this.METADATA_CACHE_KEY));
        return result;
    }
    async updateLibrary(libraryMetadata) {
        const result = await this.storage.updateLibrary(libraryMetadata);
        await this.cache.del(this.getCacheKeyForMetadata(libraryMetadata, this.METADATA_CACHE_KEY));
        await this.cache.del(this.INSTALLED_LIBRARY_NAMES_CACHE_KEY);
        await this.cache.del(this.ADDONS_CACHE_KEY);
        await this.cache.del(this.getCacheKeyForLibraryListByMachineName(libraryMetadata.machineName));
        return result;
    }
    async deleteFileCache(library, filename) {
        await Promise.all([
            this.cache.del(this.getCacheKeyForFile(library, filename, this.JSON_CACHE_KEY)),
            this.cache.del(this.getCacheKeyForFile(library, filename, this.STRING_CACHE_KEY)),
            this.cache.del(this.getCacheKeyForFile(library, filename, this.FILE_EXISTS_CACHE_KEY)),
            this.cache.del(this.getCacheKeyForFile(library, filename, this.STATS_CACHE_KEY))
        ]);
    }
    getCacheKeyForFile(library, filename, usage) {
        return `${LibraryName_1.default.toUberName(library)}/${filename}-${usage}`;
    }
    getCacheKeyForLibraryListByMachineName(machineName) {
        return `${this.INSTALLED_LIBRARY_NAMES_CACHE_KEY}-${machineName}`;
    }
    getCacheKeyForMetadata(library, usage) {
        return `${LibraryName_1.default.toUberName(library)}-${usage}`;
    }
}
exports.default = CachedLibraryStorage;
//# sourceMappingURL=CachedLibraryStorage.js.map