"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const get_all_files_1 = require("get-all-files");
const path_1 = __importDefault(require("path"));
const promisepipe_1 = __importDefault(require("promisepipe"));
const H5pError_1 = __importDefault(require("../../helpers/H5pError"));
const filenameUtils_1 = require("./filenameUtils");
/**
 * Stores temporary files in directories on the disk.
 * Manages access rights by creating one sub-directory for each user.
 * Manages expiration times by creating companion '.metadata' files for every
 * file stored.
 */
class DirectoryTemporaryFileStorage {
    directory;
    options;
    /**
     * @param directory the directory in which the temporary files are stored.
     * Must be read- and write accessible
     */
    constructor(directory, options) {
        this.directory = directory;
        this.options = options;
        (0, promises_1.mkdir)(directory, { recursive: true });
        this.maxFileLength =
            (options?.maxPathLength ?? 255) - (directory.length + 1) - 40;
        // we subtract 40 for the contentId (12), the unique id attached to the
        // file (8), the .metadata suffix (9), userIds (8) and separators (3).
        if (this.maxFileLength < 20) {
            throw new Error('The path of the temporary files directory is too long to add files to it. Put the directory into a different location.');
        }
    }
    maxFileLength;
    async deleteFile(filename, ownerId) {
        (0, filenameUtils_1.checkFilename)(filename);
        if (!ownerId) {
            throw new Error('Invalid arguments for DirectoryTemporaryFileStorage.deleteFile: you must specify an ownerId');
        }
        (0, filenameUtils_1.checkFilename)(ownerId);
        const filePath = this.getAbsoluteFilePath(ownerId, filename);
        await (0, promises_1.rm)(filePath);
        await (0, promises_1.rm)(`${filePath}.metadata`);
        const userDirectoryPath = this.getAbsoluteUserDirectoryPath(ownerId);
        const fileDirectoryPath = path_1.default.dirname(filePath);
        if (userDirectoryPath !== fileDirectoryPath) {
            await this.deleteEmptyDirectory(fileDirectoryPath);
        }
        await this.deleteEmptyDirectory(userDirectoryPath);
    }
    async fileExists(filename, user) {
        (0, filenameUtils_1.checkFilename)(filename);
        (0, filenameUtils_1.checkFilename)(user.id);
        const filePath = this.getAbsoluteFilePath(user.id, filename);
        try {
            await (0, promises_1.access)(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async getFileStats(filename, user) {
        if (!(await this.fileExists(filename, user))) {
            throw new H5pError_1.default('storage-file-implementations:temporary-file-not-found', {
                filename,
                userId: user.id
            }, 404);
        }
        const filePath = this.getAbsoluteFilePath(user.id, filename);
        return (0, promises_1.stat)(filePath);
    }
    async getFileStream(filename, user, rangeStart, rangeEnd) {
        (0, filenameUtils_1.checkFilename)(filename);
        (0, filenameUtils_1.checkFilename)(user.id);
        const filePath = this.getAbsoluteFilePath(user.id, filename);
        try {
            await (0, promises_1.access)(filePath);
        }
        catch {
            throw new H5pError_1.default('storage-file-implementations:temporary-file-not-found', { filename, userId: user.id }, 404);
        }
        return (0, fs_1.createReadStream)(filePath, {
            start: rangeStart,
            end: rangeEnd
        });
    }
    async listFiles(user) {
        if (user) {
            (0, filenameUtils_1.checkFilename)(user.id);
        }
        const users = user ? [user.id] : await (0, promises_1.readdir)(this.directory);
        return (await Promise.all(users.map(async (u) => {
            const basePath = this.getAbsoluteUserDirectoryPath(u);
            const basePathLength = basePath.length + 1;
            const filesOfUser = await (0, get_all_files_1.getAllFiles)(basePath).toArray();
            return Promise.all(filesOfUser
                .map((f) => f.substr(basePathLength))
                .filter((f) => !f.endsWith('.metadata'))
                .map((f) => this.getTemporaryFileInfo(f, u)));
        }))).reduce((prev, curr) => prev.concat(curr), []);
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
    async saveFile(filename, dataStream, user, expirationTime) {
        (0, filenameUtils_1.checkFilename)(filename);
        (0, filenameUtils_1.checkFilename)(user.id);
        await (0, promises_1.mkdir)(this.getAbsoluteUserDirectoryPath(user.id), {
            recursive: true
        });
        const filePath = this.getAbsoluteFilePath(user.id, filename);
        await (0, promises_1.mkdir)(path_1.default.dirname(filePath), { recursive: true });
        const writeStream = (0, fs_1.createWriteStream)(filePath);
        await (0, promisepipe_1.default)(dataStream, writeStream);
        await (0, promises_1.writeFile)(`${filePath}.metadata`, JSON.stringify({
            expiresAt: expirationTime.getTime()
        }));
        return {
            expiresAt: expirationTime,
            filename,
            ownedByUserId: user.id
        };
    }
    async deleteEmptyDirectory(directory) {
        const files = await (0, promises_1.readdir)(directory);
        if (files.length === 0) {
            await (0, promises_1.rmdir)(directory);
        }
    }
    getAbsoluteFilePath(userId, filename) {
        return path_1.default.join(this.directory, userId, filename);
    }
    getAbsoluteUserDirectoryPath(userId) {
        return path_1.default.join(this.directory, userId);
    }
    async getTemporaryFileInfo(filename, userId) {
        const metadata = JSON.parse(await (0, promises_1.readFile)(`${this.getAbsoluteFilePath(userId, filename)}.metadata`, 'utf-8'));
        return {
            expiresAt: new Date(metadata.expiresAt),
            filename,
            ownedByUserId: userId
        };
    }
}
exports.default = DirectoryTemporaryFileStorage;
//# sourceMappingURL=DirectoryTemporaryFileStorage.js.map