import { Stream, Readable } from 'stream';
import { ContentId, ContentParameters, IContentMetadata, IContentStorage, IContentUserDataStorage, IFileStats, IPermissionSystem, IUser } from './types';
/**
 * The ContentManager takes care of saving content and dependent files. It only contains storage-agnostic functionality and
 * depends on a ContentStorage object to do the actual persistence.
 */
export default class ContentManager {
    contentStorage: IContentStorage;
    private permissionSystem;
    contentUserDataStorage?: IContentUserDataStorage;
    /**
     * @param contentStorage The storage object
     * @param contentUserDataStorage The contentUserDataStorage to delete contentUserData for content when it is deleted
     */
    constructor(contentStorage: IContentStorage, permissionSystem: IPermissionSystem, contentUserDataStorage?: IContentUserDataStorage);
    private contentUserDataManager;
    /**
     * Adds a content file to an existing content object. The content object has to be created with createContent(...) first.
     * @param contentId The id of the content to add the file to
     * @param filename The name of the content file
     * @param stream A readable stream that contains the data
     * @param user The user who owns this object
     * @returns
     */
    addContentFile(contentId: ContentId, filename: string, stream: Stream, user: IUser): Promise<void>;
    /**
     * Checks if a piece of content exists.
     * @param contentId the content to check
     * @returns true if the piece of content exists
     */
    contentExists(contentId: ContentId): Promise<boolean>;
    /**
     * Checks if a file exists.
     * @param contentId The id of the content to add the file to
     * @param filename the filename of the file to get
     * @returns true if the file exists
     */
    contentFileExists: (contentId: ContentId, filename: string) => Promise<boolean>;
    /**
     * Creates a content object in the repository. Add files to it later with addContentFile(...).
     * @param metadata The metadata of the content (= h5p.json)
     * @param content the content object (= content/content.json)
     * @param user The user who owns this object.
     * @param contentId (optional) The content id to use
     * @returns The newly assigned content id
     */
    createOrUpdateContent(metadata: IContentMetadata, content: ContentParameters, user: IUser, contentId?: ContentId): Promise<ContentId>;
    /**
     * Deletes a piece of content, the corresponding contentUserData and all files dependent on it.
     * @param contentId the piece of content to delete
     * @param user the user who wants to delete it
     */
    deleteContent(contentId: ContentId, user: IUser): Promise<void>;
    /**
     * Deletes a file from a content object.
     * @param contentId the content object the file is attached to
     * @param filename the file to delete
     */
    deleteContentFile(contentId: ContentId, filename: string, user?: IUser): Promise<void>;
    /**
     * Returns a readable stream of a content file (e.g. image or video) inside a piece of content
     * @param contentId the id of the content object that the file is attached to
     * @param filename the filename of the file to get
     * @param user the user who wants to retrieve the content file
     * @param rangeStart (optional) the position in bytes at which the stream should start
     * @param rangeEnd (optional) the position in bytes at which the stream should end
     * @returns
     */
    getContentFileStream(contentId: ContentId, filename: string, user: IUser, rangeStart?: number, rangeEnd?: number): Promise<Readable>;
    /**
     * Returns the metadata (=contents of h5p.json) of a piece of content.
     * @param contentId the content id
     * @param user The user who wants to access the content
     * @returns
     */
    getContentMetadata(contentId: ContentId, user: IUser): Promise<IContentMetadata>;
    getContentFileStats(contentId: string, filename: string, user: IUser): Promise<IFileStats>;
    /**
     * Returns the content object (=contents of content/content.json) of a piece of content.
     * @param contentId the content id
     * @param user The user who wants to access the content
     * @returns
     */
    getContentParameters(contentId: ContentId, user: IUser): Promise<ContentParameters>;
    /**
     * Lists the content objects in the system (if no user is specified) or owned by the user.
     * @param user (optional) the user who owns the content
     * @returns a list of contentIds
     */
    listContent(user?: IUser): Promise<ContentId[]>;
    /**
     * Gets the filenames of files added to the content with addContentFile(...) (e.g. images, videos or other files)
     * @param contentId the piece of content
     * @param user the user who wants to access the piece of content
     * @returns a list of files that are used in the piece of content, e.g. ['image1.png', 'video2.mp4']
     */
    listContentFiles(contentId: ContentId, user: IUser): Promise<string[]>;
    sanitizeFilename: (filename: string) => string;
}
