"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var mongodb_1 = require("mongodb");
var types_1 = require("../../types");
var Logger_1 = __importDefault(require("../../helpers/Logger"));
var H5pError_1 = __importDefault(require("../../helpers/H5pError"));
var S3Utils_1 = require("./S3Utils");
var log = new Logger_1["default"]('MongoS3ContentStorage');
/**
 * This storage implementation stores content data in a MongoDB collection
 * and a S3 bucket.
 * The parameters and metadata of a H5P content object are stored in MongoDB,
 * while all files are put into S3 storage.
 */
var MongoS3ContentStorage = /** @class */ (function () {
    /**
     * @param s3 the S3 content storage; Must be either set to a bucket or the
     * bucket must be specified in the options!
     * @param mongodb a MongoDB collection (read- and writable)
     * @param options options
     */
    function MongoS3ContentStorage(s3, mongodb, options) {
        this.s3 = s3;
        this.mongodb = mongodb;
        this.options = options;
        log.info('initialize');
        this.maxKeyLength =
            (options === null || options === void 0 ? void 0 : options.maxKeyLength) !== undefined
                ? options.maxKeyLength - 22
                : 1002;
        // By default we shorten to 1002 as S3 supports a maximum of 1024
        // characters and we need to account for contentIds (12), unique ids
        // appended to the name (8) and separators (2).
    }
    /**
     * Generates the S3 key for a file in a content object
     * @param contentId
     * @param filename
     * @returns the S3 key
     */
    MongoS3ContentStorage.getS3Key = function (contentId, filename) {
        var key = contentId + "/" + filename;
        if (key.length > 1024) {
            log.error("The S3 key for \"" + filename + "\" in content object with id " + contentId + " is " + key.length + " bytes long, but only 1024 are allowed.");
            throw new H5pError_1["default"]('mongo-s3-content-storage:filename-too-long', { filename: filename }, 400);
        }
        return key;
    };
    /**
     * Creates or updates a content object in the repository. Throws an error if
     * something went wrong.
     * @param metadata The metadata of the content (= h5p.json)
     * @param content the content object (= content/content.json)
     * @param user The user who owns this object.
     * @param contentId (optional) The content id to use
     * @returns The newly assigned content id
     */
    MongoS3ContentStorage.prototype.addContent = function (metadata, content, user, contentId) {
        return __awaiter(this, void 0, void 0, function () {
            var insertResult, replaceResult, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUserPermissions(contentId, user)];
                    case 1:
                        if (!(_a.sent()).includes(types_1.Permission.Edit)) {
                            log.error("User tried add content without proper permissions.");
                            throw new H5pError_1["default"]('mongo-s3-content-storage:missing-write-permission', {}, 403);
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 6, , 7]);
                        if (!!contentId) return [3 /*break*/, 4];
                        log.debug("Inserting new content into MongoDB.");
                        return [4 /*yield*/, this.mongodb.insertOne({
                                metadata: metadata,
                                parameters: content,
                                creator: user.id
                            })];
                    case 3:
                        insertResult = _a.sent();
                        log.debug("Content inserted into MongoDB.");
                        return [2 /*return*/, insertResult.insertedId.toString()];
                    case 4:
                        log.debug("Replacing existing content with id " + contentId + " in MongoDB.");
                        return [4 /*yield*/, this.mongodb.replaceOne({ _id: new mongodb_1.ObjectId(contentId) }, {
                                metadata: metadata,
                                _id: new mongodb_1.ObjectId(contentId),
                                parameters: content,
                                creator: user.id
                            }, { upsert: true })];
                    case 5:
                        replaceResult = _a.sent();
                        if (replaceResult.result.ok) {
                            return [2 /*return*/, contentId];
                        }
                        log.error("Error when replacing existing content with id " + contentId + " in MongoDB");
                        throw new H5pError_1["default"]('mongo-s3-content-storage:mongo-replace-error', {}, 500);
                    case 6:
                        error_1 = _a.sent();
                        log.error("Error when adding or updating content in MongoDB: " + error_1.message);
                        throw new H5pError_1["default"]('mongo-s3-content-storage:mongo-add-update-error', {}, 500);
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Adds a content file to an existing content object. Throws an error if
     * something went wrong.
     * @param contentId The id of the content to add the file to
     * @param filename The filename
     * @param stream A readable stream that contains the data
     * @param user The user who owns this object
     * @returns
     */
    MongoS3ContentStorage.prototype.addFile = function (contentId, filename, stream, user) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        log.debug("Uploading file \"" + filename + "\" for content with id " + contentId + " to S3 storage.");
                        S3Utils_1.validateFilename(filename);
                        return [4 /*yield*/, this.getUserPermissions(contentId, user)];
                    case 1:
                        if (!(_b.sent()).includes(types_1.Permission.Edit)) {
                            log.error("User tried to upload a file without proper permissions.");
                            throw new H5pError_1["default"]('mongo-s3-content-storage:missing-write-permission', {}, 403);
                        }
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.s3
                                .upload({
                                ACL: (_a = this.options.s3Acl) !== null && _a !== void 0 ? _a : 'private',
                                Body: stream,
                                Bucket: this.options.s3Bucket,
                                Key: MongoS3ContentStorage.getS3Key(contentId, filename),
                                Metadata: {
                                    owner: user.id
                                }
                            })
                                .promise()];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _b.sent();
                        log.error("Error while uploading file \"" + filename + "\" to S3 storage: " + error_2.message);
                        throw new H5pError_1["default"]("mongo-s3-content-storage:s3-upload-error", { filename: filename }, 500);
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Checks if a piece of content exists in storage.
     * @param contentId the content id to check
     * @returns true if the piece of content exists
     */
    MongoS3ContentStorage.prototype.contentExists = function (contentId) {
        return __awaiter(this, void 0, void 0, function () {
            var foundDoc;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.debug("Checking if content object with id " + contentId + " exists.");
                        return [4 /*yield*/, this.mongodb.findOne({
                                _id: new mongodb_1.ObjectId(contentId)
                            }, { projection: { _id: true } })];
                    case 1:
                        foundDoc = _a.sent();
                        if (foundDoc) {
                            log.debug("Content object with id " + contentId + " exists.");
                            return [2 /*return*/, true];
                        }
                        log.debug("Content object with id " + contentId + " does not exist.");
                        return [2 /*return*/, false];
                }
            });
        });
    };
    /**
     * Deletes a content object and all its dependent files from the repository.
     * Throws errors if something goes wrong.
     * @param contentId The content id to delete.
     * @param user The user who wants to delete the content
     * @returns
     */
    MongoS3ContentStorage.prototype.deleteContent = function (contentId, user) {
        return __awaiter(this, void 0, void 0, function () {
            var filesToDelete, next1000Files, deleteFilesRes, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.debug("Deleting content with id " + contentId + ".");
                        return [4 /*yield*/, this.getUserPermissions(contentId, user)];
                    case 1:
                        if (!(_a.sent()).includes(types_1.Permission.Delete)) {
                            log.error("User tried to delete a content object without proper permissions.");
                            throw new H5pError_1["default"]('mongo-s3-content-storage:missing-delete-permission', {}, 403);
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 9, , 10]);
                        return [4 /*yield*/, this.listFiles(contentId, user)];
                    case 3:
                        filesToDelete = _a.sent();
                        log.debug(filesToDelete.length + " files in S3 storage must be deleted.");
                        _a.label = 4;
                    case 4:
                        if (!(filesToDelete.length > 0)) return [3 /*break*/, 7];
                        next1000Files = filesToDelete.splice(0, 1000);
                        if (!(next1000Files.length > 0)) return [3 /*break*/, 6];
                        log.debug("Batch deleting " + next1000Files.length + " file(s) in S3 storage.");
                        return [4 /*yield*/, this.s3
                                .deleteObjects({
                                Bucket: this.options.s3Bucket,
                                Delete: {
                                    Objects: next1000Files.map(function (f) {
                                        return {
                                            Key: MongoS3ContentStorage.getS3Key(contentId, f)
                                        };
                                    })
                                }
                            })
                                .promise()];
                    case 5:
                        deleteFilesRes = _a.sent();
                        if (deleteFilesRes.Errors.length > 0) {
                            log.error("There were errors while deleting files in S3 storage. The delete operation will continue.\nErrors:" + deleteFilesRes.Errors.map(function (e) { return e.Key + ": " + e.Code + " - " + e.Message; }).join('\n'));
                        }
                        _a.label = 6;
                    case 6: return [3 /*break*/, 4];
                    case 7: return [4 /*yield*/, this.mongodb.deleteOne({ _id: new mongodb_1.ObjectId(contentId) })];
                    case 8:
                        if ((_a.sent())
                            .deletedCount !== 1) {
                            throw new Error('MongoDB document could not be deleted.');
                        }
                        return [3 /*break*/, 10];
                    case 9:
                        error_3 = _a.sent();
                        log.error("There was an error while deleting the content object: " + error_3.message);
                        throw new H5pError_1["default"]('mongo-s3-content-storage:deleting-content-error', {}, 500);
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Deletes a file from a content object.
     * @param contentId the content object the file is attached to
     * @param filename the file to delete
     */
    MongoS3ContentStorage.prototype.deleteFile = function (contentId, filename, user) {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.debug("Deleting file \"" + filename + "\" from content with id " + contentId + ".");
                        return [4 /*yield*/, this.getUserPermissions(contentId, user)];
                    case 1:
                        if (!(_a.sent()).includes(types_1.Permission.Edit)) {
                            log.error("User tried to delete a file from a content object without proper permissions.");
                            throw new H5pError_1["default"]('mongo-s3-content-storage:missing-write-permission', {}, 403);
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.s3
                                .deleteObject({
                                Bucket: this.options.s3Bucket,
                                Key: MongoS3ContentStorage.getS3Key(contentId, filename)
                            })
                                .promise()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_4 = _a.sent();
                        log.error("Error while deleting a file from S3 storage: " + error_4.message);
                        throw new H5pError_1["default"]('mongo-s3-content-storage:deleting-file-error', { filename: filename }, 500);
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Checks if a file exists.
     * @param contentId The id of the content to add the file to
     * @param filename the filename of the file to get
     * @returns true if the file exists
     */
    MongoS3ContentStorage.prototype.fileExists = function (contentId, filename) {
        return __awaiter(this, void 0, void 0, function () {
            var error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.debug("Checking if file " + filename + " exists in content with id " + contentId + ".");
                        S3Utils_1.validateFilename(filename);
                        if (!contentId) {
                            log.error("ContentId not set!");
                            throw new H5pError_1["default"]('mongo-s3-content-storage:content-not-found', {}, 404);
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.s3
                                .headObject({
                                Bucket: this.options.s3Bucket,
                                Key: MongoS3ContentStorage.getS3Key(contentId, filename)
                            })
                                .promise()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _a.sent();
                        log.debug("File " + filename + " does not exist in " + contentId + ".");
                        return [2 /*return*/, false];
                    case 4:
                        log.debug("File " + filename + " does exist in " + contentId + ".");
                        return [2 /*return*/, true];
                }
            });
        });
    };
    /**
     * Returns information about a content file (e.g. image or video) inside a
     * piece of content.
     * @param id the id of the content object that the file is attached to
     * @param filename the filename of the file to get information about
     * @param user the user who wants to retrieve the content file
     * @returns
     */
    MongoS3ContentStorage.prototype.getFileStats = function (contentId, filename, user) {
        return __awaiter(this, void 0, void 0, function () {
            var head, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        S3Utils_1.validateFilename(filename);
                        return [4 /*yield*/, this.getUserPermissions(contentId, user)];
                    case 1:
                        if (!(_a.sent()).includes(types_1.Permission.View)) {
                            log.error("User tried to get stats of file from a content object without proper permissions.");
                            throw new H5pError_1["default"]('mongo-s3-content-storage:missing-view-permission', {}, 403);
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.s3
                                .headObject({
                                Bucket: this.options.s3Bucket,
                                Key: MongoS3ContentStorage.getS3Key(contentId, filename)
                            })
                                .promise()];
                    case 3:
                        head = _a.sent();
                        return [2 /*return*/, { size: head.ContentLength, birthtime: head.LastModified }];
                    case 4:
                        error_6 = _a.sent();
                        throw new H5pError_1["default"]('content-file-missing', { filename: filename, contentId: contentId }, 404);
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
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
    MongoS3ContentStorage.prototype.getFileStream = function (contentId, filename, user, rangeStart, rangeEnd) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.debug("Getting stream for file \"" + filename + "\" in content " + contentId + ".");
                        S3Utils_1.validateFilename(filename);
                        if (!contentId) {
                            log.error("ContentId not set!");
                            throw new H5pError_1["default"]('mongo-s3-content-storage:content-not-found', {}, 404);
                        }
                        return [4 /*yield*/, this.getUserPermissions(contentId, user)];
                    case 1:
                        if (!(_a.sent()).includes(types_1.Permission.View)) {
                            log.error("User tried to display a file from a content object without proper permissions.");
                            throw new H5pError_1["default"]('mongo-s3-content-storage:missing-view-permission', {}, 403);
                        }
                        return [2 /*return*/, this.s3
                                .getObject({
                                Bucket: this.options.s3Bucket,
                                Key: MongoS3ContentStorage.getS3Key(contentId, filename),
                                Range: rangeStart && rangeEnd
                                    ? "bytes=" + rangeStart + "-" + rangeEnd
                                    : undefined
                            })
                                .createReadStream()];
                }
            });
        });
    };
    MongoS3ContentStorage.prototype.getMetadata = function (contentId, user) {
        return __awaiter(this, void 0, void 0, function () {
            var ret, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.debug("Getting metadata for content with id " + contentId + ".");
                        return [4 /*yield*/, this.getUserPermissions(contentId, user)];
                    case 1:
                        if (!(_a.sent()).includes(types_1.Permission.View)) {
                            log.error("User tried to get metadata of a content object without proper permissions.");
                            throw new H5pError_1["default"]('mongo-s3-content-storage:missing-view-permission', {}, 403);
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.mongodb.findOne({
                                _id: new mongodb_1.ObjectId(contentId)
                            })];
                    case 3:
                        ret = _a.sent();
                        return [2 /*return*/, ret.metadata];
                    case 4:
                        error_7 = _a.sent();
                        log.error("Content with id " + contentId + " does not exist.");
                        throw new H5pError_1["default"]('mongo-s3-content-storage:content-not-found', {}, 404);
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    MongoS3ContentStorage.prototype.getParameters = function (contentId, user) {
        return __awaiter(this, void 0, void 0, function () {
            var ret, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.debug("Getting parameters for content with id " + contentId + ".");
                        return [4 /*yield*/, this.getUserPermissions(contentId, user)];
                    case 1:
                        if (!(_a.sent()).includes(types_1.Permission.View)) {
                            log.error("User tried to get parameters of a content object without proper permissions.");
                            throw new H5pError_1["default"]('mongo-s3-content-storage:missing-view-permission', {}, 403);
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.mongodb.findOne({
                                _id: new mongodb_1.ObjectId(contentId)
                            })];
                    case 3:
                        ret = _a.sent();
                        return [2 /*return*/, ret.parameters];
                    case 4:
                        error_8 = _a.sent();
                        log.error("ContentId " + contentId + " does not exist.");
                        throw new H5pError_1["default"]('mongo-s3-content-storage:content-not-found', {}, 404);
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Calculates how often a library is in use.
     * @param library the library for which to calculate usage.
     * @returns asDependency: how often the library is used as subcontent in
     * content; asMainLibrary: how often the library is used as a main library
     */
    MongoS3ContentStorage.prototype.getUsage = function (library) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, asMainLibrary, asDependency;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            this.mongodb.countDocuments({
                                $and: [
                                    { 'metadata.mainLibrary': library.machineName },
                                    {
                                        'metadata.preloadedDependencies': {
                                            $elemMatch: {
                                                machineName: library.machineName,
                                                majorVersion: library.majorVersion,
                                                minorVersion: library.minorVersion
                                            }
                                        }
                                    }
                                ]
                            }),
                            this.mongodb.countDocuments({
                                $and: [
                                    {
                                        'metadata.mainLibrary': {
                                            $ne: library.machineName
                                        }
                                    },
                                    {
                                        $or: [
                                            {
                                                'metadata.preloadedDependencies': {
                                                    $elemMatch: {
                                                        machineName: library.machineName,
                                                        majorVersion: library.majorVersion,
                                                        minorVersion: library.minorVersion
                                                    }
                                                }
                                            },
                                            {
                                                'metadata.dynamicDependencies': {
                                                    $elemMatch: {
                                                        machineName: library.machineName,
                                                        majorVersion: library.majorVersion,
                                                        minorVersion: library.minorVersion
                                                    }
                                                }
                                            },
                                            {
                                                'metadata.editorDependencies': {
                                                    $elemMatch: {
                                                        machineName: library.machineName,
                                                        majorVersion: library.majorVersion,
                                                        minorVersion: library.minorVersion
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                ]
                            })
                        ])];
                    case 1:
                        _a = _b.sent(), asMainLibrary = _a[0], asDependency = _a[1];
                        return [2 /*return*/, { asMainLibrary: asMainLibrary, asDependency: asDependency }];
                }
            });
        });
    };
    /**
     * Returns an array of permissions that the user has on the piece of content
     * @param contentId the content id to check
     * @param user the user who wants to access the piece of content
     * @returns the permissions the user has for this content (e.g. download it, delete it etc.)
     */
    MongoS3ContentStorage.prototype.getUserPermissions = function (contentId, user) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                log.debug("Getting user permissions for content with id " + contentId + ".");
                if (this.options.getPermissions) {
                    log.debug("Using function passed in through constructor to get permissions.");
                    return [2 /*return*/, this.options.getPermissions(contentId, user)];
                }
                log.debug("No permission function set in constructor. Allowing everything.");
                return [2 /*return*/, [
                        types_1.Permission.Delete,
                        types_1.Permission.Download,
                        types_1.Permission.Edit,
                        types_1.Permission.Embed,
                        types_1.Permission.List,
                        types_1.Permission.View
                    ]];
            });
        });
    };
    MongoS3ContentStorage.prototype.listContent = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var cursor, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.debug("Listing content objects.");
                        return [4 /*yield*/, this.getUserPermissions(undefined, user)];
                    case 1:
                        if (!(_a.sent()).includes(types_1.Permission.View)) {
                            log.error("User tried to list all content objects without proper permissions.");
                            throw new H5pError_1["default"]('mongo-s3-content-storage:missing-list-content-permission', {}, 403);
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        cursor = this.mongodb.find({}, { projection: { _id: true } });
                        return [4 /*yield*/, cursor.toArray()];
                    case 3: return [2 /*return*/, (_a.sent()).map(function (match) {
                            return match._id.toHexString();
                        })];
                    case 4:
                        error_9 = _a.sent();
                        log.error("Error while listing all ids of content objects: " + error_9.message);
                        throw new H5pError_1["default"]('mongo-s3-content-storage:listing-content-error', {}, 500);
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets the filenames of files added to the content with addContentFile(...) (e.g. images, videos or other files)
     * @param contentId the piece of content
     * @param user the user who wants to access the piece of content
     * @returns a list of files that are used in the piece of content, e.g. ['image1.png', 'video2.mp4']
     */
    MongoS3ContentStorage.prototype.listFiles = function (contentId, user) {
        return __awaiter(this, void 0, void 0, function () {
            var prefix, files, ret, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.debug("Listing files in content object with id " + contentId + ".");
                        return [4 /*yield*/, this.getUserPermissions(contentId, user)];
                    case 1:
                        if (!(_a.sent()).includes(types_1.Permission.View)) {
                            log.error("User tried to get the list of files from a content object without proper permissions.");
                            throw new H5pError_1["default"]('mongo-s3-content-storage:missing-view-permission', {}, 403);
                        }
                        prefix = MongoS3ContentStorage.getS3Key(contentId, '');
                        files = [];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 7, , 8]);
                        ret = void 0;
                        _a.label = 3;
                    case 3:
                        log.debug("Requesting list from S3 storage.");
                        return [4 /*yield*/, this.s3
                                .listObjectsV2({
                                Bucket: this.options.s3Bucket,
                                Prefix: prefix,
                                ContinuationToken: ret === null || ret === void 0 ? void 0 : ret.NextContinuationToken,
                                MaxKeys: 1000
                            })
                                .promise()];
                    case 4:
                        ret = _a.sent();
                        files = files.concat(ret.Contents.map(function (c) { return c.Key.substr(prefix.length); }));
                        _a.label = 5;
                    case 5:
                        if (ret.IsTruncated && ret.NextContinuationToken) return [3 /*break*/, 3];
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_10 = _a.sent();
                        log.debug("There was an error while getting list of files from S3. This might not be a problem if no files were added to the content object.");
                        return [2 /*return*/, []];
                    case 8:
                        log.debug("Found " + files.length + " file(s) in S3.");
                        return [2 /*return*/, files];
                }
            });
        });
    };
    /**
     * Removes invalid characters from filenames and enforces other filename
     * rules required by the storage implementation (e.g. filename length
     * restrictions).
     * @param filename the filename to sanitize; this can be a relative path
     * (e.g. "images/image1.png")
     * @returns the clean filename
     */
    MongoS3ContentStorage.prototype.sanitizeFilename = function (filename) {
        var _a;
        return S3Utils_1.sanitizeFilename(filename, this.maxKeyLength, (_a = this.options) === null || _a === void 0 ? void 0 : _a.invalidCharactersRegexp);
    };
    return MongoS3ContentStorage;
}());
exports["default"] = MongoS3ContentStorage;
//# sourceMappingURL=MongoS3ContentStorage.js.map