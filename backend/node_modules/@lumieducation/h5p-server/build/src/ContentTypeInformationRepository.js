"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promisepipe_1 = __importDefault(require("promisepipe"));
const tmp_promise_1 = require("tmp-promise");
const fs_1 = require("fs");
const H5pError_1 = __importDefault(require("./helpers/H5pError"));
const PackageImporter_1 = __importDefault(require("./PackageImporter"));
const types_1 = require("./types");
const Logger_1 = __importDefault(require("./helpers/Logger"));
const TranslatorWithFallback_1 = __importDefault(require("./helpers/TranslatorWithFallback"));
const HttpClient_1 = __importDefault(require("./helpers/HttpClient"));
const log = new Logger_1.default('ContentTypeInformationRepository');
/**
 * This class provides access to information about content types that are either available at the H5P Hub
 * or were installed locally. It is used by the editor to display the list of available content types. Technically
 * it fulfills the same functionality as the "ContentTypeCache" in the original PHP implementation, but it has been
 * renamed in the NodeJS version, as it provides more functionality than just caching the information from the Hub:
 *   - it checks if the current user has the rights to update or install a content type
 *   - it checks if a content type in the Hub is installed locally and is outdated locally
 *   - it adds information about only locally installed content types
 */
class ContentTypeInformationRepository {
    contentTypeCache;
    libraryManager;
    config;
    permissionSystem;
    /**
     *
     * @param contentTypeCache
     * @param libraryManager
     * @param config
     * @param translationCallback (optional) if passed in, the object will try
     * to localize content type information (if a language is passed to the
     * `get(...)` method). You can safely leave it out if you don't want to
     * localize hub information.
     */
    constructor(contentTypeCache, libraryManager, config, permissionSystem, translationCallback) {
        this.contentTypeCache = contentTypeCache;
        this.libraryManager = libraryManager;
        this.config = config;
        this.permissionSystem = permissionSystem;
        log.info(`initialize`);
        if (translationCallback) {
            this.translator = new TranslatorWithFallback_1.default(translationCallback, [
                'hub'
            ]);
        }
        this.httpClient = (0, HttpClient_1.default)(config);
    }
    translator;
    httpClient;
    /**
     * Gets the information about available content types with all the extra
     * information as listed in the class description.
     */
    async get(user, language) {
        log.info(`getting information about available content types`);
        let cachedHubInfo = await this.contentTypeCache.get();
        if (this.translator &&
            language &&
            language.toLowerCase() !== 'en' && // We don't localize English as the base strings already are in English
            !language.toLowerCase().startsWith('en-')) {
            cachedHubInfo = this.localizeHubInfo(cachedHubInfo, language);
        }
        let hubInfoWithLocalInfo = await this.addUserAndInstallationSpecificInfo(cachedHubInfo, user);
        hubInfoWithLocalInfo = await this.addLocalLibraries(hubInfoWithLocalInfo, user);
        return {
            apiVersion: this.config.coreApiVersion,
            details: null, // TODO: implement this (= messages to user)
            libraries: hubInfoWithLocalInfo,
            outdated: (await this.contentTypeCache.isOutdated()) &&
                ((await this.permissionSystem.checkForGeneralAction(user, types_1.GeneralPermission.InstallRecommended)) ||
                    (await this.permissionSystem.checkForGeneralAction(user, types_1.GeneralPermission.UpdateAndInstallLibraries))),
            recentlyUsed: [], // TODO: store this somewhere
            user: user.type
        };
    }
    /**
     * Installs a library from the H5P Hub.
     * Throws H5PError exceptions if there are errors.
     * @param machineName The machine name of the library to install (must be listed in the Hub, otherwise rejected)
     * @returns a list of libraries that were installed (includes dependent libraries). Empty if none were installed.
     */
    async installContentType(machineName, user) {
        log.info(`installing library ${machineName} from hub ${this.config.hubContentTypesEndpoint}`);
        if (!machineName) {
            log.error(`content type ${machineName} not found`);
            throw new H5pError_1.default('hub-install-no-content-type', {}, 404);
        }
        // Reject content types that are not listed in the hub
        const localContentType = await this.contentTypeCache.get(machineName);
        if (!localContentType || localContentType.length === 0) {
            log.error(`rejecting content type ${machineName}: content type is not listed in the hub ${this.config.hubContentTypesEndpoint}`);
            throw new H5pError_1.default('hub-install-invalid-content-type', {}, 400);
        }
        // Reject installation of content types that the user has no permission to
        if (!(await this.canInstallLibrary(localContentType[0], user))) {
            log.warn(`rejecting installation of content type ${machineName}: user has no permission`);
            throw new H5pError_1.default('hub-install-denied', {}, 403);
        }
        // Download content type package from the Hub
        const response = await this.httpClient.get(this.config.hubContentTypesEndpoint + machineName, { responseType: 'stream' });
        let installedLibraries = [];
        // withFile is supposed to clean up the temporary file after it has been used
        await (0, tmp_promise_1.withFile)(async ({ path: tempPackagePath }) => {
            const writeStream = (0, fs_1.createWriteStream)(tempPackagePath);
            try {
                await (0, promisepipe_1.default)(response.data, writeStream);
            }
            catch (error) {
                log.error(error);
                throw new H5pError_1.default('hub-install-download-failed', {}, 504);
            }
            const packageImporter = new PackageImporter_1.default(this.libraryManager, this.config, this.permissionSystem);
            installedLibraries =
                await packageImporter.installLibrariesFromPackage(tempPackagePath);
        }, { postfix: '.h5p', keep: false });
        return installedLibraries;
    }
    /**
     *
     * @param hubInfo
     * @returns The original hub information as passed into the method with appended information about
     * locally installed libraries.
     */
    async addLocalLibraries(hubInfo, user) {
        const localLibsWrapped = await this.libraryManager.listInstalledLibraries();
        const localLibs = Object.keys(localLibsWrapped)
            .map((machineName) => localLibsWrapped[machineName][localLibsWrapped[machineName].length - 1])
            .filter((lib) => !hubInfo.some((hubLib) => hubLib.machineName === lib.machineName) && lib.runnable)
            .map(async (localLib) => ({
            canInstall: false,
            description: '',
            icon: (await this.libraryManager.libraryFileExists(localLib, 'icon.svg'))
                ? this.libraryManager.getLibraryFileUrl(localLib, 'icon.svg')
                : undefined,
            installed: true,
            isUpToDate: true,
            localMajorVersion: localLib.majorVersion,
            localMinorVersion: localLib.minorVersion,
            localPatchVersion: localLib.patchVersion,
            machineName: localLib.machineName,
            majorVersion: localLib.majorVersion,
            minorVersion: localLib.minorVersion,
            owner: '',
            patchVersion: localLib.patchVersion,
            restricted: this.libraryIsRestricted(localLib) &&
                !(await this.permissionSystem.checkForGeneralAction(user, types_1.GeneralPermission.CreateRestricted)),
            title: localLib.title
        }));
        const finalLocalLibs = await Promise.all(localLibs);
        log.info(`adding local libraries: ${finalLocalLibs
            .map((lib) => `${lib.machineName}-${lib.majorVersion}.${lib.minorVersion}`)
            .join(', ')}`);
        return hubInfo.concat(finalLocalLibs);
    }
    /**
     * Adds information about installation status, restriction, right to install and up-to-dateness.
     * @param hubInfo
     * @returns The hub information as passed into the method with added information.
     */
    async addUserAndInstallationSpecificInfo(hubInfo, user) {
        log.info(`adding user and installation specific information`);
        const localLibsWrapped = await this.libraryManager.listInstalledLibraries();
        const localLibs = Object.keys(localLibsWrapped).map((machineName) => localLibsWrapped[machineName][localLibsWrapped[machineName].length - 1]);
        return Promise.all(hubInfo.map(async (hl) => {
            const hubLib = {
                ...hl,
                canInstall: false,
                installed: false,
                isUpToDate: false,
                localMajorVersion: 0,
                localMinorVersion: 0,
                localPatchVersion: 0,
                restricted: false
            };
            const localLib = localLibs.find((l) => l.machineName === hubLib.machineName);
            if (!localLib) {
                hubLib.installed = false;
                hubLib.restricted = !(await this.canInstallLibrary(hubLib, user));
                hubLib.canInstall = await this.canInstallLibrary(hubLib, user);
                hubLib.isUpToDate = true;
            }
            else {
                hubLib.installed = true;
                hubLib.restricted =
                    this.libraryIsRestricted(localLib) &&
                        !(await this.permissionSystem.checkForGeneralAction(user, types_1.GeneralPermission.CreateRestricted));
                hubLib.canInstall =
                    !this.libraryIsRestricted(localLib) &&
                        (await this.canInstallLibrary(hubLib, user));
                hubLib.isUpToDate =
                    !(await this.libraryManager.libraryHasUpgrade(hubLib));
                hubLib.localMajorVersion = localLib.majorVersion;
                hubLib.localMinorVersion = localLib.minorVersion;
                hubLib.localPatchVersion = localLib.patchVersion;
            }
            return hubLib;
        }));
    }
    /**
     * Checks if users can install library due to their rights.
     * @param library
     */
    async canInstallLibrary(library, user) {
        log.verbose(`checking if user can install library ${library.machineName}`);
        return ((await this.permissionSystem.checkForGeneralAction(user, types_1.GeneralPermission.UpdateAndInstallLibraries)) ||
            (library.isRecommended &&
                (await this.permissionSystem.checkForGeneralAction(user, types_1.GeneralPermission.InstallRecommended))));
    }
    /**
     * Checks if the library is restricted e.g. because it is LRS dependent and the
     * admin has restricted them or because it was set as restricted individually.
     * @param library
     */
    libraryIsRestricted(library) {
        log.verbose(`checking if library ${library.machineName} is restricted`);
        if (this.config.enableLrsContentTypes) {
            return library.restricted;
        }
        if (this.config.lrsContentTypes.some((contentType) => contentType === library.machineName)) {
            return true;
        }
        return library.restricted;
    }
    /**
     * Returns a transformed list of content type information in which the
     * visible strings are localized into the desired language. Only works if
     * the namespace 'hub' has been initialized and populated by the i18n
     * system.
     * @param contentTypes
     * @param language
     * @returns the transformed list of content types
     */
    localizeHubInfo(contentTypes, language) {
        if (!this.translator) {
            throw new Error('You need to instantiate ContentTypeInformationRepository with a translationCallback if you want to localize Hub information.');
        }
        return contentTypes.map((ct) => {
            const cleanMachineName = ct.machineName.replace('.', '_');
            return {
                ...ct,
                summary: this.translator.tryLocalize(`${cleanMachineName}.summary`, ct.summary, language),
                description: this.translator.tryLocalize(`${cleanMachineName}.description`, ct.description, language),
                keywords: ct.keywords.map((kw) => this.translator.tryLocalize(`${ct.machineName.replace('.', '_')}.keywords.${kw.replace('_', ' ')}`, kw, language)),
                title: this.translator.tryLocalize(`${cleanMachineName}.title`, ct.title, language)
            };
        });
    }
}
exports.default = ContentTypeInformationRepository;
//# sourceMappingURL=ContentTypeInformationRepository.js.map