import { Writable } from 'stream';
import { IContentStorage, ContentId, IUser, IPermissionSystem } from './types';
import LibraryManager from './LibraryManager';
/**
 * Offers functionality to create .h5p files from content that is stored in the
 * system.
 */
export default class PackageExporter {
    private libraryManager;
    private contentStorage;
    /**
     * @param libraryManager
     * @param contentStorage (optional) Only needed if you want to use the
     * PackageExporter to copy content from a package (e.g. Upload option in the
     * editor)
     */
    constructor(libraryManager: LibraryManager, contentStorage: IContentStorage, { exportMaxContentPathLength, permissionSystem }: {
        exportMaxContentPathLength: number;
        permissionSystem?: IPermissionSystem;
    });
    private maxContentPathLength;
    private permissionSystem;
    /**
     * Creates a .h5p-package for the specified content file and pipes it to the
     * stream. Throws H5pErrors if something goes wrong. The contents of the
     * stream should be disregarded then.
     *
     * IMPORTANT: This method's returned promise will resolve BEFORE piping to
     * the writeable has been finished. If you outputStream is directly piped to
     * a download that's not an issue, but if you do something else with this
     * stream, you have to wait for the piping to finish by subscribing to the
     * 'finish' event of the stream!
     *
     * @param contentId The contentId for which the package should be created.
     * @param outputStream The stream that the package is written to (e.g. the
     * response stream fo Express)
     */
    createPackage(contentId: ContentId, outputStream: Writable, user: IUser): Promise<void>;
    /**
     * Adds the files inside the content directory to the zip file. Does not
     * include content.json!
     * @param contentId the contentId of the content
     * @param user the user who wants to export
     * @param outputZipFile the file to write to
     * @param pathSubstitutions list of unix (!) paths to files whose paths were
     * changed in the parameters; this means the paths in the zip file must
     * be changed accordingly
     */
    private addContentFiles;
    /**
     * Adds the library files to the zip file that are required for the content
     * to be playable.
     */
    private addLibraryFiles;
    /**
     * Checks if a piece of content exists and if the user has download
     * permissions for it. Throws an exception with the respective error message
     * if this is not the case.
     */
    private checkPermission;
    /**
     * Creates a readable stream for the content.json file
     */
    private createContentFileStream;
    /**
     * Gets the metadata for the piece of content (h5p.json) and also creates a
     * file stream for it.
     */
    private getMetadata;
    /**
     * Scans the parameters of the piece of content and looks for paths that are
     * longer than the specified max length. If this happens the filenames are
     * shortened in the parameters and the substitution is returned in the
     * substitution list
     * @param parameters the parameters to scan; IMPORTANT: The parameters are
     * mutated by this method!!!
     * @param metadata the metadata of the piece of content
     * @param maxFilenameLength the maximum acceptable filename length
     * @returns an object whose keys are old paths and values the new paths to
     * be used instead; IMPORTANT: All paths are unix paths using slashes as
     * directory separators!
     */
    private shortenFilenames;
}
