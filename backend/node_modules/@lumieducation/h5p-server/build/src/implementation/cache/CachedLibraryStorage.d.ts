import { Readable } from 'stream';
import { Cache } from 'cache-manager';
import { ILibraryStorage, ILibraryName, ILibraryMetadata, IInstalledLibrary, IFileStats, IAdditionalLibraryMetadata } from '../../types';
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
export default class CachedLibraryStorage implements ILibraryStorage {
    protected storage: ILibraryStorage;
    protected cache?: Cache;
    /**
     * @param storage the uncached storage behind the cache
     * @param cache the cache to use; if undefined an in-memory cache will be
     * used; **IMPORTANT: The default in-memory cache does not with
     * multi-process or multi-machine setups!**
     */
    constructor(storage: ILibraryStorage, cache?: Cache);
    private readonly ADDONS_CACHE_KEY;
    private readonly FILE_EXISTS_CACHE_KEY;
    private readonly FILE_LIST;
    private readonly INSTALLED_LIBRARY_NAMES_CACHE_KEY;
    private readonly JSON_CACHE_KEY;
    private readonly LANGUAGES_CACHE_KEY;
    private readonly LIBRARY_IS_INSTALLED_CACHE_KEY;
    private readonly METADATA_CACHE_KEY;
    private readonly STATS_CACHE_KEY;
    private readonly STRING_CACHE_KEY;
    addFile(library: ILibraryName, filename: string, readStream: Readable): Promise<boolean>;
    addLibrary(libraryData: ILibraryMetadata, restricted: boolean): Promise<IInstalledLibrary>;
    /**
     * Invalidates the whole cache.
     */
    clearCache(): Promise<void>;
    clearFiles(library: ILibraryName): Promise<void>;
    deleteLibrary(library: ILibraryName): Promise<void>;
    fileExists(library: ILibraryName, filename: string): Promise<boolean>;
    /**
     * Not cached as the function will be called only very rarely.
     */
    getAllDependentsCount(): Promise<{
        [ubername: string]: number;
    }>;
    /**
     * Not cached as the function will be called only very rarely.
     */
    getDependentsCount(library: ILibraryName): Promise<number>;
    getFileAsJson(library: ILibraryName, file: string): Promise<any>;
    getFileAsString(library: ILibraryName, file: string): Promise<string>;
    getFileStats(library: ILibraryName, file: string): Promise<IFileStats>;
    /**
     * We don't cache file streams, as this doesn't make much sense. A better
     * way to improve performance of files requested individually by the client
     * is to serve them statically, i.e. directly via Express or by offloading
     * them to S3 storage or a CDN.
     */
    getFileStream(library: ILibraryName, file: string): Promise<Readable>;
    getInstalledLibraryNames(machineName?: string): Promise<ILibraryName[]>;
    getLanguages(library: ILibraryName): Promise<string[]>;
    getLibrary(library: ILibraryName): Promise<IInstalledLibrary>;
    isInstalled(library: ILibraryName): Promise<boolean>;
    listAddons?(): Promise<ILibraryMetadata[]>;
    listFiles(library: ILibraryName): Promise<string[]>;
    updateAdditionalMetadata(library: ILibraryName, additionalMetadata: Partial<IAdditionalLibraryMetadata>): Promise<boolean>;
    updateLibrary(libraryMetadata: ILibraryMetadata): Promise<IInstalledLibrary>;
    private deleteFileCache;
    private getCacheKeyForFile;
    private getCacheKeyForLibraryListByMachineName;
    private getCacheKeyForMetadata;
}
