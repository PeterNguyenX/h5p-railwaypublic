import { IH5PConfig, IKeyValueStorage } from '../types';
/**
 * Stores configuration options and literals that are used throughout the
 * system. Also loads and saves the configuration of changeable values (only
 * those as "user-configurable") in the storage object.
 */
export default class H5PConfig implements IH5PConfig {
    /**
     * @param storage A key-value storage object that persists the changes to
     * the disk or gets them from the implementation/plugin
     * @param defaults default values to use instead of the ones set by this
     * class
     */
    constructor(storage?: IKeyValueStorage, defaults?: Partial<IH5PConfig>);
    ajaxUrl: string;
    baseUrl: string;
    contentFilesUrl: string;
    contentFilesUrlPlayerOverride: string;
    contentTypeCacheRefreshInterval: number;
    contentHubEnabled: boolean;
    contentHubMetadataRefreshInterval: number;
    contentUserDataUrl: string;
    contentWhitelist: string;
    coreApiVersion: {
        major: number;
        minor: number;
    };
    coreUrl: string;
    customization: {
        global: {
            editor?: {
                scripts?: string[];
                styles?: string[];
            };
            player?: {
                scripts?: string[];
                styles?: string[];
            };
        };
    };
    disableFullscreen: boolean;
    downloadUrl: string;
    editorAddons?: {
        [machineName: string]: string[];
    };
    editorLibraryUrl: string;
    enableLrsContentTypes: boolean;
    exportMaxContentPathLength: number;
    fetchingDisabled: 0 | 1;
    h5pVersion: string;
    hubContentTypesEndpoint: string;
    hubRegistrationEndpoint: string;
    installLibraryLockMaxOccupationTime: number;
    installLibraryLockTimeout: number;
    contentHubContentEndpoint: string;
    contentHubMetadataEndpoint: string;
    librariesUrl: string;
    libraryConfig: {
        [machineName: string]: any;
    };
    libraryWhitelist: string;
    lrsContentTypes: string[];
    maxFileSize: number;
    maxTotalSize: number;
    paramsUrl: string;
    platformName: string;
    platformVersion: string;
    playerAddons?: {
        [machineName: string]: string[];
    };
    playUrl: string;
    proxy?: {
        host: string;
        port: number;
        protocol?: 'http' | 'https';
    };
    sendUsageStatistics: boolean;
    setFinishedUrl: string;
    setFinishedEnabled: boolean;
    siteType: 'local' | 'network' | 'internet';
    contentUserStateSaveInterval: number | false;
    temporaryFileLifetime: number;
    temporaryFilesUrl: string;
    uuid: string;
    private storage;
    /**
     * Loads all changeable settings from storage. (Should be called when the system initializes.)
     */
    load(): Promise<H5PConfig>;
    /**
     * Saves all changeable settings to storage. (Should be called when a setting was changed.)
     */
    save(): Promise<void>;
    /**
     * Loads a settings from the storage interface. Uses the default value
     * configured in this file if there is none in the configuration.
     * @param settingName
     * @returns the value of the setting
     */
    private loadSettingFromStorage;
    /**
     * Saves a setting to the storage interface.
     * @param settingName
     */
    private saveSettingToStorage;
}
