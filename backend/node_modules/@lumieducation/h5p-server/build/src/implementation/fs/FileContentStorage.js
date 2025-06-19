"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const get_all_files_1 = require("get-all-files");
const path_1 = __importDefault(require("path"));
const promisepipe_1 = __importDefault(require("promisepipe"));
const promises_1 = require("fs/promises");
const StreamHelpers_1 = require("../../helpers/StreamHelpers");
const filenameUtils_1 = require("./filenameUtils");
const DependencyChecker_1 = require("../../helpers/DependencyChecker");
const H5pError_1 = __importDefault(require("../../helpers/H5pError"));
/**
 * Persists content to the disk.
 */
class FileContentStorage {
    contentPath;
    options;
    /**
     * Generates a unique content id that hasn't been used in the system so far.
     * @returns A unique content id
     */
    async createContentId() {
        let counter = 0;
        let id;
        let exists = false;
        do {
            id = FileContentStorage.getRandomInt(1, 2 ** 32);
            counter += 1;
            const p = path_1.default.join(this.getContentPath(), id.toString());
            try {
                await (0, promises_1.access)(p);
                exists = true;
            }
            catch {
                exists = false;
            }
        } while (exists && counter < 5); // try 5x and give up then
        if (exists) {
            throw new H5pError_1.default('storage-file-implementations:error-generating-content-id');
        }
        return id;
    }
    /**
     * Gets the base path of the content
     * @returns the base content-path
     */
    getContentPath() {
        return this.contentPath;
    }
    /**
     * @param contentPath The absolute path to the directory where the content
     * should be stored
     */
    constructor(contentPath, options) {
        this.contentPath = contentPath;
        this.options = options;
        (0, fs_1.mkdirSync)(contentPath, { recursive: true });
        this.maxFileLength =
            (options?.maxPathLength ?? 255) - (contentPath.length + 1) - 23;
        // we subtract 23 for the contentId (12), unique ids appended to
        // the file (8) and path separators (3)
        if (this.maxFileLength < 20) {
            throw new Error('The path of content directory is too long to add files to it. Put the directory into a different location.');
        }
    }
    /**
     * Indicates how long files can be.
     */
    maxFileLength;
    /**
     * Returns a random integer
     * @param min The minimum
     * @param max The maximum
     * @returns a random integer
     */
    static getRandomInt(min, max) {
        const finalMin = Math.ceil(min);
        const finalMax = Math.floor(max);
        return Math.floor(Math.random() * (finalMax - finalMin + 1)) + finalMin;
    }
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
    async addContent(metadata, content, user, id) {
        if (id === undefined || id === null) {
            // eslint-disable-next-line no-param-reassign
            id = await this.createContentId();
        }
        try {
            await (0, promises_1.mkdir)(path_1.default.join(this.getContentPath(), id.toString()), {
                recursive: true
            });
            await (0, promises_1.writeFile)(path_1.default.join(this.getContentPath(), id.toString(), 'h5p.json'), JSON.stringify(metadata));
            await (0, promises_1.writeFile)(path_1.default.join(this.getContentPath(), id.toString(), 'content.json'), JSON.stringify(content));
        }
        catch (error) {
            await (0, promises_1.rm)(path_1.default.join(this.getContentPath(), id.toString()), {
                recursive: true,
                force: true
            });
            throw new H5pError_1.default('storage-file-implementations:error-creating-content', {}, 500, error.message);
        }
        return id;
    }
    /**
     * Adds a content file to an existing content object. The content object has
     * to be created with createContent(...) first.
     * @param id The id of the content to add the file to
     * @param filename The filename
     * @param stream A readable stream that contains the data
     * @param user The user who owns this object
     * @returns
     */
    async addFile(id, filename, stream, user) {
        (0, filenameUtils_1.checkFilename)(filename);
        try {
            await (0, promises_1.access)(path_1.default.join(this.getContentPath(), id.toString()));
        }
        catch {
            throw new H5pError_1.default('storage-file-implementations:add-file-content-not-found', { filename, id }, 404);
        }
        const fullPath = path_1.default.join(this.getContentPath(), id.toString(), filename);
        await (0, promises_1.mkdir)(path_1.default.dirname(fullPath), { recursive: true });
        const writeStream = (0, fs_1.createWriteStream)(fullPath);
        await (0, promisepipe_1.default)(stream, writeStream);
    }
    /**
     * Checks if a piece of content exists in storage.
     * @param contentId the content id to check
     * @returns true if the piece of content exists
     */
    async contentExists(contentId) {
        try {
            await (0, promises_1.access)(path_1.default.join(this.getContentPath(), contentId.toString()));
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Deletes a content object and all its dependent files from the repository.
     * Throws errors if something goes wrong.
     * @param id The content id to delete.
     * @param user The user who wants to delete the content
     * @returns
     */
    async deleteContent(id, user) {
        try {
            await (0, promises_1.access)(path_1.default.join(this.getContentPath(), id.toString()));
        }
        catch {
            throw new H5pError_1.default('storage-file-implementations:delete-content-not-found', {}, 404);
        }
        await (0, promises_1.rm)(path_1.default.join(this.getContentPath(), id.toString()), {
            recursive: true,
            force: true
        });
    }
    /**
     * Deletes a file from a content object.
     * @param contentId the content object the file is attached to
     * @param filename the file to delete
     */
    async deleteFile(contentId, filename) {
        (0, filenameUtils_1.checkFilename)(filename);
        const absolutePath = path_1.default.join(this.getContentPath(), contentId.toString(), filename);
        try {
            await (0, promises_1.access)(absolutePath);
        }
        catch {
            throw new H5pError_1.default('storage-file-implementations:delete-content-file-not-found', { filename }, 404);
        }
        await (0, promises_1.rm)(absolutePath);
    }
    /**
     * Checks if a file exists.
     * @param contentId The id of the content to add the file to
     * @param filename the filename of the file to get
     * @returns true if the file exists
     */
    async fileExists(contentId, filename) {
        (0, filenameUtils_1.checkFilename)(filename);
        if (contentId !== undefined) {
            try {
                await (0, promises_1.access)(path_1.default.join(this.getContentPath(), contentId.toString(), filename));
                return true;
            }
            catch {
                return false;
            }
        }
        return false;
    }
    /**
     * Returns information about a content file (e.g. image or video) inside a
     * piece of content.
     * @param id the id of the content object that the file is attached to
     * @param filename the filename of the file to get information about
     * @param user the user who wants to retrieve the content file
     * @returns
     */
    async getFileStats(id, filename, user) {
        if (!(await this.fileExists(id, filename))) {
            throw new H5pError_1.default('content-file-missing', { filename, contentId: id }, 404);
        }
        return (0, promises_1.stat)(path_1.default.join(this.getContentPath(), id.toString(), filename));
    }
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
    async getFileStream(id, filename, user, rangeStart, rangeEnd) {
        if (!(await this.fileExists(id, filename))) {
            throw new H5pError_1.default('content-file-missing', { filename, contentId: id }, 404);
        }
        return (0, fs_1.createReadStream)(path_1.default.join(this.getContentPath(), id.toString(), filename), {
            start: rangeStart,
            end: rangeEnd
        });
    }
    /**
     * Returns the content metadata (=h5p.json) for a content id
     * @param contentId the content id for which to retrieve the metadata
     * @param user (optional) the user who wants to access the metadata. If
     * undefined, access must be granted.
     * @returns the metadata
     */
    async getMetadata(contentId, user) {
        return JSON.parse(await (0, StreamHelpers_1.streamToString)(await this.getFileStream(contentId, 'h5p.json', user)));
    }
    /**
     * Returns the parameters (=content.json) for a content id
     * @param contentId the content id for which to retrieve the metadata
     * @param user (optional) the user who wants to access the metadata. If
     * undefined, access must be granted.
     * @returns the parameters
     */
    async getParameters(contentId, user) {
        return JSON.parse(await (0, StreamHelpers_1.streamToString)(await this.getFileStream(contentId, 'content.json', user)));
    }
    /**
     * Calculates how often a library is in use.
     * @param library the library for which to calculate usage.
     * @returns asDependency: how often the library is used as subcontent in
     * content; asMainLibrary: how often the library is used as a main library
     */
    async getUsage(library) {
        let asDependency = 0;
        let asMainLibrary = 0;
        const contentIds = await this.listContent();
        // We don't use Promise.all here as this would possibly overwhelm the
        // available memory space.
        for (const contentId of contentIds) {
            const contentMetadata = await this.getMetadata(contentId);
            const isMainLibrary = contentMetadata.mainLibrary === library.machineName;
            if ((0, DependencyChecker_1.hasDependencyOn)(contentMetadata, library)) {
                if (isMainLibrary) {
                    asMainLibrary += 1;
                }
                else {
                    asDependency += 1;
                }
            }
        }
        return { asDependency, asMainLibrary };
    }
    /**
     * Lists the content objects in the system (if no user is specified) or
     * owned by the user.
     * @param user (optional) the user who owns the content
     * @returns a list of contentIds
     */
    async listContent(user) {
        const directories = await (0, promises_1.readdir)(this.getContentPath());
        return (await Promise.all(directories.map(async (dir) => {
            try {
                await (0, promises_1.access)(path_1.default.join(this.getContentPath(), dir, 'h5p.json'));
                return dir;
            }
            catch {
                return '';
            }
        }))).filter((content) => content !== '');
    }
    /**
     * Gets the filenames of files added to the content with addContentFile(...)
     * (e.g. images, videos or other files)
     * @param contentId the piece of content
     * @param user the user who wants to access the piece of content
     * @returns a list of files that are used in the piece of content, e.g.
     * ['image1.png', 'video2.mp4']
     */
    async listFiles(contentId, user) {
        const contentDirectoryPath = path_1.default.join(this.getContentPath(), contentId.toString());
        const contentDirectoryPathLength = contentDirectoryPath.length + 1;
        const absolutePaths = await (0, get_all_files_1.getAllFiles)(path_1.default.join(contentDirectoryPath)).toArray();
        const contentPath = path_1.default.join(contentDirectoryPath, 'content.json');
        const h5pPath = path_1.default.join(contentDirectoryPath, 'h5p.json');
        return absolutePaths
            .filter((p) => p !== contentPath && p !== h5pPath)
            .map((p) => p.substr(contentDirectoryPathLength));
    }
    /**
     * Removes invalid characters from filenames and enforces other filename
     * rules required by the storage implementation (e.g. filename length
     * restrictions).
     * @param filename the filename to sanitize; this can be a relative path
     * (e.g. "images/image1.png")
     * @returns the clean filename
     */
    sanitizeFilename = (filename) => {
        return (0, filenameUtils_1.sanitizeFilename)(filename, this.maxFileLength, this.options?.invalidCharactersRegexp);
    };
}
exports.default = FileContentStorage;
//# sourceMappingURL=FileContentStorage.js.map