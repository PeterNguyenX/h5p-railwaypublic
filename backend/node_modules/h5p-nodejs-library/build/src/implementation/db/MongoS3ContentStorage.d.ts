/// <reference types="node" />
import MongoDB from 'mongodb';
import { Stream, Readable } from 'stream';
import AWS from 'aws-sdk';
import { ContentId, IContentMetadata, IContentStorage, IFileStats, IUser, Permission, ILibraryName } from '../../types';
/**
 * This storage implementation stores content data in a MongoDB collection
 * and a S3 bucket.
 * The parameters and metadata of a H5P content object are stored in MongoDB,
 * while all files are put into S3 storage.
 */
export default class MongoS3ContentStorage implements IContentStorage {
    private s3;
    private mongodb;
    private options;
    /**
     * @param s3 the S3 content storage; Must be either set to a bucket or the
     * bucket must be specified in the options!
     * @param mongodb a MongoDB collection (read- and writable)
     * @param options options
     */
    constructor(s3: AWS.S3, mongodb: MongoDB.Collection, options: {
        /**
         * If set, the function is called to retrieve a list of permissions
         * a user has on a certain content object.
         * This function can function as an adapter to your rights and
         * privileges system.
         */
        getPermissions?: (contentId: ContentId, user: IUser) => Promise<Permission[]>;
        /**
         * These characters will be removed from files that are saved to S3.
         * There is a very strict default list that basically only leaves
         * alphanumeric filenames intact. Should you need more relaxed
         * settings you can specify them here.
         */
        invalidCharactersRegexp?: RegExp;
        /**
         * Indicates how long keys in S3 can be. Defaults to 1024. (S3
         * supports 1024 characters, other systems such as Minio might only
         * support 255 on Windows).
         */
        maxKeyLength?: number;
        /**
         * The ACL to use for uploaded content files. Defaults to private.
         */
        s3Acl?: string;
        /**
         * The bucket to upload to and download from. (required)
         */
        s3Bucket: string;
    });
    /**
     * Indicates how long keys can be.
     */
    private maxKeyLength;
    /**
     * Generates the S3 key for a file in a content object
     * @param contentId
     * @param filename
     * @returns the S3 key
     */
    private static getS3Key;
    /**
     * Creates or updates a content object in the repository. Throws an error if
     * something went wrong.
     * @param metadata The metadata of the content (= h5p.json)
     * @param content the content object (= content/content.json)
     * @param user The user who owns this object.
     * @param contentId (optional) The content id to use
     * @returns The newly assigned content id
     */
    addContent(metadata: IContentMetadata, content: any, user: IUser, contentId?: ContentId): Promise<ContentId>;
    /**
     * Adds a content file to an existing content object. Throws an error if
     * something went wrong.
     * @param contentId The id of the content to add the file to
     * @param filename The filename
     * @param stream A readable stream that contains the data
     * @param user The user who owns this object
     * @returns
     */
    addFile(contentId: ContentId, filename: string, stream: Stream, user: IUser): Promise<void>;
    /**
     * Checks if a piece of content exists in storage.
     * @param contentId the content id to check
     * @returns true if the piece of content exists
     */
    contentExists(contentId: ContentId): Promise<boolean>;
    /**
     * Deletes a content object and all its dependent files from the repository.
     * Throws errors if something goes wrong.
     * @param contentId The content id to delete.
     * @param user The user who wants to delete the content
     * @returns
     */
    deleteContent(contentId: ContentId, user?: IUser): Promise<void>;
    /**
     * Deletes a file from a content object.
     * @param contentId the content object the file is attached to
     * @param filename the file to delete
     */
    deleteFile(contentId: ContentId, filename: string, user?: IUser): Promise<void>;
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
    getFileStats(contentId: string, filename: string, user: IUser): Promise<IFileStats>;
    /**
     * Returns a readable stream of a content file (e.g. image or video) inside a piece of content
     * Note: Make sure to handle the 'error' event of the Readable! This method
     * does not check if the file exists in storage to avoid the extra request.
     * However, this means that there will be an error when piping the Readable
     * to the response if the file doesn't exist!
     * @param contentId the id of the content object that the file is attached to
     * @param filename the filename of the file to get
     * @param user the user who wants to retrieve the content file
     * @returns
     */
    getFileStream(contentId: ContentId, filename: string, user: IUser, rangeStart?: number, rangeEnd?: number): Promise<Readable>;
    getMetadata(contentId: string, user?: IUser): Promise<IContentMetadata>;
    getParameters(contentId: string, user?: IUser): Promise<any>;
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
     * Returns an array of permissions that the user has on the piece of content
     * @param contentId the content id to check
     * @param user the user who wants to access the piece of content
     * @returns the permissions the user has for this content (e.g. download it, delete it etc.)
     */
    getUserPermissions(contentId: ContentId, user: IUser): Promise<Permission[]>;
    listContent(user?: IUser): Promise<ContentId[]>;
    /**
     * Gets the filenames of files added to the content with addContentFile(...) (e.g. images, videos or other files)
     * @param contentId the piece of content
     * @param user the user who wants to access the piece of content
     * @returns a list of files that are used in the piece of content, e.g. ['image1.png', 'video2.mp4']
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
    sanitizeFilename(filename: string): string;
}
