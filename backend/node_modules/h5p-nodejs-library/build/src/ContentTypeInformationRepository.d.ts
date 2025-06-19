import ContentTypeCache from './ContentTypeCache';
import LibraryManager from './LibraryManager';
import { IH5PConfig, IHubInfo, ILibraryInstallResult, IUser } from './types';
/**
 * This class provides access to information about content types that are either available at the H5P Hub
 * or were installed locally. It is used by the editor to display the list of available content types. Technically
 * it fulfills the same functionality as the "ContentTypeCache" in the original PHP implementation, but it has been
 * renamed in the NodeJS version, as it provides more functionality than just caching the information from the Hub:
 *   - it checks if the current user has the rights to update or install a content type
 *   - it checks if a content type in the Hub is installed locally and is outdated locally
 *   - it adds information about only locally installed content types
 */
export default class ContentTypeInformationRepository {
    private contentTypeCache;
    private libraryManager;
    private config;
    /**
     *
     * @param contentTypeCache
     * @param libraryManager
     * @param config
     */
    constructor(contentTypeCache: ContentTypeCache, libraryManager: LibraryManager, config: IH5PConfig);
    /**
     * Gets the information about available content types with all the extra information as listed in the class description.
     */
    get(user: IUser): Promise<IHubInfo>;
    /**
     * Installs a library from the H5P Hub.
     * Throws H5PError exceptions if there are errors.
     * @param machineName The machine name of the library to install (must be listed in the Hub, otherwise rejected)
     * @returns a list of libraries that were installed (includes dependent libraries). Empty if none were installed.
     */
    installContentType(machineName: string, user: IUser): Promise<ILibraryInstallResult[]>;
    /**
     *
     * @param hubInfo
     * @returns The original hub information as passed into the method with appended information about
     * locally installed libraries.
     */
    private addLocalLibraries;
    /**
     * Adds information about installation status, restriction, right to install and up-to-dateness.
     * @param hubInfo
     * @returns The hub information as passed into the method with added information.
     */
    private addUserAndInstallationSpecificInfo;
    /**
     * Checks if users can install library due to their rights.
     * @param library
     */
    private canInstallLibrary;
    /**
     * Checks if the library is restricted e.g. because it is LRS dependent and the
     * admin has restricted them or because it was set as restricted individually.
     * @param library
     */
    private libraryIsRestricted;
}
