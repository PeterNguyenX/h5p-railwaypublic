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
/**
 * Stores libraries in a directory.
 */
var FileLibraryStorage = /** @class */ (function () {
    /**
     * @param librariesDirectory The path of the directory in the file system at which libraries are stored.
     */
    function FileLibraryStorage(librariesDirectory) {
        this.librariesDirectory = librariesDirectory;
        /**
         * Files with this pattern are not returned when listing the directory contents. Can be used by classes
         * extending FileLibraryStorage to hide internals.
         */
        this.ignoredFilePatterns = [];
        fs_extra_1["default"].ensureDirSync(librariesDirectory);
    }
    /**
     * Gets the directory path of the specified library.
     * @param library
     * @returns the absolute path to the directory
     */
    FileLibraryStorage.prototype.getDirectoryPath = function (library) {
        return path_1["default"].join(this.getLibrariesDirectory(), src_1.LibraryName.toUberName(library));
    };
    /**
     * Gets the path of any file of the specified library.
     * @param library
     * @param filename
     * @returns the absolute path to the file
     */
    FileLibraryStorage.prototype.getFilePath = function (library, filename) {
        return path_1["default"].join(this.getLibrariesDirectory(), src_1.LibraryName.toUberName(library), filename);
    };
    /**
     * Get the base path of the libraries
     * @returns the base library path
     */
    FileLibraryStorage.prototype.getLibrariesDirectory = function () {
        return this.librariesDirectory;
    };
    /**
     * Adds a library file to a library. The library metadata must have been installed with installLibrary(...) first.
     * Throws an error if something unexpected happens.
     * @param library The library that is being installed
     * @param filename Filename of the file to add, relative to the library root
     * @param stream The stream containing the file content
     * @returns true if successful
     */
    FileLibraryStorage.prototype.addFile = function (library, filename, stream) {
        return __awaiter(this, void 0, void 0, function () {
            var fullPath, writeStream;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filenameUtils_1.checkFilename(filename);
                        return [4 /*yield*/, this.libraryExists(library)];
                    case 1:
                        if (!(_a.sent())) {
                            throw new src_1.H5pError('storage-file-implementations:add-library-file-not-installed', { filename: filename, libraryName: src_1.LibraryName.toUberName(library) }, 500);
                        }
                        fullPath = this.getFilePath(library, filename);
                        return [4 /*yield*/, fs_extra_1["default"].ensureDir(path_1["default"].dirname(fullPath))];
                    case 2:
                        _a.sent();
                        writeStream = fs_extra_1["default"].createWriteStream(fullPath);
                        return [4 /*yield*/, promisepipe_1["default"](stream, writeStream)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    /**
     * Adds the metadata of the library to the repository.
     * Throws errors if something goes wrong.
     * @param libraryMetadata The library metadata object (= content of library.json)
     * @param restricted True if the library can only be used be users allowed to install restricted libraries.
     * @returns The newly created library object to use when adding library files with addFile(...)
     */
    FileLibraryStorage.prototype.addLibrary = function (libraryMetadata, restricted) {
        if (restricted === void 0) { restricted = false; }
        return __awaiter(this, void 0, void 0, function () {
            var library, libPath, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        library = new src_1.InstalledLibrary(libraryMetadata.machineName, libraryMetadata.majorVersion, libraryMetadata.minorVersion, libraryMetadata.patchVersion, restricted);
                        libPath = this.getDirectoryPath(library);
                        return [4 /*yield*/, fs_extra_1["default"].pathExists(libPath)];
                    case 1:
                        if (_a.sent()) {
                            throw new src_1.H5pError('storage-file-implementations:install-library-already-installed', {
                                libraryName: src_1.LibraryName.toUberName(library)
                            });
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 7]);
                        return [4 /*yield*/, fs_extra_1["default"].ensureDir(libPath)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, fs_extra_1["default"].writeJSON(this.getFilePath(library, 'library.json'), libraryMetadata)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, library];
                    case 5:
                        error_1 = _a.sent();
                        return [4 /*yield*/, fs_extra_1["default"].remove(libPath)];
                    case 6:
                        _a.sent();
                        throw error_1;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Removes all files of a library. Doesn't delete the library metadata. (Used when updating libraries.)
     * @param library the library whose files should be deleted
     * @returns
     */
    FileLibraryStorage.prototype.clearFiles = function (library) {
        return __awaiter(this, void 0, void 0, function () {
            var fullLibraryPath, directoryEntries;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.libraryExists(library)];
                    case 1:
                        if (!(_a.sent())) {
                            throw new src_1.H5pError('storage-file-implementations:clear-library-not-found', {
                                libraryName: src_1.LibraryName.toUberName(library)
                            });
                        }
                        fullLibraryPath = this.getDirectoryPath(library);
                        return [4 /*yield*/, fs_extra_1["default"].readdir(fullLibraryPath)];
                    case 2:
                        directoryEntries = (_a.sent()).filter(function (entry) { return entry !== 'library.json'; });
                        return [4 /*yield*/, Promise.all(directoryEntries.map(function (entry) {
                                return fs_extra_1["default"].remove(_this.getFilePath(library, entry));
                            }))];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Removes the library and all its files from the repository.
     * Throws errors if something went wrong.
     * @param library The library to remove.
     * @returns
     */
    FileLibraryStorage.prototype.deleteLibrary = function (library) {
        return __awaiter(this, void 0, void 0, function () {
            var libPath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        libPath = this.getDirectoryPath(library);
                        return [4 /*yield*/, fs_extra_1["default"].pathExists(libPath)];
                    case 1:
                        if (!(_a.sent())) {
                            throw new src_1.H5pError('storage-file-implementations:remove-library-library-missing', { libraryName: src_1.LibraryName.toUberName(library) }, 404);
                        }
                        return [4 /*yield*/, fs_extra_1["default"].remove(libPath)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if the library contains a file
     * @param library The library to check
     * @param filename
     * @returns true if file exists in library, false otherwise
     */
    FileLibraryStorage.prototype.fileExists = function (library, filename) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                filenameUtils_1.checkFilename(filename);
                if (this.isIgnored(filename)) {
                    return [2 /*return*/, false];
                }
                return [2 /*return*/, fs_extra_1["default"].pathExists(this.getFilePath(library, filename))];
            });
        });
    };
    /**
     * Counts how often libraries are listed in the dependencies of other
     * libraries and returns a list of the number.
     * @returns an object with ubernames as key.
     * Example:
     * {
     *   'H5P.Example': 10
     * }
     * This means that H5P.Example is used by 10 other libraries.
     */
    FileLibraryStorage.prototype.getAllDependentsCount = function () {
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function () {
            var librariesNames, librariesMetadata, librariesMetadataMap, _loop_1, _i, librariesMetadata_1, libraryMetadata, dependencies, _g, librariesMetadata_2, libraryMetadata, _h, _j, dependency, ubername;
            var _this = this;
            return __generator(this, function (_k) {
                switch (_k.label) {
                    case 0: return [4 /*yield*/, this.getInstalledLibraryNames()];
                    case 1:
                        librariesNames = _k.sent();
                        return [4 /*yield*/, Promise.all(librariesNames.map(function (lib) { return _this.getLibrary(lib); }))];
                    case 2:
                        librariesMetadata = _k.sent();
                        librariesMetadataMap = librariesMetadata.reduce(function (prev, curr) {
                            prev[src_1.LibraryName.toUberName(curr)] = curr;
                            return prev;
                        }, {});
                        _loop_1 = function (libraryMetadata) {
                            for (var _i = 0, _a = (_a = libraryMetadata.editorDependencies) !== null && _a !== void 0 ? _a : []; _i < _a.length; _i++) {
                                var dependency = _a[_i];
                                var ubername = src_1.LibraryName.toUberName(dependency);
                                var index = (_b = librariesMetadataMap[ubername].preloadedDependencies) === null || _b === void 0 ? void 0 : _b.findIndex(function (ln) {
                                    return src_1.LibraryName.equal(ln, libraryMetadata);
                                });
                                if (index >= 0) {
                                    librariesMetadataMap[ubername].preloadedDependencies.splice(index, 1);
                                }
                            }
                        };
                        // Remove circular dependencies caused by editor dependencies in
                        // content types like H5P.InteractiveVideo.
                        for (_i = 0, librariesMetadata_1 = librariesMetadata; _i < librariesMetadata_1.length; _i++) {
                            libraryMetadata = librariesMetadata_1[_i];
                            _loop_1(libraryMetadata);
                        }
                        dependencies = {};
                        for (_g = 0, librariesMetadata_2 = librariesMetadata; _g < librariesMetadata_2.length; _g++) {
                            libraryMetadata = librariesMetadata_2[_g];
                            for (_h = 0, _j = ((_c = libraryMetadata.preloadedDependencies) !== null && _c !== void 0 ? _c : [])
                                .concat((_d = libraryMetadata.editorDependencies) !== null && _d !== void 0 ? _d : [])
                                .concat((_e = libraryMetadata.dynamicDependencies) !== null && _e !== void 0 ? _e : []); _h < _j.length; _h++) {
                                dependency = _j[_h];
                                ubername = src_1.LibraryName.toUberName(dependency);
                                dependencies[ubername] = ((_f = dependencies[ubername]) !== null && _f !== void 0 ? _f : 0) + 1;
                            }
                        }
                        return [2 /*return*/, dependencies];
                }
            });
        });
    };
    /**
     * Returns the number of libraries that depend on this (single) library.
     * @param library the library to check
     * @returns the number of libraries that depend on this library.
     */
    FileLibraryStorage.prototype.getDependentsCount = function (library) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var allDependencies;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getAllDependentsCount()];
                    case 1:
                        allDependencies = _b.sent();
                        return [2 /*return*/, (_a = allDependencies[src_1.LibraryName.toUberName(library)]) !== null && _a !== void 0 ? _a : 0];
                }
            });
        });
    };
    /**
     * Returns a information about a library file.
     * Throws an exception if the file does not exist.
     * @param library library
     * @param filename the relative path inside the library
     * @returns the file stats
     */
    FileLibraryStorage.prototype.getFileStats = function (library, filename) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.fileExists(library, filename)];
                    case 1:
                        if (!(_a.sent()) ||
                            this.isIgnored(filename)) {
                            throw new src_1.H5pError('library-file-missing', {
                                filename: filename,
                                library: src_1.LibraryName.toUberName(library)
                            }, 404);
                        }
                        return [2 /*return*/, fs_extra_1["default"].stat(this.getFilePath(library, filename))];
                }
            });
        });
    };
    /**
     * Returns a readable stream of a library file's contents.
     * Throws an exception if the file does not exist.
     * @param library library
     * @param filename the relative path inside the library
     * @returns a readable stream of the file's contents
     */
    FileLibraryStorage.prototype.getFileStream = function (library, filename) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.fileExists(library, filename)];
                    case 1:
                        if (!(_a.sent()) ||
                            this.isIgnored(filename)) {
                            throw new src_1.H5pError('library-file-missing', {
                                filename: filename,
                                library: src_1.LibraryName.toUberName(library)
                            }, 404);
                        }
                        return [2 /*return*/, fs_extra_1["default"].createReadStream(this.getFilePath(library, filename))];
                }
            });
        });
    };
    /**
     * Returns all installed libraries or the installed libraries that have the machine names in the arguments.
     * @param {...string[]} machineNames (optional) only return libraries that have these machine names
     * @returns the libraries installed
     */
    FileLibraryStorage.prototype.getInstalledLibraryNames = function () {
        var machineNames = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            machineNames[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var nameRegex, libraryDirectories;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nameRegex = /^([\w\.]+)-(\d+)\.(\d+)$/i;
                        return [4 /*yield*/, fs_extra_1["default"].readdir(this.getLibrariesDirectory())];
                    case 1:
                        libraryDirectories = _a.sent();
                        return [2 /*return*/, libraryDirectories
                                .filter(function (name) { return nameRegex.test(name); })
                                .map(function (name) {
                                return src_1.LibraryName.fromUberName(name);
                            })
                                .filter(function (lib) {
                                return !machineNames ||
                                    machineNames.length === 0 ||
                                    machineNames.some(function (mn) { return mn === lib.machineName; });
                            })];
                }
            });
        });
    };
    /**
     * Gets a list of installed language files for the library.
     * @param library The library to get the languages for
     * @returns The list of JSON files in the language folder (without the extension .json)
     */
    FileLibraryStorage.prototype.getLanguages = function (library) {
        return __awaiter(this, void 0, void 0, function () {
            var files;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fs_extra_1["default"].readdir(this.getFilePath(library, 'language'))];
                    case 1:
                        files = _a.sent();
                        return [2 /*return*/, files
                                .filter(function (file) { return path_1["default"].extname(file) === '.json'; })
                                .map(function (file) { return path_1["default"].basename(file, '.json'); })];
                }
            });
        });
    };
    /**
     * Gets the library metadata (= content of library.json) of the library.
     * @param library the library
     * @returns the metadata
     */
    FileLibraryStorage.prototype.getLibrary = function (library) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, this.libraryExists(library)];
                    case 1:
                        if (!(_f.sent())) {
                            throw new src_1.H5pError('storage-file-implementations:get-library-metadata-not-installed', { libraryName: src_1.LibraryName.toUberName(library) }, 404);
                        }
                        _b = (_a = src_1.InstalledLibrary).fromMetadata;
                        _d = (_c = JSON).parse;
                        _e = StreamHelpers_1.streamToString;
                        return [4 /*yield*/, this.getFileStream(library, 'library.json')];
                    case 2: return [4 /*yield*/, _e.apply(void 0, [_f.sent()])];
                    case 3: return [2 /*return*/, _b.apply(_a, [_d.apply(_c, [_f.sent()])])];
                }
            });
        });
    };
    /**
     * Checks if a library is installed in the system.
     * @param library the library to check
     * @returns true if installed, false if not
     */
    FileLibraryStorage.prototype.isInstalled = function (library) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, fs_extra_1["default"].pathExists(this.getFilePath(library, 'library.json'))];
            });
        });
    };
    /**
     * Checks if the library has been installed.
     * @param name the library name
     * @returns true if the library has been installed
     */
    FileLibraryStorage.prototype.libraryExists = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, fs_extra_1["default"].pathExists(this.getDirectoryPath(name))];
            });
        });
    };
    /**
     * Returns a list of library addons that are installed in the system.
     * Addons are libraries that have the property 'addTo' in their metadata.
     */
    FileLibraryStorage.prototype.listAddons = function () {
        return __awaiter(this, void 0, void 0, function () {
            var installedLibraries;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getInstalledLibraryNames()];
                    case 1:
                        installedLibraries = _a.sent();
                        return [4 /*yield*/, Promise.all(installedLibraries.map(function (addonName) {
                                return _this.getLibrary(addonName);
                            }))];
                    case 2: return [2 /*return*/, (_a.sent()).filter(function (library) { return library.addTo !== undefined; })];
                }
            });
        });
    };
    /**
     * Gets a list of all library files that exist for this library.
     * @param library
     * @returns all files that exist for the library
     */
    FileLibraryStorage.prototype.listFiles = function (library) {
        return __awaiter(this, void 0, void 0, function () {
            var libPath;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        libPath = this.getDirectoryPath(library);
                        return [4 /*yield*/, glob_promise_1["default"](path_1["default"].join(libPath, '**/*.*'))];
                    case 1: return [2 /*return*/, (_a.sent())
                            .map(function (p) { return path_1["default"].relative(libPath, p); })
                            .filter(function (p) { return !_this.isIgnored(p); })];
                }
            });
        });
    };
    /**
     * Updates the additional metadata properties that is added to the
     * stored libraries. This metadata can be used to customize behavior like
     * restricting libraries to specific users.
     * @param library the library for which the metadata should be updated
     * @param additionalMetadata the metadata to update
     * @returns true if the additionalMetadata object contained real changes
     * and if they were successfully saved; false if there were not changes.
     * Throws an error if saving was not possible.
     */
    FileLibraryStorage.prototype.updateAdditionalMetadata = function (library, additionalMetadata) {
        return __awaiter(this, void 0, void 0, function () {
            var metadata, dirty, _i, _a, property, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getLibrary(library)];
                    case 1:
                        metadata = _b.sent();
                        dirty = false;
                        for (_i = 0, _a = Object.keys(additionalMetadata); _i < _a.length; _i++) {
                            property = _a[_i];
                            if (additionalMetadata[property] !== metadata[property]) {
                                metadata[property] = additionalMetadata[property];
                                dirty = true;
                            }
                        }
                        if (!dirty) {
                            return [2 /*return*/, false];
                        }
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, fs_extra_1["default"].writeJSON(this.getFilePath(library, 'library.json'), metadata)];
                    case 3:
                        _b.sent();
                        return [2 /*return*/, true];
                    case 4:
                        error_2 = _b.sent();
                        throw new src_1.H5pError('storage-file-implementations:error-updating-metadata', {
                            library: src_1.LibraryName.toUberName(library),
                            error: error_2.message
                        }, 500);
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Updates the library metadata.
     * This is necessary when updating to a new patch version.
     * You also need to call clearFiles(...) to remove all old files
     * during the update process and addFile(...) to add the files of
     * the patch.
     * @param libraryMetadata the new library metadata
     * @returns The updated library object
     */
    FileLibraryStorage.prototype.updateLibrary = function (libraryMetadata) {
        return __awaiter(this, void 0, void 0, function () {
            var libPath, newLibrary;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        libPath = this.getDirectoryPath(libraryMetadata);
                        return [4 /*yield*/, fs_extra_1["default"].pathExists(libPath)];
                    case 1:
                        if (!(_a.sent())) {
                            throw new src_1.H5pError('storage-file-implementations:update-library-library-missing', { libraryName: src_1.LibraryName.toUberName(libraryMetadata) }, 404);
                        }
                        return [4 /*yield*/, fs_extra_1["default"].writeJSON(this.getFilePath(libraryMetadata, 'library.json'), libraryMetadata)];
                    case 2:
                        _a.sent();
                        newLibrary = src_1.InstalledLibrary.fromMetadata(libraryMetadata);
                        return [2 /*return*/, newLibrary];
                }
            });
        });
    };
    /**
     * Checks if a filename is in the ignore list.
     * @param filename the filename to check
     */
    FileLibraryStorage.prototype.isIgnored = function (filename) {
        return this.ignoredFilePatterns.some(function (pattern) {
            return pattern.test(filename);
        });
    };
    return FileLibraryStorage;
}());
exports["default"] = FileLibraryStorage;
//# sourceMappingURL=FileLibraryStorage.js.map