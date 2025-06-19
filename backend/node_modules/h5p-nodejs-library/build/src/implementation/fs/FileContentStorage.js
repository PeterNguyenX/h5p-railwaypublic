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
var fs_extra_1 = __importDefault(require("fs-extra"));
var glob_promise_1 = __importDefault(require("glob-promise"));
var path_1 = __importDefault(require("path"));
var promisepipe_1 = __importDefault(require("promisepipe"));
var StreamHelpers_1 = require("../../helpers/StreamHelpers");
var src_1 = require("../../../src");
var filenameUtils_1 = require("./filenameUtils");
var DependencyChecker_1 = require("../../helpers/DependencyChecker");
/**
 * Persists content to the disk.
 */
var FileContentStorage = /** @class */ (function () {
    /**
     * @param contentPath The absolute path to the directory where the content should be stored
     */
    function FileContentStorage(contentPath, options) {
        var _a;
        this.contentPath = contentPath;
        this.options = options;
        fs_extra_1["default"].ensureDirSync(contentPath);
        this.maxFileLength =
            ((_a = options === null || options === void 0 ? void 0 : options.maxPathLength) !== null && _a !== void 0 ? _a : 255) - (contentPath.length + 1) - 23;
        // we subtract 23 for the contentId (12), unique ids appended to
        // the file (8) and path separators (3)
        if (this.maxFileLength < 20) {
            throw new Error('The path of content directory is too long to add files to it. Put the directory into a different location.');
        }
    }
    /**
     * Generates a unique content id that hasn't been used in the system so far.
     * @returns A unique content id
     */
    FileContentStorage.prototype.createContentId = function () {
        return __awaiter(this, void 0, void 0, function () {
            var counter, id, exists, p;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        counter = 0;
                        exists = false;
                        _a.label = 1;
                    case 1:
                        id = FileContentStorage.getRandomInt(1, Math.pow(2, 32));
                        counter += 1;
                        p = path_1["default"].join(this.getContentPath(), id.toString());
                        return [4 /*yield*/, fs_extra_1["default"].pathExists(p)];
                    case 2:
                        exists = _a.sent();
                        _a.label = 3;
                    case 3:
                        if (exists && counter < 5) return [3 /*break*/, 1];
                        _a.label = 4;
                    case 4:
                        if (exists) {
                            throw new src_1.H5pError('storage-file-implementations:error-generating-content-id');
                        }
                        return [2 /*return*/, id];
                }
            });
        });
    };
    /**
     * Gets the base path of the content
     * @returns the base content-path
     */
    FileContentStorage.prototype.getContentPath = function () {
        return this.contentPath;
    };
    /**
     * Returns a random integer
     * @param min The minimum
     * @param max The maximum
     * @returns a random integer
     */
    FileContentStorage.getRandomInt = function (min, max) {
        var finalMin = Math.ceil(min);
        var finalMax = Math.floor(max);
        return Math.floor(Math.random() * (finalMax - finalMin + 1)) + finalMin;
    };
    /**
     * Creates a content object in the repository. Add files to it later with addContentFile(...).
     * Throws an error if something went wrong. In this case no traces of the content are left in storage and all changes are reverted.
     * @param metadata The metadata of the content (= h5p.json)
     * @param content the content object (= content/content.json)
     * @param user The user who owns this object.
     * @param id (optional) The content id to use
     * @returns The newly assigned content id
     */
    FileContentStorage.prototype.addContent = function (metadata, content, user, id) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(id === undefined || id === null)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.createContentId()];
                    case 1:
                        // tslint:disable-next-line: no-parameter-reassignment
                        id = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 6, , 8]);
                        return [4 /*yield*/, fs_extra_1["default"].ensureDir(path_1["default"].join(this.getContentPath(), id.toString()))];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, fs_extra_1["default"].writeJSON(path_1["default"].join(this.getContentPath(), id.toString(), 'h5p.json'), metadata)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, fs_extra_1["default"].writeJSON(path_1["default"].join(this.getContentPath(), id.toString(), 'content.json'), content)];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 6:
                        error_1 = _a.sent();
                        return [4 /*yield*/, fs_extra_1["default"].remove(path_1["default"].join(this.getContentPath(), id.toString()))];
                    case 7:
                        _a.sent();
                        throw new src_1.H5pError('storage-file-implementations:error-creating-content');
                    case 8: return [2 /*return*/, id];
                }
            });
        });
    };
    /**
     * Adds a content file to an existing content object. The content object has to be created with createContent(...) first.
     * @param id The id of the content to add the file to
     * @param filename The filename
     * @param stream A readable stream that contains the data
     * @param user The user who owns this object
     * @returns
     */
    FileContentStorage.prototype.addFile = function (id, filename, stream, user) {
        return __awaiter(this, void 0, void 0, function () {
            var fullPath, writeStream;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filenameUtils_1.checkFilename(filename);
                        return [4 /*yield*/, fs_extra_1["default"].pathExists(path_1["default"].join(this.getContentPath(), id.toString()))];
                    case 1:
                        if (!(_a.sent())) {
                            throw new src_1.H5pError('storage-file-implementations:add-file-content-not-found', { filename: filename, id: id }, 404);
                        }
                        fullPath = path_1["default"].join(this.getContentPath(), id.toString(), filename);
                        return [4 /*yield*/, fs_extra_1["default"].ensureDir(path_1["default"].dirname(fullPath))];
                    case 2:
                        _a.sent();
                        writeStream = fs_extra_1["default"].createWriteStream(fullPath);
                        return [4 /*yield*/, promisepipe_1["default"](stream, writeStream)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Checks if a piece of content exists in storage.
     * @param contentId the content id to check
     * @returns true if the piece of content exists
     */
    FileContentStorage.prototype.contentExists = function (contentId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, fs_extra_1["default"].pathExists(path_1["default"].join(this.getContentPath(), contentId.toString()))];
            });
        });
    };
    /**
     * Deletes a content object and all its dependent files from the repository.
     * Throws errors if something goes wrong.
     * @param id The content id to delete.
     * @param user The user who wants to delete the content
     * @returns
     */
    FileContentStorage.prototype.deleteContent = function (id, user) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fs_extra_1["default"].pathExists(path_1["default"].join(this.getContentPath(), id.toString()))];
                    case 1:
                        if (!(_a.sent())) {
                            throw new src_1.H5pError('storage-file-implementations:delete-content-not-found', {}, 404);
                        }
                        return [4 /*yield*/, fs_extra_1["default"].remove(path_1["default"].join(this.getContentPath(), id.toString()))];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Deletes a file from a content object.
     * @param contentId the content object the file is attached to
     * @param filename the file to delete
     */
    FileContentStorage.prototype.deleteFile = function (contentId, filename) {
        return __awaiter(this, void 0, void 0, function () {
            var absolutePath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filenameUtils_1.checkFilename(filename);
                        absolutePath = path_1["default"].join(this.getContentPath(), contentId.toString(), filename);
                        return [4 /*yield*/, fs_extra_1["default"].pathExists(absolutePath)];
                    case 1:
                        if (!(_a.sent())) {
                            throw new src_1.H5pError('storage-file-implementations:delete-content-file-not-found', { filename: filename }, 404);
                        }
                        return [4 /*yield*/, fs_extra_1["default"].remove(absolutePath)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
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
    FileContentStorage.prototype.fileExists = function (contentId, filename) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                filenameUtils_1.checkFilename(filename);
                if (contentId !== undefined) {
                    return [2 /*return*/, fs_extra_1["default"].pathExists(path_1["default"].join(this.getContentPath(), contentId.toString(), filename))];
                }
                return [2 /*return*/, false];
            });
        });
    };
    /**
     * Returns information about a content file (e.g. image or video) inside a piece of content.
     * @param id the id of the content object that the file is attached to
     * @param filename the filename of the file to get information about
     * @param user the user who wants to retrieve the content file
     * @returns
     */
    FileContentStorage.prototype.getFileStats = function (id, filename, user) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.fileExists(id, filename)];
                    case 1:
                        if (!(_a.sent())) {
                            throw new src_1.H5pError('content-file-missing', { filename: filename, contentId: id }, 404);
                        }
                        return [2 /*return*/, fs_extra_1["default"].stat(path_1["default"].join(this.getContentPath(), id.toString(), filename))];
                }
            });
        });
    };
    /**
     * Returns a readable stream of a content file (e.g. image or video) inside a piece of content
     * @param id the id of the content object that the file is attached to
     * @param filename the filename of the file to get
     * @param user the user who wants to retrieve the content file
     * @param rangeStart (optional) the position in bytes at which the stream should start
     * @param rangeEnd (optional) the position in bytes at which the stream should end
     * @returns
     */
    FileContentStorage.prototype.getFileStream = function (id, filename, user, rangeStart, rangeEnd) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.fileExists(id, filename)];
                    case 1:
                        if (!(_a.sent())) {
                            throw new src_1.H5pError('content-file-missing', { filename: filename, contentId: id }, 404);
                        }
                        return [2 /*return*/, fs_extra_1["default"].createReadStream(path_1["default"].join(this.getContentPath(), id.toString(), filename), {
                                start: rangeStart,
                                end: rangeEnd
                            })];
                }
            });
        });
    };
    /**
     * Returns the content metadata (=h5p.json) for a content id
     * @param contentId the content id for which to retrieve the metadata
     * @param user (optional) the user who wants to access the metadata. If undefined, access must be granted.
     * @returns the metadata
     */
    FileContentStorage.prototype.getMetadata = function (contentId, user) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _b = (_a = JSON).parse;
                        _c = StreamHelpers_1.streamToString;
                        return [4 /*yield*/, this.getFileStream(contentId, 'h5p.json', user)];
                    case 1: return [4 /*yield*/, _c.apply(void 0, [_d.sent()])];
                    case 2: return [2 /*return*/, _b.apply(_a, [_d.sent()])];
                }
            });
        });
    };
    /**
     * Returns the parameters (=content.json) for a content id
     * @param contentId the content id for which to retrieve the metadata
     * @param user (optional) the user who wants to access the metadata. If undefined, access must be granted.
     * @returns the parameters
     */
    FileContentStorage.prototype.getParameters = function (contentId, user) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _b = (_a = JSON).parse;
                        _c = StreamHelpers_1.streamToString;
                        return [4 /*yield*/, this.getFileStream(contentId, 'content.json', user)];
                    case 1: return [4 /*yield*/, _c.apply(void 0, [_d.sent()])];
                    case 2: return [2 /*return*/, _b.apply(_a, [_d.sent()])];
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
    FileContentStorage.prototype.getUsage = function (library) {
        return __awaiter(this, void 0, void 0, function () {
            var asDependency, asMainLibrary, contentIds, _i, contentIds_1, contentId, contentMetadata, isMainLibrary;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        asDependency = 0;
                        asMainLibrary = 0;
                        return [4 /*yield*/, this.listContent()];
                    case 1:
                        contentIds = _a.sent();
                        _i = 0, contentIds_1 = contentIds;
                        _a.label = 2;
                    case 2:
                        if (!(_i < contentIds_1.length)) return [3 /*break*/, 5];
                        contentId = contentIds_1[_i];
                        return [4 /*yield*/, this.getMetadata(contentId)];
                    case 3:
                        contentMetadata = _a.sent();
                        isMainLibrary = contentMetadata.mainLibrary === library.machineName;
                        if (DependencyChecker_1.hasDependencyOn(contentMetadata, library)) {
                            if (isMainLibrary) {
                                asMainLibrary += 1;
                            }
                            else {
                                asDependency += 1;
                            }
                        }
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, { asDependency: asDependency, asMainLibrary: asMainLibrary }];
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
    FileContentStorage.prototype.getUserPermissions = function (contentId, user) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, [
                        src_1.Permission.Delete,
                        src_1.Permission.Download,
                        src_1.Permission.Edit,
                        src_1.Permission.Embed,
                        src_1.Permission.View
                    ]];
            });
        });
    };
    /**
     * Lists the content objects in the system (if no user is specified) or owned by the user.
     * @param user (optional) the user who owns the content
     * @returns a list of contentIds
     */
    FileContentStorage.prototype.listContent = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var directories;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fs_extra_1["default"].readdir(this.getContentPath())];
                    case 1:
                        directories = _a.sent();
                        return [4 /*yield*/, Promise.all(directories.map(function (dir) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, fs_extra_1["default"].pathExists(path_1["default"].join(this.getContentPath(), dir, 'h5p.json'))];
                                        case 1:
                                            if (!(_a.sent())) {
                                                return [2 /*return*/, ''];
                                            }
                                            return [2 /*return*/, dir];
                                    }
                                });
                            }); }))];
                    case 2: return [2 /*return*/, (_a.sent()).filter(function (content) { return content !== ''; })];
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
    FileContentStorage.prototype.listFiles = function (contentId, user) {
        return __awaiter(this, void 0, void 0, function () {
            var contentDirectoryPath, absolutePaths;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contentDirectoryPath = path_1["default"].join(this.getContentPath(), contentId.toString());
                        return [4 /*yield*/, glob_promise_1["default"](path_1["default"].join(contentDirectoryPath, '**', '*.*'), {
                                ignore: [
                                    path_1["default"].join(contentDirectoryPath, 'content.json'),
                                    path_1["default"].join(contentDirectoryPath, 'h5p.json')
                                ],
                                nodir: true
                            })];
                    case 1:
                        absolutePaths = _a.sent();
                        return [2 /*return*/, absolutePaths.map(function (p) { return path_1["default"].relative(contentDirectoryPath, p); })];
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
    FileContentStorage.prototype.sanitizeFilename = function (filename) {
        var _a;
        return filenameUtils_1.sanitizeFilename(filename, this.maxFileLength, (_a = this.options) === null || _a === void 0 ? void 0 : _a.invalidCharactersRegexp);
    };
    return FileContentStorage;
}());
exports["default"] = FileContentStorage;
//# sourceMappingURL=FileContentStorage.js.map