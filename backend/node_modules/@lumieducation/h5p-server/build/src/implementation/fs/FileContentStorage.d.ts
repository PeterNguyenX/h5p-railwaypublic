import { ReadStream } from 'fs';
import { Stream } from 'stream';
import { ContentId, IContentMetadata, IContentStorage, IUser, ContentParameters, IFileStats, ILibraryName } from '../../types';
/**
 * Persists content to the disk.
 */
export default class FileContentStorage implements IContentStorage {
    protected contentPath: string;
    protected options?: {
        /**
         * These characters will be removed from files that are saved to S3.
         * There is a very strict default list that basically only leaves
         * alphanumeric filenames intact. Should you need more relaxed
         * settings you can specify them here.
         */
        invalidCharactersRegexp?: RegExp;
        maxPathLength?: number;
    };
    /**
     * Generates a unique content id that hasn't been used in the system so far.
     * @returns A unique content id
     */
    protected createContentId(): Promise<ContentId>;
    /**
     * Gets the base path of the content
     * @returns the base content-path
     */
    protected getContentPath(): string;
    /**
     * @param contentPath The absolute path to the directory where the content
     * should be stored
     */
    constructor(contentPath: string, options?: {
        /**
         * These characters will be removed from files that are saved to S3.
         * There is a very strict default list that basically only leaves
         * alphanumeric filenames intact. Should you need more relaxed
         * settings you can specify them here.
         */
        invalidCharactersRegexp?: RegExp;
        maxPathLength?: number;
    });
    /**
     * Indicates how long files can be.
     */
    private maxFileLength;
    /**
     * Returns a random integer
     * @param min The minimum
     * @param max The maximum
     * @returns a random integer
     */
    private static getRandomInt;
    /**
     * Creates a content object in the repository. Add files to it later with
     * addContentFile(...). Throws an error if something went wrong. In this
     * case no traces of the content are left in storage and all changes are
     * reverted.
     * @param metadata The metadata of the content (= h5p.json)
     * @param content the content object (= content/content.json)
     * @param user The user who owns this object.
     * @param id (optional) The content id to use
     * @returns The newly assigned content id
     */
    addContent(metadata: IContentMetadata, content: any, user: IUser, id?: ContentId): Promise<ContentId>;
    /**
     * Adds a content file to an existing content object. The content object has
     * to be created with createContent(...) first.
     * @param id The id of the content to add the file to
     * @param filename The filename
     * @param stream A readable stream that contains the data
     * @param user The user who owns this object
     * @returns
     */
    addFile(id: ContentId, filename: string, stream: Stream, user: IUser): Promise<void>;
    /**
     * Checks if a piece of content exists in storage.
     * @param contentId the content id to check
     * @returns true if the piece of content exists
     */
    contentExists(contentId: ContentId): Promise<boolean>;
    /**
     * Deletes a content object and all its dependent files from the repository.
     * Throws errors if something goes wrong.
     * @param id The content id to delete.
     * @param user The user who wants to delete the content
     * @returns
     */
    deleteContent(id: ContentId, user?: IUser): Promise<void>;
    /**
     * Deletes a file from a content object.
     * @param contentId the content object the file is attached to
     * @param filename the file to delete
     */
    deleteFile(contentId: ContentId, filename: string): Promise<void>;
    /**
     * Checks if a file exists.
     * @param contentId The id of the content to add the file to
     * @param filename the filename of the file to get
     * @returns true if the file exists
     */
    fileExists(contentId: ContentId, filename: string): Promise<boolean>;
    /**
     * Returns information about a content file (e.g. image or video) inside a
     * piece of content.
     * @param id the id of the content object that the file is attached to
     * @param filename the filename of the file to get information about
     * @param user the user who wants to retrieve the content file
     * @returns
     */
    getFileStats(id: ContentId, filename: string, user: IUser): Promise<IFileStats>;
    /**
     * Returns a readable stream of a content file (e.g. image or video) inside
     * a piece of content
     * @param id the id of the content object that the file is attached to
     * @param filename the filename of the file to get
     * @param user the user who wants to retrieve the content file
     * @param rangeStart (optional) the position in bytes at which the stream
     * should start
     * @param rangeEnd (optional) the position in bytes at which the stream
     * should end
     * @returns
     */
    getFileStream(id: ContentId, filename: string, user: IUser, rangeStart?: number, rangeEnd?: number): Promise<ReadStream>;
    /**
     * Returns the content metadata (=h5p.json) for a content id
     * @param contentId the content id for which to retrieve the metadata
     * @param user (optional) the user who wants to access the metadata. If
     * undefined, access must be granted.
     * @returns the metadata
     */
    getMetadata(contentId: string, user?: IUser): Promise<IContentMetadata>;
    /**
     * Returns the parameters (=content.json) for a content id
     * @param contentId the content id for which to retrieve the metadata
     * @param user (optional) the user who wants to access the metadata. If
     * undefined, access must be granted.
     * @returns the parameters
     */
    getParameters(contentId: string, user?: IUser): Promise<ContentParameters>;
    /**
     * Calculates how often a library is in use.
     * @param library the library for which to calculate usage.
     * @returns asDependency: how often the library is used as subcontent in
     * content; asMainLibrary: how often the library is used as a main library
     */
    getUsage(library: ILibraryName): Promise<{
        asDependency: number;
        asMainLibrary: number;
    }>;
    /**
     * Lists the content objects in the system (if no user is specified) or
     * owned by the user.
     * @param user (optional) the user who owns the content
     * @returns a list of contentIds
     */
    listContent(user?: IUser): Promise<ContentId[]>;
    /**
     * Gets the filenames of files added to the content with addContentFile(...)
     * (e.g. images, videos or other files)
     * @param contentId the piece of content
     * @param user the user who wants to access the piece of content
     * @returns a list of files that are used in the piece of content, e.g.
     * ['image1.png', 'video2.mp4']
     */
    listFiles(contentId: ContentId, user: IUser): Promise<string[]>;
    /**
     * Removes invalid characters from filenames and enforces other filename
     * rules required by the storage implementation (e.g. filename length
     * restrictions).
     * @param filename the filename to sanitize; this can be a relative path
     * (e.g. "images/image1.png")
     * @returns the clean filename
     */
    sanitizeFilename: (filename: string) => string;
}
