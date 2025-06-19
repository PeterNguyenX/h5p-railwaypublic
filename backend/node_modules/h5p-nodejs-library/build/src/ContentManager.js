"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var path = __importStar(require("path"));
var ContentMetadata_1 = require("./ContentMetadata");
var Logger_1 = __importDefault(require("./helpers/Logger"));
var log = new Logger_1["default"]('ContentManager');
/**
 * The ContentManager takes care of saving content and dependent files. It only contains storage-agnostic functionality and
 * depends on a ContentStorage object to do the actual persistence.
 */
var ContentManager = /** @class */ (function () {
    /**
     * @param contentStorage The storage object
     */
    function ContentManager(contentStorage) {
        var _this = this;
        this.contentStorage = contentStorage;
        /**
         * Checks if a file exists.
         * @param contentId The id of the content to add the file to
         * @param filename the filename of the file to get
         * @returns true if the file exists
         */
        this.contentFileExists = function (contentId, filename) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.contentStorage.fileExists(contentId, filename)];
            });
        }); };
        this.sanitizeFilename = function (filename) {
            if (_this.contentStorage.sanitizeFilename) {
                return _this.contentStorage.sanitizeFilename(filename);
            }
            return filename;
        };
        log.info('initialize');
        this.contentStorage = contentStorage;
    }
    /**
     * Adds a content file to an existing content object. The content object has to be created with createContent(...) first.
     * @param contentId The id of the content to add the file to
     * @param filename The name of the content file
     * @param stream A readable stream that contains the data
     * @param user The user who owns this object
     * @returns
     */
    ContentManager.prototype.addContentFile = function (contentId, filename, stream, user) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                log.info("adding file " + filename + " to content " + contentId);
                return [2 /*return*/, this.contentStorage.addFile(contentId, filename, stream, user)];
            });
        });
    };
    /**
     * Checks if a piece of content exists.
     * @param contentId the content to check
     * @returns true if the piece of content exists
     */
    ContentManager.prototype.contentExists = function (contentId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                log.debug("checking if content " + contentId + " exists");
                return [2 /*return*/, this.contentStorage.contentExists(contentId)];
            });
        });
    };
    /**
     * Adds content from a H5P package (in a temporary directory) to the installation.
     * It does not check whether the user has permissions to save content.
     * @deprecated The method should not be used as it anymore, as there might
     * be issues with invalid filenames!
     * @param packageDirectory The absolute path containing the package (the directory containing h5p.json)
     * @param user The user who is adding the package.
     * @param contentId (optional) The content id to use for the package
     * @returns The id of the content that was created (the one passed to the method or a new id if there was none).
     */
    ContentManager.prototype.copyContentFromDirectory = function (packageDirectory, user, contentId) {
        return __awaiter(this, void 0, void 0, function () {
            var metadata, parameters, otherContentFiles, newContentId, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.info("copying content from directory " + packageDirectory);
                        return [4 /*yield*/, fs_extra_1["default"].readJSON(path.join(packageDirectory, 'h5p.json'))];
                    case 1:
                        metadata = _a.sent();
                        return [4 /*yield*/, fs_extra_1["default"].readJSON(path.join(packageDirectory, 'content', 'content.json'))];
                    case 2:
                        parameters = _a.sent();
                        return [4 /*yield*/, glob_promise_1["default"](path.join(packageDirectory, 'content', '**/*.*'))];
                    case 3:
                        otherContentFiles = (_a.sent()).filter(function (file) {
                            return path.relative(packageDirectory, file) !== 'content.json';
                        });
                        return [4 /*yield*/, this.contentStorage.addContent(metadata, parameters, user, contentId)];
                    case 4:
                        newContentId = _a.sent();
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 9]);
                        return [4 /*yield*/, Promise.all(otherContentFiles.map(function (file) {
                                var readStream = fs_extra_1["default"].createReadStream(file);
                                var localPath = path.relative(path.join(packageDirectory, 'content'), file);
                                log.debug("adding " + file + " to " + packageDirectory);
                                return _this.contentStorage.addFile(newContentId, localPath, readStream);
                            }))];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 7:
                        error_1 = _a.sent();
                        log.error(error_1);
                        return [4 /*yield*/, this.contentStorage.deleteContent(newContentId)];
                    case 8:
                        _a.sent();
                        throw error_1;
                    case 9: return [2 /*return*/, { id: newContentId, metadata: metadata, parameters: parameters }];
                }
            });
        });
    };
    /**
     * Creates a content object in the repository. Add files to it later with addContentFile(...).
     * @param metadata The metadata of the content (= h5p.json)
     * @param content the content object (= content/content.json)
     * @param user The user who owns this object.
     * @param contentId (optional) The content id to use
     * @returns The newly assigned content id
     */
    ContentManager.prototype.createOrUpdateContent = function (metadata, content, user, contentId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                log.info("creating content for " + contentId);
                return [2 /*return*/, this.contentStorage.addContent(metadata, content, user, contentId)];
            });
        });
    };
    /**
     * Deletes a piece of content and all files dependent on it.
     * @param contentId the piece of content to delete
     * @param user the user who wants to delete it
     */
    ContentManager.prototype.deleteContent = function (contentId, user) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.contentStorage.deleteContent(contentId, user)];
            });
        });
    };
    /**
     * Deletes a file from a content object.
     * @param contentId the content object the file is attached to
     * @param filename the file to delete
     */
    ContentManager.prototype.deleteContentFile = function (contentId, filename) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.contentStorage.deleteFile(contentId, filename)];
            });
        });
    };
    /**
     * Returns a readable stream of a content file (e.g. image or video) inside a piece of content
     * @param contentId the id of the content object that the file is attached to
     * @param filename the filename of the file to get
     * @param user the user who wants to retrieve the content file
     * @param rangeStart (optional) the position in bytes at which the stream should start
     * @param rangeEnd (optional) the position in bytes at which the stream should end
     * @returns
     */
    ContentManager.prototype.getContentFileStream = function (contentId, filename, user, rangeStart, rangeEnd) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                log.debug("loading " + filename + " for " + contentId);
                return [2 /*return*/, this.contentStorage.getFileStream(contentId, filename, user, rangeStart, rangeEnd)];
            });
        });
    };
    /**
     * Returns the metadata (=contents of h5p.json) of a piece of content.
     * @param contentId the content id
     * @param user The user who wants to access the content
     * @returns
     */
    ContentManager.prototype.getContentMetadata = function (contentId, user) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = ContentMetadata_1.ContentMetadata.bind;
                        return [4 /*yield*/, this.contentStorage.getMetadata(contentId, user)];
                    case 1: 
                    // We don't directly return the h5p.json file content as
                    // we have to make sure it conforms to the schema.
                    return [2 /*return*/, new (_a.apply(ContentMetadata_1.ContentMetadata, [void 0, _b.sent()]))()];
                }
            });
        });
    };
    /**
     * Returns the content object (=contents of content/content.json) of a piece of content.
     * @param contentId the content id
     * @param user The user who wants to access the content
     * @returns
     */
    ContentManager.prototype.getContentParameters = function (contentId, user) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.contentStorage.getParameters(contentId, user)];
            });
        });
    };
    /**
     * Returns an array of permissions a user has on a piece of content.
     * @param contentId the content to check
     * @param user the user who wants to access the piece of content
     * @returns an array of permissions
     */
    ContentManager.prototype.getUserPermissions = function (contentId, user) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                log.info("checking user permissions for " + contentId);
                return [2 /*return*/, this.contentStorage.getUserPermissions(contentId, user)];
            });
        });
    };
    /**
     * Lists the content objects in the system (if no user is specified) or owned by the user.
     * @param user (optional) the user who owns the content
     * @returns a list of contentIds
     */
    ContentManager.prototype.listContent = function (user) {
        return this.contentStorage.listContent(user);
    };
    /**
     * Gets the filenames of files added to the content with addContentFile(...) (e.g. images, videos or other files)
     * @param contentId the piece of content
     * @param user the user who wants to access the piece of content
     * @returns a list of files that are used in the piece of content, e.g. ['image1.png', 'video2.mp4']
     */
    ContentManager.prototype.listContentFiles = function (contentId, user) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                log.info("loading content files for " + contentId);
                return [2 /*return*/, this.contentStorage.listFiles(contentId, user)];
            });
        });
    };
    return ContentManager;
}());
exports["default"] = ContentManager;
//# sourceMappingURL=ContentManager.js.map