"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Stores configuration options and literals that are used throughout the
 * system. Also loads and saves the configuration of changeable values (only
 * those as "user-configurable") in the storage object.
 */
class H5PConfig {
    /**
     * @param storage A key-value storage object that persists the changes to
     * the disk or gets them from the implementation/plugin
     * @param defaults default values to use instead of the ones set by this
     * class
     */
    constructor(storage, defaults) {
        this.storage = storage;
        if (defaults) {
            for (const key in defaults) {
                if (this[key] !== undefined) {
                    this[key] = defaults[key];
                }
            }
        }
    }
    ajaxUrl = '/ajax';
    baseUrl = '/h5p';
    contentFilesUrl = '/content';
    contentFilesUrlPlayerOverride;
    contentTypeCacheRefreshInterval = 1 * 1000 * 60 * 60 * 24;
    contentHubEnabled = false;
    contentHubMetadataRefreshInterval = 1 * 1000 * 60 * 60 * 24;
    contentUserDataUrl = '/contentUserData';
    contentWhitelist = 'json png jpg jpeg gif bmp tif tiff eot ttf woff woff2 otf webm mp4 ogg mp3 m4a wav txt pdf rtf doc docx xls xlsx ppt pptx odt ods odp xml csv diff patch swf md textile vtt webvtt gltf glb';
    coreApiVersion = {
        major: 1,
        minor: 27
    };
    coreUrl = '/core';
    customization = {
        global: {
            editor: {
                scripts: [],
                styles: []
            },
            player: {
                scripts: [],
                styles: []
            }
        }
    };
    disableFullscreen = false;
    downloadUrl = '/download';
    editorAddons;
    editorLibraryUrl = '/editor';
    enableLrsContentTypes = true;
    exportMaxContentPathLength = 255;
    fetchingDisabled = 0;
    h5pVersion = '1.27.0';
    hubContentTypesEndpoint = 'https://api.h5p.org/v1/content-types/';
    hubRegistrationEndpoint = 'https://api.h5p.org/v1/sites';
    installLibraryLockMaxOccupationTime = 10000;
    installLibraryLockTimeout = 20000;
    contentHubContentEndpoint = 'https://hub-api.h5p.org/v1/contents';
    contentHubMetadataEndpoint = 'https://hub-api.h5p.org/v1/metadata';
    librariesUrl = '/libraries';
    libraryConfig;
    libraryWhitelist = 'js css svg';
    lrsContentTypes = [
        'H5P.Questionnaire',
        'H5P.FreeTextQuestion'
    ];
    maxFileSize = 16 * 1024 * 1024;
    maxTotalSize = 64 * 1024 * 1024;
    paramsUrl = '/params';
    platformName = 'H5P-Editor-NodeJs';
    platformVersion = '0.10';
    playerAddons;
    playUrl = '/play';
    proxy;
    sendUsageStatistics = false;
    setFinishedUrl = '/finishedData';
    setFinishedEnabled = true;
    siteType = 'local';
    contentUserStateSaveInterval = 5 * 1000; // the interval to save the contentUserData in milliseconds
    temporaryFileLifetime = 120 * 60 * 1000; // 120 minutes
    temporaryFilesUrl = '/temp-files';
    uuid = '';
    storage;
    /**
     * Loads all changeable settings from storage. (Should be called when the system initializes.)
     */
    async load() {
        await this.loadSettingFromStorage('baseUrl');
        await this.loadSettingFromStorage('contentFilesUrlPlayerOverride');
        await this.loadSettingFromStorage('contentHubEnabled');
        await this.loadSettingFromStorage('contentHubMetadataRefreshInterval');
        await this.loadSettingFromStorage('contentTypeCacheRefreshInterval');
        await this.loadSettingFromStorage('contentUserStateSaveInterval');
        await this.loadSettingFromStorage('contentWhitelist');
        await this.loadSettingFromStorage('customization');
        await this.loadSettingFromStorage('disableFullscreen');
        await this.loadSettingFromStorage('editorAddons');
        await this.loadSettingFromStorage('enableLrsContentTypes');
        await this.loadSettingFromStorage('exportMaxContentPathLength');
        await this.loadSettingFromStorage('fetchingDisabled');
        await this.loadSettingFromStorage('hubContentTypesEndpoint');
        await this.loadSettingFromStorage('hubRegistrationEndpoint');
        await this.loadSettingFromStorage('libraryConfig');
        await this.loadSettingFromStorage('libraryWhitelist');
        await this.loadSettingFromStorage('maxFileSize');
        await this.loadSettingFromStorage('maxTotalSize');
        await this.loadSettingFromStorage('playerAddons');
        await this.loadSettingFromStorage('proxy');
        await this.loadSettingFromStorage('sendUsageStatistics');
        await this.loadSettingFromStorage('setFinishedEnabled');
        await this.loadSettingFromStorage('siteType');
        await this.loadSettingFromStorage('uuid');
        return this;
    }
    /**
     * Saves all changeable settings to storage. (Should be called when a setting was changed.)
     */
    async save() {
        await this.saveSettingToStorage('contentFilesUrlPlayerOverride');
        await this.saveSettingToStorage('contentHubEnabled');
        await this.saveSettingToStorage('contentHubMetadataRefreshInterval');
        await this.saveSettingToStorage('contentTypeCacheRefreshInterval');
        await this.saveSettingToStorage('contentUserStateSaveInterval');
        await this.saveSettingToStorage('contentWhitelist');
        await this.saveSettingToStorage('customization');
        await this.saveSettingToStorage('disableFullscreen');
        await this.saveSettingToStorage('editorAddons');
        await this.saveSettingToStorage('enableLrsContentTypes');
        await this.saveSettingToStorage('exportMaxContentPathLength');
        await this.saveSettingToStorage('fetchingDisabled');
        await this.saveSettingToStorage('hubContentTypesEndpoint');
        await this.saveSettingToStorage('hubRegistrationEndpoint');
        await this.saveSettingToStorage('libraryConfig');
        await this.saveSettingToStorage('libraryWhitelist');
        await this.saveSettingToStorage('maxFileSize');
        await this.saveSettingToStorage('maxTotalSize');
        await this.saveSettingToStorage('playerAddons');
        await this.saveSettingToStorage('proxy');
        await this.saveSettingToStorage('sendUsageStatistics');
        await this.saveSettingToStorage('setFinishedEnabled');
        await this.saveSettingToStorage('siteType');
        await this.saveSettingToStorage('uuid');
    }
    /**
     * Loads a settings from the storage interface. Uses the default value
     * configured in this file if there is none in the configuration.
     * @param settingName
     * @returns the value of the setting
     */
    async loadSettingFromStorage(settingName) {
        this[settingName] =
            (await this.storage?.load(settingName)) ?? this[settingName];
        return this[settingName];
    }
    /**
     * Saves a setting to the storage interface.
     * @param settingName
     */
    async saveSettingToStorage(settingName) {
        await this.storage?.save(settingName, this[settingName]);
    }
}
exports.default = H5PConfig;
//# sourceMappingURL=H5PConfig.js.map