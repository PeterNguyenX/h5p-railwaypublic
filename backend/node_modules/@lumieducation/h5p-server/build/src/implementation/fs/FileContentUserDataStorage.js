"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const get_all_files_1 = require("get-all-files");
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const Logger_1 = __importDefault(require("../../helpers/Logger"));
const filenameUtils_1 = require("./filenameUtils");
const log = new Logger_1.default('FileContentUserDataStorage');
/**
 * Saves user data in JSON files on the disk. It creates one file per content
 * object. There's a separate file for user states and one for the finished data.
 * Each file contains a list of all states or finished data objects.
 */
class FileContentUserDataStorage {
    directory;
    constructor(directory) {
        this.directory = directory;
        if (!(0, fs_1.existsSync)(directory)) {
            log.debug('Creating directory', directory);
            (0, fs_1.mkdirSync)(directory, { recursive: true });
        }
    }
    async getContentUserData(contentId, dataType, subContentId, userId, contextId) {
        const file = this.getSafeUserDataFilePath(contentId);
        let dataList;
        try {
            dataList = JSON.parse(await (0, promises_1.readFile)(file, 'utf-8'));
        }
        catch (error) {
            log.error('getContentUserData', 'Error reading file', file, 'Error:', error);
            return null;
        }
        try {
            return (dataList.find((data) => data.dataType === dataType &&
                data.subContentId === subContentId &&
                data.userId === userId &&
                data.contextId === contextId) || null);
        }
        catch (error) {
            log.error('getContentUserData', 'Corrupt file', file, 'Error:', error);
            return null;
        }
    }
    async getContentUserDataByUser(user) {
        const files = await (0, get_all_files_1.getAllFiles)(this.directory).toArray();
        const result = [];
        for (const file of files) {
            if (!file.endsWith('-userdata.json')) {
                continue;
            }
            let data;
            try {
                data = JSON.parse(await (0, promises_1.readFile)(file, 'utf-8'));
            }
            catch (error) {
                log.error('getContentUserDataByUser', 'Error reading file', file, 'Error:', error, 'Data in the corrupt file is not part of the list');
            }
            try {
                for (const entry of data) {
                    if (entry.userId === user.id) {
                        result.push(entry);
                    }
                }
            }
            catch (error) {
                log.error('getContentUserDataByUser', 'Error going through data in file', file, 'Error:', error);
            }
        }
        return result;
    }
    async createOrUpdateContentUserData(userData) {
        const filename = this.getSafeUserDataFilePath(userData.contentId);
        let oldData;
        try {
            oldData = JSON.parse(await (0, promises_1.readFile)(filename, 'utf-8'));
        }
        catch (error) {
            log.debug('createOrUpdateContentUserData', 'Error while reading user data file for contentId', userData.contentId, '(error:', error, '). Seeding with empty list.');
            oldData = [];
        }
        // make sure we have only one entry for contentId, dataType,
        // subContentId, user and contextId
        const newUserData = oldData.filter((data) => data.contentId !== userData.contentId ||
            data.dataType !== userData.dataType ||
            data.subContentId !== userData.subContentId ||
            data.userId !== userData.userId ||
            data.contextId !== userData.contextId);
        newUserData.push(userData);
        try {
            await (0, promises_1.writeFile)(filename, JSON.stringify(newUserData));
        }
        catch (error) {
            log.error('createOrUpdateContentUserData', 'Error while writing user data to file for contentId', userData.contentId, 'Error:', error);
        }
    }
    async deleteInvalidatedContentUserData(contentId) {
        const filename = this.getSafeUserDataFilePath(contentId);
        let oldData;
        try {
            oldData = JSON.parse(await (0, promises_1.readFile)(filename, 'utf-8'));
        }
        catch (error) {
            log.debug('deleteInvalidatedContentUserData', 'Error while reading user data file for contentId', contentId, '(error:', error, '). Seeding with empty list.');
            oldData = [];
        }
        // make sure we have only one entry for contentId, dataType, subContentId and user
        const newUserData = oldData.filter((data) => data.contentId !== contentId || !data.invalidate);
        try {
            await (0, promises_1.writeFile)(filename, JSON.stringify(newUserData));
        }
        catch (error) {
            log.error('deleteInvalidatedContentUserData', 'Error while writing user data to file for contentId', contentId, 'Error:', error);
        }
    }
    async deleteAllContentUserDataByUser(user) {
        const files = await (0, get_all_files_1.getAllFiles)(this.directory).toArray();
        for (const file of files) {
            if (!file.endsWith('-userdata.json')) {
                continue;
            }
            let data;
            try {
                data = JSON.parse(await (0, promises_1.readFile)(file, 'utf-8'));
            }
            catch (error) {
                log.error('deleteAllContentUserDataByUser', 'Error reading file', file, 'Error:', error, 'Data in the corrupt file is not part of the list');
            }
            let newData;
            try {
                newData = data?.filter((d) => d.userId !== user.id);
            }
            catch (error) {
                log.error('deleteAllContentUserDataByUser', 'Error going through data in file', file, 'Error:', error);
            }
            if (newData) {
                try {
                    await (0, promises_1.writeFile)(file, JSON.stringify(newData));
                }
                catch (error) {
                    log.error('deleteAllContentUserDataByUser', 'Error writing data to file', file, 'Error:', error);
                }
            }
        }
    }
    async deleteAllContentUserDataByContentId(contentId) {
        const file = this.getSafeUserDataFilePath(contentId);
        try {
            await (0, promises_1.rm)(file, { recursive: true, force: true });
        }
        catch (error) {
            log.error('deleteAllContentUserDataByContentId', 'Could not delete file', file, 'Error:', error);
        }
    }
    async getContentUserDataByContentIdAndUser(contentId, userId, contextId) {
        const file = this.getSafeUserDataFilePath(contentId);
        let dataList;
        try {
            dataList = JSON.parse(await (0, promises_1.readFile)(file, 'utf-8'));
        }
        catch (error) {
            log.error('getContentUserDataByContentIdAndUser', 'Error reading file', file, 'Error:', error);
            return [];
        }
        try {
            return dataList.filter((data) => data.userId === userId && data.contextId == contextId);
        }
        catch (error) {
            log.error('getContentUserDataByContentIdAndUser', 'Corrupt file', file);
            return [];
        }
    }
    async createOrUpdateFinishedData(finishedData) {
        const filename = this.getSafeFinishedFilePath(finishedData.contentId);
        let oldData;
        try {
            oldData = JSON.parse(await (0, promises_1.readFile)(filename, 'utf-8'));
        }
        catch (error) {
            log.debug('createOrUpdateFinishedData', 'Error while reading finished file for contentId', finishedData.contentId, '(error:', error, '). Seeding with empty list.');
            oldData = [];
        }
        // make sure we have only one entry for user
        const newData = oldData.filter((data) => data.userId !== finishedData.userId);
        newData.push(finishedData);
        try {
            await (0, promises_1.writeFile)(filename, JSON.stringify(newData));
        }
        catch (error) {
            log.error('createOrUpdateFinishedData', 'Error while writing finished data to file for contentId', finishedData.contentId, 'Error:', error);
        }
    }
    async getFinishedDataByContentId(contentId) {
        const file = this.getSafeFinishedFilePath(contentId);
        let finishedList;
        try {
            finishedList = JSON.parse(await (0, promises_1.readFile)(file, 'utf-8'));
        }
        catch (error) {
            log.error('getFinishedDataByContentId', 'Error reading file', file, 'Error:', error);
            return undefined;
        }
        if (Array.isArray(finishedList)) {
            return finishedList;
        }
        else {
            log.error('getFinishedDataByContentId', 'Corrupt file', file);
            return [];
        }
    }
    async getFinishedDataByUser(user) {
        const files = await (0, get_all_files_1.getAllFiles)(this.directory).toArray();
        const result = [];
        for (const file of files) {
            if (!file.endsWith('-finished.json')) {
                continue;
            }
            let data;
            try {
                data = JSON.parse(await (0, promises_1.readFile)(file, 'utf-8'));
            }
            catch (error) {
                log.error('getFinishedDataByUser', 'Error reading file', file, 'Error:', error, 'Data in the corrupt file is not part of the list');
            }
            try {
                for (const entry of data) {
                    if (entry.userId === user.id) {
                        result.push(entry);
                    }
                }
            }
            catch (error) {
                log.error('getFinishedDataByUser', 'Error going through data in file', file, 'Error:', error);
            }
        }
        return result;
    }
    async deleteFinishedDataByContentId(contentId) {
        const file = this.getSafeFinishedFilePath(contentId);
        try {
            await (0, promises_1.rm)(file, { recursive: true, force: true });
        }
        catch (error) {
            log.error('deleteFinishedDataByContentId', 'Could not delete file', file, 'Error:', error);
        }
    }
    async deleteFinishedDataByUser(user) {
        const files = await (0, get_all_files_1.getAllFiles)(this.directory).toArray();
        for (const file of files) {
            if (!file.endsWith('-finished.json')) {
                continue;
            }
            let data;
            try {
                data = JSON.parse(await (0, promises_1.readFile)(file, 'utf-8'));
            }
            catch (error) {
                log.error('deleteFinishedDataByUser', 'Error reading file', file, 'Error:', error, 'Data in the corrupt file is not part of the list');
            }
            let newData;
            try {
                newData = data?.filter((d) => d.userId !== user.id);
            }
            catch (error) {
                log.error('deleteFinishedDataByUser', 'Error going through data in file', file, 'Error:', error);
            }
            if (newData) {
                try {
                    await (0, promises_1.writeFile)(file, JSON.stringify(newData));
                }
                catch (error) {
                    log.error('deleteFinishedDataByUser', 'Error writing data to file', file, 'Error:', error);
                }
            }
        }
    }
    getSafeUserDataFilePath(contentId) {
        (0, filenameUtils_1.checkFilename)(contentId);
        return path_1.default.join(this.directory, (0, filenameUtils_1.sanitizeFilename)(`${contentId}-userdata.json`, 80, /[^A-Za-z0-9\-._]/g));
    }
    getSafeFinishedFilePath(contentId) {
        (0, filenameUtils_1.checkFilename)(contentId);
        return path_1.default.join(this.directory, (0, filenameUtils_1.sanitizeFilename)(`${contentId}-finished.json`, 80, /[^A-Za-z0-9\-._]/g));
    }
}
exports.default = FileContentUserDataStorage;
//# sourceMappingURL=FileContentUserDataStorage.js.map