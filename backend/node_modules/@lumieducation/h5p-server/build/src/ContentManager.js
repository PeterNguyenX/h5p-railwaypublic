"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ContentMetadata_1 = require("./ContentMetadata");
const types_1 = require("./types");
const Logger_1 = __importDefault(require("./helpers/Logger"));
const H5pError_1 = __importDefault(require("./helpers/H5pError"));
const ContentUserDataManager_1 = __importDefault(require("./ContentUserDataManager"));
const log = new Logger_1.default('ContentManager');
/**
 * The ContentManager takes care of saving content and dependent files. It only contains storage-agnostic functionality and
 * depends on a ContentStorage object to do the actual persistence.
 */
class ContentManager {
    contentStorage;
    permissionSystem;
    contentUserDataStorage;
    /**
     * @param contentStorage The storage object
     * @param contentUserDataStorage The contentUserDataStorage to delete contentUserData for content when it is deleted
     */
    constructor(contentStorage, permissionSystem, contentUserDataStorage) {
        this.contentStorage = contentStorage;
        this.permissionSystem = permissionSystem;
        this.contentUserDataStorage = contentUserDataStorage;
        log.info('initialize');
        if (contentUserDataStorage) {
            this.contentUserDataManager = new ContentUserDataManager_1.default(contentUserDataStorage, permissionSystem);
        }
    }
    contentUserDataManager;
    /**
     * Adds a content file to an existing content object. The content object has to be created with createContent(...) first.
     * @param contentId The id of the content to add the file to
     * @param filename The name of the content file
     * @param stream A readable stream that contains the data
     * @param user The user who owns this object
     * @returns
     */
    async addContentFile(contentId, filename, stream, user) {
        log.info(`adding file ${filename} to content ${contentId}`);
        if (!(await this.permissionSystem.checkForContent(user, types_1.ContentPermission.Edit, contentId))) {
            log.error(`User tried to upload a file without proper permissions.`);
            throw new H5pError_1.default('h5p-server:content-missing-edit-permission', {}, 403);
        }
        return this.contentStorage.addFile(contentId, filename, stream, user);
    }
    /**
     * Checks if a piece of content exists.
     * @param contentId the content to check
     * @returns true if the piece of content exists
     */
    async contentExists(contentId) {
        log.debug(`checking if content ${contentId} exists`);
        return this.contentStorage.contentExists(contentId);
    }
    /**
     * Checks if a file exists.
     * @param contentId The id of the content to add the file to
     * @param filename the filename of the file to get
     * @returns true if the file exists
     */
    contentFileExists = async (contentId, filename) => this.contentStorage.fileExists(contentId, filename);
    /**
     * Creates a content object in the repository. Add files to it later with addContentFile(...).
     * @param metadata The metadata of the content (= h5p.json)
     * @param content the content object (= content/content.json)
     * @param user The user who owns this object.
     * @param contentId (optional) The content id to use
     * @returns The newly assigned content id
     */
    async createOrUpdateContent(metadata, content, user, contentId) {
        log.info(`creating content for ${contentId}`);
        if (contentId) {
            if (!(await this.permissionSystem.checkForContent(user, types_1.ContentPermission.Edit, contentId))) {
                log.error(`User tried edit content without proper permissions.`);
                throw new H5pError_1.default('h5p-server:content-missing-edit-permission', {}, 403);
            }
        }
        else {
            if (!(await this.permissionSystem.checkForContent(user, types_1.ContentPermission.Create, undefined))) {
                log.error(`User tried create content without proper permissions.`);
                throw new H5pError_1.default('h5p-server:content-missing-create-permission', {}, 403);
            }
        }
        return this.contentStorage.addContent(metadata, content, user, contentId);
    }
    /**
     * Deletes a piece of content, the corresponding contentUserData and all files dependent on it.
     * @param contentId the piece of content to delete
     * @param user the user who wants to delete it
     */
    async deleteContent(contentId, user) {
        if (!(await this.permissionSystem.checkForContent(user, types_1.ContentPermission.Delete, contentId))) {
            log.error(`User tried to delete a content object without proper permissions.`);
            throw new H5pError_1.default('h5p-server:content-missing-delete-permission', {}, 403);
        }
        await this.contentStorage.deleteContent(contentId, user);
        if (this.contentUserDataManager) {
            try {
                await this.contentUserDataManager.deleteAllContentUserDataByContentId(contentId, user);
            }
            catch (error) {
                log.error(`Could not delete content user data with contentId ${contentId}`);
                log.error(error);
            }
            try {
                await this.contentUserDataManager.deleteFinishedDataByContentId(contentId, user);
            }
            catch (error) {
                log.error(`Could not finished data with contentId ${contentId}`);
                log.error(error);
            }
        }
    }
    /**
     * Deletes a file from a content object.
     * @param contentId the content object the file is attached to
     * @param filename the file to delete
     */
    async deleteContentFile(contentId, filename, user) {
        if (!(await this.permissionSystem.checkForContent(user, types_1.ContentPermission.Edit, contentId))) {
            log.error(`User tried to delete a file from a content object without proper permissions.`);
            throw new H5pError_1.default('h5p-server:content-missing-edit-permission', {}, 403);
        }
        return this.contentStorage.deleteFile(contentId, filename);
    }
    /**
     * Returns a readable stream of a content file (e.g. image or video) inside a piece of content
     * @param contentId the id of the content object that the file is attached to
     * @param filename the filename of the file to get
     * @param user the user who wants to retrieve the content file
     * @param rangeStart (optional) the position in bytes at which the stream should start
     * @param rangeEnd (optional) the position in bytes at which the stream should end
     * @returns
     */
    async getContentFileStream(contentId, filename, user, rangeStart, rangeEnd) {
        log.debug(`loading ${filename} for ${contentId}`);
        if (!(await this.permissionSystem.checkForContent(user, types_1.ContentPermission.View, contentId))) {
            log.error(`User tried to display a file from a content object without proper permissions.`);
            throw new H5pError_1.default('h5p-server:content-missing-view-permission', {}, 403);
        }
        return this.contentStorage.getFileStream(contentId, filename, user, rangeStart, rangeEnd);
    }
    /**
     * Returns the metadata (=contents of h5p.json) of a piece of content.
     * @param contentId the content id
     * @param user The user who wants to access the content
     * @returns
     */
    async getContentMetadata(contentId, user) {
        if (!(await this.permissionSystem.checkForContent(user, types_1.ContentPermission.View, contentId))) {
            log.error(`User tried to get metadata of a content object without proper permissions.`);
            throw new H5pError_1.default('h5p-server:content-missing-view-permission', {}, 403);
        }
        // We don't directly return the h5p.json file content as
        // we have to make sure it conforms to the schema.
        return new ContentMetadata_1.ContentMetadata(await this.contentStorage.getMetadata(contentId, user));
    }
    async getContentFileStats(contentId, filename, user) {
        if (!(await this.permissionSystem.checkForContent(user, types_1.ContentPermission.View, contentId))) {
            log.error(`User tried to get stats of file from a content object without view permissions.`);
            throw new H5pError_1.default('h5p-server:content-missing-view-permission', {}, 403);
        }
        return this.contentStorage.getFileStats(contentId, filename, user);
    }
    /**
     * Returns the content object (=contents of content/content.json) of a piece of content.
     * @param contentId the content id
     * @param user The user who wants to access the content
     * @returns
     */
    async getContentParameters(contentId, user) {
        if (!(await this.permissionSystem.checkForContent(user, types_1.ContentPermission.View, contentId))) {
            log.error(`User tried to get parameters of a content object without view permissions.`);
            throw new H5pError_1.default('h5p-server:content-missing-view-permission', {}, 403);
        }
        return this.contentStorage.getParameters(contentId, user);
    }
    /**
     * Lists the content objects in the system (if no user is specified) or owned by the user.
     * @param user (optional) the user who owns the content
     * @returns a list of contentIds
     */
    async listContent(user) {
        if (!(await this.permissionSystem.checkForContent(user, types_1.ContentPermission.List, undefined))) {
            log.error(`User tried to list all content objects without proper permissions.`);
            throw new H5pError_1.default('h5p-server:content-missing-list-permission', {}, 403);
        }
        return this.contentStorage.listContent(user);
    }
    /**
     * Gets the filenames of files added to the content with addContentFile(...) (e.g. images, videos or other files)
     * @param contentId the piece of content
     * @param user the user who wants to access the piece of content
     * @returns a list of files that are used in the piece of content, e.g. ['image1.png', 'video2.mp4']
     */
    async listContentFiles(contentId, user) {
        log.info(`loading content files for ${contentId}`);
        if (!(await this.permissionSystem.checkForContent(user, types_1.ContentPermission.View, contentId))) {
            log.error(`User tried to get the list of files from a content object without view permissions.`);
            throw new H5pError_1.default('h5p-server:content-missing-view-permission', {}, 403);
        }
        return this.contentStorage.listFiles(contentId, user);
    }
    sanitizeFilename = (filename) => {
        if (this.contentStorage.sanitizeFilename) {
            return this.contentStorage.sanitizeFilename(filename);
        }
        return filename;
    };
}
exports.default = ContentManager;
//# sourceMappingURL=ContentManager.js.map