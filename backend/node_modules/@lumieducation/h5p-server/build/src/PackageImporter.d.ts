import ContentManager from './ContentManager';
import ContentStorer from './ContentStorer';
import LibraryManager from './LibraryManager';
import { ContentId, IContentMetadata, IH5PConfig, ILibraryInstallResult, IPermissionSystem, IUser } from './types';
/**
 * Handles the installation of libraries and saving of content from a H5P package.
 */
export default class PackageImporter {
    private libraryManager;
    private config;
    private permissionSystem;
    private contentManager;
    private contentStorer;
    /**
     * @param libraryManager
     * @param config
     * @param contentStorer
     */
    constructor(libraryManager: LibraryManager, config: IH5PConfig, permissionSystem: IPermissionSystem, contentManager?: ContentManager, contentStorer?: ContentStorer);
    /**
     * Extracts a H5P package to the specified directory.
     * @param packagePath The full path to the H5P package file on the local
     * disk
     * @param directoryPath The full path of the directory to which the package
     * should be extracted
     * @param includeLibraries If true, the library directories inside the
     * package will be extracted.
     * @param includeContent If true, the content folder inside the package will
     * be extracted.
     * @param includeMetadata If true, the h5p.json file inside the package will
     * be extracted.
     * @returns
     */
    static extractPackage(packagePath: string, directoryPath: string, { includeLibraries, includeContent, includeMetadata }: {
        includeContent: boolean;
        includeLibraries: boolean;
        includeMetadata: boolean;
    }): Promise<void>;
    /**
     * Permanently adds content from a H5P package to the system. This means
     * that content is __permanently__ added to storage and necessary libraries
     * are installed from the package if they are not already installed.
     *
     * This is __NOT__ what you want if the user is just uploading a package in
     * the editor client!
     *
     * Throws errors if something goes wrong.
     * @deprecated The method should not be used as it anymore, as there might
     * be issues with invalid filenames!
     * @param packagePath The full path to the H5P package file on the local
     * disk.
     * @param user The user who wants to upload the package.
     * @param contentId (optional) the content id to use for the package
     * @returns the newly assigned content id, the metadata (=h5p.json) and
     * parameters (=content.json) inside the package and a list of installed
     * libraries.
     */
    addPackageLibrariesAndContent(packagePath: string, user: IUser, contentId?: ContentId): Promise<{
        id: ContentId;
        installedLibraries: ILibraryInstallResult[];
        metadata: IContentMetadata;
        parameters: any;
    }>;
    /**
     * Copies files inside the package into temporary storage and installs the
     * necessary libraries from the package if they are not already installed.
     * (This is what you want to do if the user uploads a package in the editor
     * client.) Pass the information returned about the content back to the
     * editor client. Throws errors if something goes wrong.
     * @param packagePath The full path to the H5P package file on the local
     * disk.
     * @param user The user who wants to upload the package.
     * @returns the metadata and parameters inside the package and a list of
     * installed libraries
     */
    addPackageLibrariesAndTemporaryFiles(packagePath: string, user: IUser): Promise<{
        installedLibraries: ILibraryInstallResult[];
        metadata: IContentMetadata;
        parameters: any;
    }>;
    /**
     * Installs all libraries from the package. Assumes that the user calling
     * this has the permission to install libraries! Throws errors if something
     * goes wrong.
     * @param packagePath The full path to the H5P package file on the local
     * disk.
     * @returns a list of the installed libraries
     */
    installLibrariesFromPackage(packagePath: string): Promise<ILibraryInstallResult[]>;
    /**
     * Generic method to process a H5P package. Can install libraries and copy
     * content.
     * @param packagePath The full path to the H5P package file on the local
     * disk
     * @param installLibraries If true, try installing libraries from package.
     * Defaults to false.
     * @param copyMode indicates if and how content should be installed
     * @param user (optional) the user who wants to copy content (only needed
     * when copying content)
     * @returns the newly assigned content id (undefined if not saved
     * permanently), the metadata (=h5p.json) and parameters (=content.json)
     * inside the package. Also includes a list of libraries that were
     * installed.
     */
    private processPackage;
    /**
     * Gets all libraries referenced in the metadata
     * @param metadata
     * @returns the libraries
     */
    private getRequiredLibraries;
}
