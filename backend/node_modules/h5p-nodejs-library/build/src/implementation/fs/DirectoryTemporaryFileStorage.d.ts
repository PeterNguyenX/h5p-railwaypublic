/// <reference types="node" />
import { ReadStream } from 'fs';
import { ITemporaryFile, ITemporaryFileStorage, IUser, IFileStats } from '../../../src';
/**
 * Stores temporary files in directories on the disk.
 * Manages access rights by creating one sub-directory for each user.
 * Manages expiration times by creating companion '.metadata' files for every
 * file stored.
 */
export default class DirectoryTemporaryFileStorage implements ITemporaryFileStorage {
    private directory;
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
     * @param directory the directory in which the temporary files are stored.
     * Must be read- and write accessible
     */
    constructor(directory: string, options?: {
        /**
         * These characters will be removed from files that are saved to S3.
         * There is a very strict default list that basically only leaves
         * alphanumeric filenames intact. Should you need more relaxed
         * settings you can specify them here.
         */
        invalidCharactersRegexp?: RegExp;
        maxPathLength?: number;
    });
    private maxFileLength;
    deleteFile(filename: string, userId: string): Promise<void>;
    fileExists(filename: string, user: IUser): Promise<boolean>;
    getFileStats(filename: string, user: IUser): Promise<IFileStats>;
    getFileStream(filename: string, user: IUser, rangeStart?: number, rangeEnd?: number): Promise<ReadStream>;
    listFiles(user?: IUser): Promise<ITemporaryFile[]>;
    /**
     * Removes invalid characters from filenames and enforces other filename
     * rules required by the storage implementation (e.g. filename length
     * restrictions).
     * @param filename the filename to sanitize; this can be a relative path
     * (e.g. "images/image1.png")
     * @returns the clean filename
     */
    sanitizeFilename(filename: string): string;
    saveFile(filename: string, dataStream: ReadStream, user: IUser, expirationTime: Date): Promise<ITemporaryFile>;
    private deleteEmptyDirectory;
    private getAbsoluteFilePath;
    private getAbsoluteUserDirectoryPath;
    private getTemporaryFileInfo;
}
