import LibraryManager from './LibraryManager';
import ContentManager from './ContentManager';
import { ILibraryAdministrationOverviewItem, IInstalledLibrary } from './types';
/**
 * This class has methods that perform library administration, i.e, deleted
 * libraries. All parameters undergo validation and proper exceptions are thrown
 * when something went wrong.
 */
export default class LibraryAdministration {
    protected libraryManager: LibraryManager;
    protected contentManager: ContentManager;
    constructor(libraryManager: LibraryManager, contentManager: ContentManager);
    /**
     * Deletes a library.
     *
     * Throws H5pError with HTTP status code 423 if the library cannot be
     * deleted because it is still in use.
     * @param ubername the ubername of the library to delete
     */
    deleteLibrary(ubername: string): Promise<void>;
    /**
     * Lists all installed libraries. This operation can be relatively costly
     * as it has to go through the whole library metadata and calculate
     * usage of libraries across all content objects on the system.
     */
    getLibraries(): Promise<ILibraryAdministrationOverviewItem[]>;
    /**
     * Returns detailed information about the library and its use.
     * @param ubername
     */
    getLibrary(ubername: string): Promise<IInstalledLibrary & {
        /**
         * How many libraries depend on this library.
         */
        dependentsCount: number;
        /**
         * How often this library is used in content objects, but only as a
         * dependency.
         */
        instancesAsDependencyCount: number;
        /**
         * How often this library is used in content object as main library.
         */
        instancesCount: number;
        /**
         * Whether the library is an addon.
         */
        isAddon: boolean;
    }>;
    /**
     * Changes the restricted status of a library
     * @param ubername the library's ubername you want to change
     * @param restricted the new value
     */
    restrictLibrary(ubername: string, restricted: boolean): Promise<void>;
    /**
     * Checks if the ubername is valid and if the library is installed.
     * Throws H5pErrors if the name is invalid (400) or the library is not
     * installed (404).
     * @param ubername the ubername to check
     * @returns the parsed library name
     */
    private checkLibrary;
}
