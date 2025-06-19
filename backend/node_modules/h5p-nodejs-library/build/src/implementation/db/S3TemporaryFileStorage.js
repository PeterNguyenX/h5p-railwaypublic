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
var types_1 = require("../../types");
var S3Utils_1 = require("./S3Utils");
var Logger_1 = __importDefault(require("../../helpers/Logger"));
var H5pError_1 = __importDefault(require("../../helpers/H5pError"));
var log = new Logger_1["default"]('S3TemporaryFileStorage');
/**
 * This class stores temporary files in a S3-compatible storage system.
 *
 * IMPORTANT:
 * The expiration (and automatic deletion) of files must be handled on bucket
 * level. See https://aws.amazon.com/de/blogs/aws/amazon-s3-object-expiration/
 * for details.
 *
 * You can call the method setBucketLifecycleConfiguration(...) to set up a
 * lifecycle configuration for the expiration time set in the config or you can
 * set up the policy in a more customized way manually.
 */
var S3TemporaryFileStorage = /** @class */ (function () {
    function S3TemporaryFileStorage(s3, options) {
        this.s3 = s3;
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
     * Deletes the file from temporary storage.
     * Throws errors of something goes wrong.
     * @param filename the file to delete
     * @param userId the user ID of the user who wants to delete the file
     */
    S3TemporaryFileStorage.prototype.deleteFile = function (filename, userId) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        log.debug("Deleting file \"" + filename + "\" from temporary storage.");
                        S3Utils_1.validateFilename(filename);
                        if (!filename) {
                            log.error("Filename empty!");
                            throw new H5pError_1["default"]('s3-temporary-storage:file-not-found', {}, 404);
                        }
                        return [4 /*yield*/, this.getUserPermissions(userId, filename)];
                    case 1:
                        if (!(_b.sent()).includes(types_1.Permission.Delete)) {
                            log.error("User tried to delete a file from a temporary storage without proper permissions.");
                            throw new H5pError_1["default"]('s3-temporary-storage:missing-delete-permission', {}, 403);
                        }
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.s3
                                .deleteObject({
                                Bucket: (_a = this.options) === null || _a === void 0 ? void 0 : _a.s3Bucket,
                                Key: filename
                            })
                                .promise()];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _b.sent();
                        log.error("Error while deleting a file from S3 storage: " + error_1.message);
                        throw new H5pError_1["default"]('s3-temporary-storage:deleting-file-error', { filename: filename }, 500);
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Checks if a file exists in temporary storage.
     * @param filename the file to check
     * @param user the user who wants to access the file
     */
    S3TemporaryFileStorage.prototype.fileExists = function (filename, user) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        log.debug("Checking if file " + filename + " exists in temporary storage.");
                        S3Utils_1.validateFilename(filename);
                        if (!filename) {
                            log.error("Filename empty!");
                            return [2 /*return*/, false];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.s3
                                .headObject({
                                Bucket: (_a = this.options) === null || _a === void 0 ? void 0 : _a.s3Bucket,
                                Key: filename
                            })
                                .promise()];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _b.sent();
                        log.debug("File \"" + filename + "\" does not exist in temporary storage.");
                        return [2 /*return*/, false];
                    case 4:
                        log.debug("File \"" + filename + "\" does exist in temporary storage.");
                        return [2 /*return*/, true];
                }
            });
        });
    };
    /**
     * Returns a information about a temporary file.
     * Throws an exception if the file does not exist.
     * @param filename the relative path inside the library
     * @param user the user who wants to access the file
     * @returns the file stats
     */
    S3TemporaryFileStorage.prototype.getFileStats = function (filename, user) {
        return __awaiter(this, void 0, void 0, function () {
            var head, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        S3Utils_1.validateFilename(filename);
                        return [4 /*yield*/, this.getUserPermissions(user.id, filename)];
                    case 1:
                        if (!(_a.sent()).includes(types_1.Permission.View)) {
                            log.error("User tried to get stats of a content object without proper permissions.");
                            throw new H5pError_1["default"]('s3-temporary-storage:missing-view-permission', {}, 403);
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.s3
                                .headObject({
                                Bucket: this.options.s3Bucket,
                                Key: filename
                            })
                                .promise()];
                    case 3:
                        head = _a.sent();
                        return [2 /*return*/, { size: head.ContentLength, birthtime: head.LastModified }];
                    case 4:
                        error_3 = _a.sent();
                        throw new H5pError_1["default"]('file-not-found', {}, 404);
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns a readable for a file.
     *
     * Note: Make sure to handle the 'error' event of the Readable! This method
     * does not check if the file exists in storage to avoid the extra request.
     * However, this means that there will be an error when piping the Readable
     * to the response if the file doesn't exist!
     * @param filename
     * @param user
     * @param rangeStart (optional) the position in bytes at which the stream should start
     * @param rangeEnd (optional) the position in bytes at which the stream should end
     */
    S3TemporaryFileStorage.prototype.getFileStream = function (filename, user, rangeStart, rangeEnd) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        log.debug("Getting stream for temporary file \"" + filename + "\".");
                        S3Utils_1.validateFilename(filename);
                        if (!filename) {
                            log.error("Filename empty!");
                            throw new H5pError_1["default"]('s3-temporary-storage:file-not-found', {}, 404);
                        }
                        return [4 /*yield*/, this.getUserPermissions(user.id, filename)];
                    case 1:
                        if (!(_b.sent()).includes(types_1.Permission.View)) {
                            log.error("User tried to display a file from a content object without proper permissions.");
                            throw new H5pError_1["default"]('s3-temporary-storage:missing-view-permission', {}, 403);
                        }
                        return [2 /*return*/, this.s3
                                .getObject({
                                Bucket: (_a = this.options) === null || _a === void 0 ? void 0 : _a.s3Bucket,
                                Key: filename,
                                Range: rangeStart && rangeEnd
                                    ? "bytes=" + rangeStart + "-" + rangeEnd
                                    : undefined
                            })
                                .createReadStream()];
                }
            });
        });
    };
    /**
     * Checks if a user has access rights on file in temporary storage.
     * @param userId
     * @param filename
     * @returns the list of permissions the user has on the file.
     */
    S3TemporaryFileStorage.prototype.getUserPermissions = function (userId, filename) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                log.debug("Getting temporary storage permissions for userId " + userId + ".");
                if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.getPermissions) {
                    log.debug("Using function passed in through constructor to get permissions.");
                    return [2 /*return*/, this.options.getPermissions(userId, filename)];
                }
                log.debug("No permission function set in constructor. Allowing everything.");
                return [2 /*return*/, [types_1.Permission.Delete, types_1.Permission.Edit, types_1.Permission.View]];
            });
        });
    };
    /**
     * Theoretically lists all files either in temporary storage in general
     * or files which the user has stored in it.
     *
     * In the S3 implementation the method is not implemented, as S3 supports
     * file expiration on the bucket level. This feature should be used instead
     * of manually scanning for expired files.
     */
    S3TemporaryFileStorage.prototype.listFiles = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // As S3 files expire automatically, we don't need to return any file here.
                return [2 /*return*/, []];
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
    S3TemporaryFileStorage.prototype.sanitizeFilename = function (filename) {
        var _a;
        return S3Utils_1.sanitizeFilename(filename, this.maxKeyLength, (_a = this.options) === null || _a === void 0 ? void 0 : _a.invalidCharactersRegexp);
    };
    /**
     * DSaves a file to temporary storage.
     * @param filename
     * @param dataStream
     * @param user
     * @param expirationTime
     */
    S3TemporaryFileStorage.prototype.saveFile = function (filename, dataStream, user, expirationTime) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        log.debug("Saving temporary file \"" + filename + ".\"");
                        S3Utils_1.validateFilename(filename);
                        if (!filename) {
                            log.error("Filename empty!");
                            throw new H5pError_1["default"]('illegal-filename', {}, 400);
                        }
                        return [4 /*yield*/, this.getUserPermissions(user.id, filename)];
                    case 1:
                        if (!(_d.sent()).includes(types_1.Permission.Edit)) {
                            log.error("User tried upload file to temporary storage without proper permissions.");
                            throw new H5pError_1["default"]('s3-temporary-storage:missing-write-permission', {}, 403);
                        }
                        _d.label = 2;
                    case 2:
                        _d.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.s3
                                .upload({
                                ACL: (_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.s3Acl) !== null && _b !== void 0 ? _b : 'private',
                                Body: dataStream,
                                Bucket: (_c = this.options) === null || _c === void 0 ? void 0 : _c.s3Bucket,
                                Key: filename,
                                Metadata: {
                                    creator: user.id
                                }
                            })
                                .promise()];
                    case 3:
                        _d.sent();
                        return [2 /*return*/, {
                                filename: filename,
                                ownedByUserId: user.id,
                                expiresAt: expirationTime
                            }];
                    case 4:
                        error_4 = _d.sent();
                        log.error("Error while uploading file \"" + filename + "\" to S3 storage: " + error_4.message);
                        throw new H5pError_1["default"]("s3-temporary-storage:s3-upload-error", { filename: filename }, 500);
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Makes sure the lifecycle configuration of the bucket is set in a way
     * that files automatically expire after the time period set in the the
     * configuration's 'temporaryFileLifetime' property.
     *
     * Note: S3's expiration policy only work with full days. The value in the
     * configuration (which can be set in milliseconds) is rounded to the
     * nearest day and will always be at least one day.
     *
     * This method will override all existing lifecycle configurations. If you
     * need several custom lifecycle configurations, you must create them
     * manually and NOT use this method.
     * @param config
     */
    S3TemporaryFileStorage.prototype.setBucketLifecycleConfiguration = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var roundToNearestDay, expirationNeedsToBeSet, lifecycleConfiguration, _a, error_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        log.debug("Setting up object expiration for bucket " + this.options.s3Bucket + ".");
                        roundToNearestDay = function (milliseconds) {
                            return Math.max(1, Math.round(milliseconds / (1000 * 60 * 24)));
                        };
                        expirationNeedsToBeSet = false;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.s3
                                .getBucketLifecycleConfiguration({
                                Bucket: this.options.s3Bucket
                            })
                                .promise()];
                    case 2:
                        lifecycleConfiguration = _b.sent();
                        if (!lifecycleConfiguration.Rules.some(function (rule) {
                            var _a;
                            return ((_a = rule.Filter) === null || _a === void 0 ? void 0 : _a.Prefix) === '' &&
                                rule.Expiration.Days ===
                                    roundToNearestDay(config.temporaryFileLifetime) &&
                                rule.Status === 'Enabled';
                        })) {
                            log.debug("Old lifecycle configuration differs from the one set in the configuration.");
                            expirationNeedsToBeSet = true;
                        }
                        else {
                            log.debug("Old lifecycle configuration matches configuration file.");
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        log.debug("No old lifecycle configuration exists.");
                        expirationNeedsToBeSet = true;
                        return [3 /*break*/, 4];
                    case 4:
                        if (!expirationNeedsToBeSet) return [3 /*break*/, 8];
                        log.debug("Creating new lifecycle configuration for bucket.");
                        _b.label = 5;
                    case 5:
                        _b.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this.s3
                                .putBucketLifecycleConfiguration({
                                Bucket: this.options.s3Bucket,
                                LifecycleConfiguration: {
                                    Rules: [
                                        {
                                            Status: 'Enabled',
                                            Expiration: {
                                                Days: roundToNearestDay(config.temporaryFileLifetime)
                                            }
                                        }
                                    ]
                                }
                            })
                                .promise()];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        error_5 = _b.sent();
                        log.error("Could not set new lifecycle configuration: " + error_5.message);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    return S3TemporaryFileStorage;
}());
exports["default"] = S3TemporaryFileStorage;
//# sourceMappingURL=S3TemporaryFileStorage.js.map