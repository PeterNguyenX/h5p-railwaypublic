import ContentManager from './ContentManager';
import LibraryManager from './LibraryManager';
import TemporaryFileManager from './TemporaryFileManager';
import { ContentId, IContentMetadata, ILibraryName, IUser } from './types';
/**
 * Contains logic to store content in permanent storage. Copies files from temporary storage and
 * deletes unused files.
 */
export default class ContentStorer {
    private contentManager;
    private temporaryFileManager;
    constructor(contentManager: ContentManager, libraryManager: LibraryManager, temporaryFileManager: TemporaryFileManager);
    private contentFileScanner;
    private semanticsEnforcer;
    /**
     * Saves content in the persistence system. Also copies over files from temporary storage
     * or from other content if the content was pasted from there.
     * @param contentId the contentId (can be undefined if previously unsaved)
     * @param parameters the parameters of teh content (= content.json)
     * @param metadata = content of h5p.json
     * @param mainLibraryName the library name
     * @param user the user who wants to save the file
     */
    addOrUpdateContent(contentId: ContentId, parameters: any, metadata: IContentMetadata, mainLibraryName: ILibraryName, user: IUser): Promise<ContentId>;
    /**
     * Scans through the parameters of the content and copies all referenced files into
     * temporary storage.
     * @param packageDirectory
     * @param user
     * @returns the metadata and parameters of the content
     */
    copyFromDirectoryToTemporary(packageDirectory: string, user: IUser): Promise<{
        metadata: IContentMetadata;
        parameters: any;
    }>;
    /**
     * Looks through the file references and check if any of them originate from a copy & paste
     * operation. (Can be detected by checking if the path is relative.) If there are copy & pasted
     * files, these files will be copied over to the new contentId and the references will be updated
     * accordingly.
     * @param fileReferencesInParams The file references found in the parameters
     * @param user the user who wants to save the content
     * @param contentId the content the files will be attached to
     * @returns true if file reference were changed and the changed parameters must be saved
     */
    private copyFilesFromPasteSource;
    /**
     * Copies files from temporary storage into permanent storage
     * @param files the list of filenames to copy
     * @param user the user who is saving the content
     * @param contentId the content id of the object
     * @param deleteTemporaryFiles true if temporary files should be deleted after copying
     * @returns true if paths were updated in the parameters and the content
     * parameters must be saved again
     */
    private copyFilesFromTemporaryStorage;
    /**
     * Removes old files by comparing the two lists and removing those files that
     * are not present in newFiles anymore.
     * @param contentId
     * @param oldFiles
     * @param newFiles
     */
    private deleteUnusedOldFiles;
    /**
     * Returns a list of files that must be copied to permanent storage and modifies the path
     * of these files in the fileReferencesInNewParams object!
     * NOTE: Mind the side effect on fileReferencesInNewParams!
     * @param fileReferencesInNewParams
     * @returns the list of files to copy
     */
    private determineFilesToCopyFromTemporaryStorage;
    /**
     * Retrieves a list of files in the parameters of a content object.
     * @param contentId
     * @param user
     * @returns the list of files
     */
    private getFilesInParams;
    /**
     * Generates a unique filename. Removes short-ids that were added to filenames
     * @param contentId the content object for which the file is about to be saved
     * @param filename the filename on which to base the unique filename on
     * @returns a unique filename (within the content object)
     */
    private getUniqueFilename;
    /**
     * Checks if a path to a file is broken, if it is actually a URL without a
     * protocol.
     * @param brokenPath the path to check
     * @param mimetype (optional) the mimetype of the file
     */
    private isUrl;
}
