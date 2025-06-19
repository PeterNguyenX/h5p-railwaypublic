import { IH5PConfig, IHubContentType, IKeyValueStorage } from './types';
/**
 * This class caches the information about the content types on the H5P Hub.
 *
 * IT DOES NOT exactly correspond to the ContentTypeCache of the original PHP implementation,
 * as it only caches the data (and converts it to a local format). It DOES NOT add information
 * about locally installed libraries and user rights. ContentTypeInformationRepository is meant to do this.
 *
 * Usage:
 * - Get the content type information by calling get().
 * - The method updateIfNecessary() should be called regularly, e.g. through a cron-job.
 * - Use contentTypeCacheRefreshInterval in the IH5PConfig object to set how often
 *   the update should be performed. You can also use forceUpdate() if you want to bypass the
 *   interval.
 */
export default class ContentTypeCache {
    /**
     *
     * @param config The configuration to use.
     * @param storage The storage object.
     */
    constructor(config: IH5PConfig, storage: IKeyValueStorage);
    private config;
    private storage;
    /**
     * Converts an entry from the H5P Hub into a format with flattened versions and integer date values.
     * @param entry the entry as received from H5P Hub
     * @returns the local content type object
     */
    private static convertCacheEntryToLocalFormat;
    /**
     * Creates an identifier for the running instance.
     * @returns id
     */
    private static generateLocalId;
    /**
     * Downloads information about available content types from the H5P Hub. This method will
     * create a UUID to identify this site if required.
     * @returns content types
     */
    downloadContentTypesFromHub(): Promise<any[]>;
    /**
     * Downloads the content type information from the H5P Hub and stores it in the storage object.
     * @returns the downloaded (and saved) cache; undefined if it failed (e.g. because Hub was unreachable)
     */
    forceUpdate(): Promise<any>;
    /**
     * Returns the cache data.
     * @param machineNames (optional) The method only returns content type cache data for these machine names.
     * @returns Cached hub data in a format in which the version objects are flattened into the main object,
     */
    get(...machineNames: string[]): Promise<IHubContentType[]>;
    /**
     * Returns the date and time of the last update of the cache.
     * @returns the date and time; undefined if the cache was never updated before.
     */
    getLastUpdate(): Promise<Date>;
    /**
     * Checks if the cache is not up to date anymore (update interval exceeded).
     * @returns true if cache is outdated, false if not
     */
    isOutdated(): Promise<boolean>;
    /**
     * If the running site has already been registered at the H5P hub, this method will
     * return the UUID of it. If it hasn't been registered yet, it will do so and store
     * the UUID in the storage object.
     * @returns uuid
     */
    registerOrGetUuid(): Promise<string>;
    /**
     * Checks if the interval between updates has been exceeded and updates the cache if necessary.
     * @returns true if cache was updated, false if not
     */
    updateIfNecessary(): Promise<boolean>;
    /**
     * @returns An object with the registration data as required by the H5P Hub
     */
    private compileRegistrationData;
    /**
     * @returns An object with usage statistics as required by the H5P Hub
     */
    private compileUsageStatistics;
}
