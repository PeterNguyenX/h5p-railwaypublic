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
var stream_1 = require("stream");
var yazl_1 = __importDefault(require("yazl"));
var upath_1 = __importDefault(require("upath"));
var DependencyGetter_1 = __importDefault(require("./DependencyGetter"));
var H5pError_1 = __importDefault(require("./helpers/H5pError"));
var LibraryName_1 = __importDefault(require("./LibraryName"));
var types_1 = require("./types");
var ContentFileScanner_1 = require("./ContentFileScanner");
var Logger_1 = __importDefault(require("./helpers/Logger"));
var LibraryManager_1 = __importDefault(require("./LibraryManager"));
var FilenameGenerator_1 = __importDefault(require("./helpers/FilenameGenerator"));
var utils_1 = require("./implementation/utils");
var log = new Logger_1["default"]('PackageExporter');
/**
 * Offers functionality to create .h5p files from content that is stored in the system.
 */
var PackageExporter = /** @class */ (function () {
    /**
     * @param libraryStorage
     * @param contentStorage (optional) Only needed if you want to use the PackageExporter to copy content from a package (e.g. Upload option in the editor)
     */
    function PackageExporter(libraryStorage, contentStorage, _a) {
        if (contentStorage === void 0) { contentStorage = null; }
        var exportMaxContentPathLength = _a.exportMaxContentPathLength;
        this.libraryStorage = libraryStorage;
        this.contentStorage = contentStorage;
        log.info("initialize");
        this.maxContentPathLength = exportMaxContentPathLength !== null && exportMaxContentPathLength !== void 0 ? exportMaxContentPathLength : 255;
    }
    /**
     * Creates a .h5p-package for the specified content file and pipes it to the stream.
     * Throws H5pErrors if something goes wrong. The contents of the stream should be disregarded then.
     * @param contentId The contentId for which the package should be created.
     * @param outputStream The stream that the package is written to (e.g. the response stream fo Express)
     */
    PackageExporter.prototype.createPackage = function (contentId, outputStream, user) {
        return __awaiter(this, void 0, void 0, function () {
            var outputZipFile, parameters, _a, metadata, metadataStream, substitutions, contentStream;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        log.info("creating package for " + contentId);
                        return [4 /*yield*/, this.checkAccess(contentId, user)];
                    case 1:
                        _b.sent();
                        outputZipFile = new yazl_1["default"].ZipFile();
                        outputZipFile.outputStream.pipe(outputStream);
                        return [4 /*yield*/, this.contentStorage.getParameters(contentId, user)];
                    case 2:
                        parameters = _b.sent();
                        return [4 /*yield*/, this.getMetadata(contentId, user)];
                    case 3:
                        _a = _b.sent(), metadata = _a.metadata, metadataStream = _a.metadataStream;
                        return [4 /*yield*/, this.shortenFilenames(parameters, metadata, this.maxContentPathLength)];
                    case 4:
                        substitutions = _b.sent();
                        return [4 /*yield*/, this.createContentFileStream(parameters)];
                    case 5:
                        contentStream = _b.sent();
                        outputZipFile.addReadStream(contentStream, 'content/content.json');
                        outputZipFile.addReadStream(metadataStream, 'h5p.json');
                        // add content file (= files in content directory)
                        return [4 /*yield*/, this.addContentFiles(contentId, user, outputZipFile, substitutions)];
                    case 6:
                        // add content file (= files in content directory)
                        _b.sent();
                        // add library files
                        return [4 /*yield*/, this.addLibraryFiles(metadata, outputZipFile)];
                    case 7:
                        // add library files
                        _b.sent();
                        // signal the end of zip creation
                        outputZipFile.end();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Adds the files inside the content directory to the zip file. Does not include content.json!
     * @param contentId the contentId of the content
     * @param user the user who wants to export
     * @param outputZipFile the file to write to
     * @param pathSubstitutions list of unix (!) paths to files whose paths were
     * changed in the parameters; this means the paths in the zip file must
     * be changed accordingly
     */
    PackageExporter.prototype.addContentFiles = function (contentId, user, outputZipFile, pathSubstitutions) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var contentFiles, _i, contentFiles_1, contentFile, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        log.info("adding content files to " + contentId);
                        return [4 /*yield*/, this.contentStorage.listFiles(contentId, user)];
                    case 1:
                        contentFiles = _d.sent();
                        _i = 0, contentFiles_1 = contentFiles;
                        _d.label = 2;
                    case 2:
                        if (!(_i < contentFiles_1.length)) return [3 /*break*/, 5];
                        contentFile = contentFiles_1[_i];
                        _c = (_b = outputZipFile).addReadStream;
                        return [4 /*yield*/, this.contentStorage.getFileStream(contentId, contentFile, user)];
                    case 3:
                        _c.apply(_b, [_d.sent(),
                            "content/" + ((_a = pathSubstitutions[upath_1["default"].toUnix(contentFile)]) !== null && _a !== void 0 ? _a : contentFile)]);
                        _d.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Adds the library files to the zip file that are required for the content to be playable.
     */
    PackageExporter.prototype.addLibraryFiles = function (metadata, outputZipFile) {
        return __awaiter(this, void 0, void 0, function () {
            var dependencyGetter, dependencies, _i, dependencies_1, dependency, files, _a, files_1, file, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        log.info("adding library files");
                        dependencyGetter = new DependencyGetter_1["default"](this.libraryStorage);
                        return [4 /*yield*/, dependencyGetter.getDependentLibraries(metadata.preloadedDependencies
                                .concat(metadata.editorDependencies || [])
                                .concat(metadata.dynamicDependencies || []), { editor: true, preloaded: true })];
                    case 1:
                        dependencies = _d.sent();
                        _i = 0, dependencies_1 = dependencies;
                        _d.label = 2;
                    case 2:
                        if (!(_i < dependencies_1.length)) return [3 /*break*/, 8];
                        dependency = dependencies_1[_i];
                        return [4 /*yield*/, this.libraryStorage.listFiles(dependency)];
                    case 3:
                        files = _d.sent();
                        _a = 0, files_1 = files;
                        _d.label = 4;
                    case 4:
                        if (!(_a < files_1.length)) return [3 /*break*/, 7];
                        file = files_1[_a];
                        _c = (_b = outputZipFile).addReadStream;
                        return [4 /*yield*/, this.libraryStorage.getFileStream(dependency, file)];
                    case 5:
                        _c.apply(_b, [_d.sent(),
                            LibraryName_1["default"].toUberName(dependency) + "/" + file]);
                        _d.label = 6;
                    case 6:
                        _a++;
                        return [3 /*break*/, 4];
                    case 7:
                        _i++;
                        return [3 /*break*/, 2];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Checks if a piece of content exists and if the user has download permissions for it.
     * Throws an exception with the respective error message if this is not the case.
     */
    PackageExporter.prototype.checkAccess = function (contentId, user) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.contentStorage.contentExists(contentId)];
                    case 1:
                        if (!(_a.sent())) {
                            throw new H5pError_1["default"]('download-content-not-found', { contentId: contentId }, 404);
                        }
                        return [4 /*yield*/, this.contentStorage.getUserPermissions(contentId, user)];
                    case 2:
                        if (!(_a.sent()).some(function (p) { return p === types_1.Permission.Download; })) {
                            throw new H5pError_1["default"]('download-content-forbidden', { contentId: contentId }, 403);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a readable stream for the content.json file
     */
    PackageExporter.prototype.createContentFileStream = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var contentStream;
            return __generator(this, function (_a) {
                try {
                    contentStream = new stream_1.Readable();
                    contentStream._read = function () {
                        return;
                    };
                    contentStream.push(JSON.stringify(parameters));
                    contentStream.push(null);
                }
                catch (error) {
                    throw new H5pError_1["default"]('download-content-unreadable-data');
                }
                return [2 /*return*/, contentStream];
            });
        });
    };
    /**
     * Gets the metadata for the piece of content (h5p.json) and also creates a file stream for it.
     */
    PackageExporter.prototype.getMetadata = function (contentId, user) {
        return __awaiter(this, void 0, void 0, function () {
            var metadataStream, metadata, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.contentStorage.getMetadata(contentId, user)];
                    case 1:
                        metadata = _a.sent();
                        metadataStream = new stream_1.Readable();
                        metadataStream._read = function () {
                            return;
                        };
                        metadataStream.push(JSON.stringify(metadata));
                        metadataStream.push(null);
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        throw new H5pError_1["default"]('download-content-unreadable-metadata');
                    case 3: return [2 /*return*/, { metadata: metadata, metadataStream: metadataStream }];
                }
            });
        });
    };
    /**
     * Scans the parameters of the piece of content and looks for paths that are
     * longed than the specified max length. If this happens the filenames are
     * shortened in the parameters and the substitution is returned in the
     * substitution list
     * @param parameters the parameters to scan; IMPORTANT: The parameters are
     * mutated by this method!!!
     * @param metadata the metadata of the piece of content
     * @param maxFilenameLength the maximum acceptable filename length
     * @returns an object whose keys are old paths and values the new paths to
     * be used instead; IMPORTANT: All paths are unix paths using slashes as
     * directory separators!
     */
    PackageExporter.prototype.shortenFilenames = function (parameters, metadata, maxFilenameLength) {
        return __awaiter(this, void 0, void 0, function () {
            var substitutions, usedFilenames, contentScanner, files, _i, files_2, file, newFilename;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        substitutions = {};
                        usedFilenames = {};
                        contentScanner = new ContentFileScanner_1.ContentFileScanner(new LibraryManager_1["default"](this.libraryStorage));
                        return [4 /*yield*/, contentScanner.scanForFiles(parameters, metadata.preloadedDependencies.find(function (dep) { return dep.machineName === metadata.mainLibrary; }))];
                    case 1:
                        files = _a.sent();
                        _i = 0, files_2 = files;
                        _a.label = 2;
                    case 2:
                        if (!(_i < files_2.length)) return [3 /*break*/, 6];
                        file = files_2[_i];
                        if (!(file.filePath.length >= maxFilenameLength)) return [3 /*break*/, 4];
                        return [4 /*yield*/, FilenameGenerator_1["default"](file.filePath, function (filenameToCheck) {
                                return utils_1.generalizedSanitizeFilename(filenameToCheck, new RegExp(''), maxFilenameLength - 17 // 9 for shortid and and 8
                                // for content/ prefix of path in package
                                );
                            }, function (fileToCheck) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, usedFilenames[fileToCheck]];
                            }); }); })];
                    case 3:
                        newFilename = _a.sent();
                        substitutions[file.filePath] = newFilename;
                        file.context.params.path = newFilename;
                        usedFilenames[newFilename] = true;
                        return [3 /*break*/, 5];
                    case 4:
                        usedFilenames[file.filePath] = true;
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 2];
                    case 6: return [2 /*return*/, substitutions];
                }
            });
        });
    };
    return PackageExporter;
}());
exports["default"] = PackageExporter;
//# sourceMappingURL=PackageExporter.js.map