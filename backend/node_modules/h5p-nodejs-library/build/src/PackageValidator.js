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
var ajv_1 = __importDefault(require("ajv"));
var ajv_keywords_1 = __importDefault(require("ajv-keywords"));
var path = __importStar(require("path"));
var promisepipe_1 = __importDefault(require("promisepipe"));
var stream_buffers_1 = require("stream-buffers");
var yauzlPromise = __importStar(require("yauzl-promise"));
var AggregateH5pError_1 = __importDefault(require("./helpers/AggregateH5pError"));
var H5pError_1 = __importDefault(require("./helpers/H5pError"));
var Logger_1 = __importDefault(require("./helpers/Logger"));
var StringFormatter_1 = require("./helpers/StringFormatter");
var ValidatorBuilder_1 = require("./helpers/ValidatorBuilder");
var log = new Logger_1["default"]('PackageValidator');
/**
 * Performs checks if uploaded H5P packages or those from the H5P Hub are valid.
 * Call await validatePackage(...) to perform these checks.
 *
 * The validator currently does not check if all necessary library versions will be present after performing
 * an upgrade (done in ll. 968 - 1032 of h5p.classes.php). This is not done because it would require enumerating
 * all installed libraries and this is not possible in the extractor without introducing a dependency to the
 * core.
 *
 * REMARK: Note that the validator operates on zip files and thus has to use slashes (/) in paths regardless of the
 * operating system!
 */
var PackageValidator = /** @class */ (function () {
    /**
     * @param configurationValues Object containing all required configuration parameters
     */
    function PackageValidator(config) {
        var _this = this;
        this.config = config;
        this.libraryDirectoryNameRegex = /^[\w0-9\-.]{1,255}$/i;
        /**
         * Checks file sizes (single files and all files combined)
         * Does NOT throw errors but appends them to the error object.
         * @param zipEntries The entries inside the h5p file
         * @param error The error object to use
         * @returns The unchanged zip entries
         */
        this.fileSizeMustBeWithinLimits = function (zipEntries, error) { return __awaiter(_this, void 0, void 0, function () {
            var totalFileSize, _i, zipEntries_1, entry;
            return __generator(this, function (_a) {
                log.debug("checking if file sizes exceed limit");
                totalFileSize = 0;
                if (this.config.maxFileSize) {
                    for (_i = 0, zipEntries_1 = zipEntries; _i < zipEntries_1.length; _i++) {
                        entry = zipEntries_1[_i];
                        totalFileSize += entry.uncompressedSize;
                        if (entry.uncompressedSize > this.config.maxFileSize) {
                            log.error("file " + entry.fileName + " exceeds limit");
                            error.addError(new H5pError_1["default"]('file-size-too-large', {
                                file: entry.fileName,
                                max: StringFormatter_1.formatBytes(this.config.maxFileSize),
                                used: StringFormatter_1.formatBytes(entry.uncompressedSize)
                            }));
                        }
                    }
                }
                if (this.config.maxTotalSize &&
                    totalFileSize > this.config.maxTotalSize) {
                    log.error("total size is too large");
                    error.addError(new H5pError_1["default"]('total-size-too-large', {
                        max: StringFormatter_1.formatBytes(this.config.maxTotalSize),
                        used: StringFormatter_1.formatBytes(totalFileSize)
                    }));
                }
                return [2 /*return*/, zipEntries];
            });
        }); };
        /**
         * Validates the libraries inside the package.
         * @param zipEntries The entries inside the h5p file
         * @param { AggregateH5pError} error The error object to use
         * @returns The unchanged zip entries
         */
        this.librariesMustBeValid = function (zipEntries, error) { return __awaiter(_this, void 0, void 0, function () {
            var topLevelDirectories;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.info("validating libraries inside package");
                        topLevelDirectories = PackageValidator.getTopLevelDirectories(zipEntries);
                        return [4 /*yield*/, Promise.all(topLevelDirectories
                                .filter(function (directory) { return directory !== 'content'; })
                                .map(function (directory) {
                                return _this.validateLibrary(zipEntries, directory, error);
                            }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, zipEntries];
                }
            });
        }); };
        /**
         * Checks if the language files in the library have the correct naming schema and are valid JSON.
         * @param zipEntries zip entries in the package
         * @param jsonData jsonData of the library.json file.
         * @param error The error object to use
         * @returns {Promise<{zipEntries: yauzlPromise.Entry[], jsonData: any}>} the unchanged data passed to the rule
         */
        this.libraryLanguageFilesMustBeValid = function (_a, error) {
            var zipEntries = _a.zipEntries, jsonData = _a.jsonData;
            return __awaiter(_this, void 0, void 0, function () {
                var uberName, languagePath, languageFileRegex, _i, _b, languageFileEntry, languageFileName, ignored_1;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            log.info("checking if language files in library " + jsonData.machineName + "-" + jsonData.majorVersion + "." + jsonData.minorVersion + " have the correct naming schema and are valid JSON");
                            uberName = jsonData.machineName + "-" + jsonData.majorVersion + "." + jsonData.minorVersion;
                            languagePath = PackageValidator.pathJoin(uberName, 'language/');
                            languageFileRegex = /^(-?[a-z]+){1,7}\.json$/i;
                            _i = 0, _b = zipEntries.filter(function (e) {
                                return e.fileName.startsWith(languagePath) &&
                                    !PackageValidator.isDirectory(e.fileName);
                            });
                            _c.label = 1;
                        case 1:
                            if (!(_i < _b.length)) return [3 /*break*/, 6];
                            languageFileEntry = _b[_i];
                            languageFileName = path.basename(languageFileEntry.fileName);
                            if (!languageFileRegex.test(languageFileName)) {
                                log.error(jsonData.machineName + "-" + jsonData.majorVersion + "." + jsonData.minorVersion + ": invalid language file");
                                error.addError(new H5pError_1["default"]('invalid-language-file', {
                                    file: languageFileName,
                                    library: uberName
                                }));
                            }
                            _c.label = 2;
                        case 2:
                            _c.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.tryParseJson(languageFileEntry)];
                        case 3:
                            _c.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            ignored_1 = _c.sent();
                            log.error(jsonData.machineName + "-" + jsonData.majorVersion + "." + jsonData.minorVersion + ": language json could not be parsed");
                            error.addError(new H5pError_1["default"]('invalid-language-file-json', {
                                file: languageFileName,
                                library: uberName
                            }));
                            return [3 /*break*/, 5];
                        case 5:
                            _i++;
                            return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, { zipEntries: zipEntries, jsonData: jsonData }];
                    }
                });
            });
        };
        /**
         * Checks if all JavaScript and CSS file references in the preloaded section of the library metadata are present in the package.
         * @param zipEntries zip entries in the package
         * @param jsonData data of the library.json file.
         * @param error The error object to use
         * @returns {Promise<{zipEntries: yauzlPromise.Entry[], jsonData: any}>} the unchanged data passed to the rule
         */
        this.libraryPreloadedFilesMustExist = function (_a, error) {
            var zipEntries = _a.zipEntries, jsonData = _a.jsonData;
            return __awaiter(_this, void 0, void 0, function () {
                var uberName;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            log.info("checking if all js and css file references in the preloaded section of the library metadata are present in package");
                            uberName = jsonData.machineName + "-" + jsonData.majorVersion + "." + jsonData.minorVersion;
                            if (!jsonData.preloadedJs) return [3 /*break*/, 2];
                            return [4 /*yield*/, Promise.all(jsonData.preloadedJs.map(function (file) {
                                    return _this.fileMustExist(PackageValidator.pathJoin(uberName, file.path), 'library-file-missing', false, { filename: file.path, library: uberName })(zipEntries, error);
                                }))];
                        case 1:
                            _b.sent();
                            _b.label = 2;
                        case 2:
                            if (!jsonData.preloadedCss) return [3 /*break*/, 4];
                            return [4 /*yield*/, Promise.all(jsonData.preloadedCss.map(function (file) {
                                    return _this.fileMustExist(PackageValidator.pathJoin(uberName, file.path), 'library-file-missing', false, { filename: file.path, library: uberName })(zipEntries, error);
                                }))];
                        case 3:
                            _b.sent();
                            _b.label = 4;
                        case 4: return [2 /*return*/, { zipEntries: zipEntries, jsonData: jsonData }];
                    }
                });
            });
        };
        /**
         * Checks if a library is compatible to the core version running.
         * Does not throw a ValidationError.
         * @param zipEntries zip entries in the package
         * @param jsonData jsonData of the library.json file.
         * @param error The error object to use
         * @returns {Promise<{zipEntries: yauzlPromise.Entry[], jsonData: any}>} the unchanged data passed to the rule
         */
        this.mustBeCompatibleToCoreVersion = function (_a, error) {
            var zipEntries = _a.zipEntries, jsonData = _a.jsonData;
            return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_b) {
                    log.info("checking if library is compatible with the core version running");
                    this.checkCoreVersion(jsonData, jsonData.machineName + "-" + jsonData.majorVersion + "." + jsonData.minorVersion, error);
                    return [2 /*return*/, { zipEntries: zipEntries, jsonData: jsonData }];
                });
            });
        };
        /**
         * Checks if the package file ends with .h5p.
         * Throws an error.
         * @param h5pFile Path to the h5p file
         * @param error The error object to use
         * @returns Unchanged path to the h5p file
         */
        this.mustHaveH5pExtension = function (h5pFile, error) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                log.info("checking if file extension is .h5p");
                if (path.extname(h5pFile).toLocaleLowerCase() !== '.h5p') {
                    log.error("file extension is not .h5p");
                    throw error.addError(new H5pError_1["default"]('missing-h5p-extension'));
                }
                return [2 /*return*/, h5pFile];
            });
        }); };
        /**
         * Makes sure the archive can be unzipped.
         * Throws an error.
         * @param h5pFile Path to the h5p file
         * @param error The error object to use
         * @returns The entries inside the zip archive
         */
        this.zipArchiveMustBeValid = function (h5pFile, error) { return __awaiter(_this, void 0, void 0, function () {
            var zipArchive;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PackageValidator.openZipArchive(h5pFile)];
                    case 1:
                        zipArchive = _a.sent();
                        if (!zipArchive) {
                            log.error("zip archive not valid");
                            throw error.addError(new H5pError_1["default"]('unable-to-unzip'));
                        }
                        return [2 /*return*/, zipArchive.readEntries()];
                }
            });
        }); };
        log.info("initialize");
        this.contentExtensionWhitelist = config.contentWhitelist.split(' ');
        this.libraryExtensionWhitelist = config.libraryWhitelist
            .split(' ')
            .concat(this.contentExtensionWhitelist);
    }
    /**
     * Returns a list of top-level directories in the zip file
     * @param zipEntries
     * @returns list of top-level directories
     */
    PackageValidator.getTopLevelDirectories = function (zipEntries) {
        log.verbose("getting top level directories " + zipEntries
            .map(function (entry) { return entry.fileName; })
            .join(', '));
        return Object.keys(zipEntries.reduce(function (directorySet, entry) {
            var split = entry.fileName.split('/');
            if (split.length > 1) {
                directorySet[split[0]] = true;
            }
            return directorySet;
        }, {}));
    };
    /**
     * Checks if the passed filename has an extension that is in the passed list.
     * @param filename The filename to check
     * @param allowedExtensions A list of extensions to check against
     */
    PackageValidator.isAllowedFileExtension = function (filename, allowedExtensions) {
        log.verbose("checking allowed file extension: " + filename + " - allowed extensions: " + allowedExtensions.join(', '));
        var actualExtension = path.extname(filename);
        if (actualExtension === '') {
            return false;
        }
        actualExtension = actualExtension.substr(1);
        if (allowedExtensions.some(function (allowedExtension) { return allowedExtension === actualExtension; })) {
            return true;
        }
        return false;
    };
    /**
     * Checks if a zip file path is a directory
     * @param p the path to check
     * @returns true if directory, false if not
     */
    PackageValidator.isDirectory = function (p) {
        log.debug("checking if " + p + " is a directory");
        return p.endsWith('/');
    };
    /**
     * Opens the zip archive.
     * @param file Path to file to open
     * @returns Zip archive object or undefined if zip file cannot be opened.
     */
    PackageValidator.openZipArchive = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var ignored_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        log.info("opening zip archive " + file);
                        return [4 /*yield*/, yauzlPromise.open(file, { lazyEntries: false })];
                    case 1: 
                    // we await the promise here because we want to catch the error and return undefined
                    return [2 /*return*/, _a.sent()];
                    case 2:
                        ignored_2 = _a.sent();
                        log.error("zip file " + file + " could not be opened: " + ignored_2);
                        return [2 /*return*/, undefined];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Similar to path.join(...) but uses slashes (/) as separators regardless of OS.
     * We have to use slashes when dealing with zip files as the specification for zips require them. If the program
     * runs on Windows path.join(...) uses backslashes \ which don't work for zip files.
     * @param parts The parts of the path to join
     * @returns the full path
     */
    PackageValidator.pathJoin = function () {
        var parts = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            parts[_i] = arguments[_i];
        }
        var separator = '/';
        var replace = new RegExp(separator + "{1,}", 'g');
        return parts.join(separator).replace(replace, separator);
    };
    /**
     * Validates the H5P package located at the path passed to the method.
     * @param h5pFile Path to H5P file to validate
     * @param checkContent If true, the method will check if the content in the package conforms to the standard
     * @param checkLibraries If true, the method will check if the libraries in the package conform to the standard
     * @returns true if the package is valid. Will throw Errors with the error in Error.message if there is a validation error.
     */
    PackageValidator.prototype.validatePackage = function (h5pFile, checkContent, checkLibraries) {
        if (checkContent === void 0) { checkContent = true; }
        if (checkLibraries === void 0) { checkLibraries = true; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.info("validating package " + h5pFile);
                        return [4 /*yield*/, this.initializeJsonValidators()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, new ValidatorBuilder_1.ValidatorBuilder()
                                .addRule(this.mustHaveH5pExtension)
                                .addRule(this.zipArchiveMustBeValid)
                                .addRule(this.fileSizeMustBeWithinLimits)
                                .addRule(this.filterOutEntries(function (entry) {
                                return path.basename(entry.fileName).startsWith('.') ||
                                    path.basename(entry.fileName).startsWith('_') ||
                                    path.basename(entry.fileName).endsWith('/');
                            }))
                                .addRuleWhen(this.fileExtensionMustBeAllowed(function (name) { return name.startsWith('content/'); }, this.contentExtensionWhitelist), checkContent)
                                .addRuleWhen(this.fileExtensionMustBeAllowed(function (name) {
                                return name.includes('/') && !name.startsWith('content/');
                            }, this.libraryExtensionWhitelist), checkLibraries)
                                .addRuleWhen(this.fileMustExist('h5p.json', 'invalid-h5p-json-file', true), checkContent)
                                .addRuleWhen(this.jsonMustConformToSchema('h5p.json', this.h5pMetadataValidator, 'invalid-h5p-json-file-2'), checkContent)
                                .addRuleWhen(this.fileMustExist('content/content.json', 'invalid-content-folder', true), checkContent)
                                .addRuleWhen(this.jsonMustBeParsable('content/content.json'), checkContent)
                                .addRule(ValidatorBuilder_1.throwErrorsNowRule)
                                .addRuleWhen(this.filesMustBeReadable(function (filePath) {
                                return filePath.startsWith('content/');
                            }), checkContent)
                                .addRuleWhen(this.librariesMustBeValid, checkLibraries)
                                .addRule(ValidatorBuilder_1.throwErrorsNowRule)
                                .addRule(this.returnTrue)
                                .validate(h5pFile)];
                }
            });
        });
    };
    /**
     * Checks if the core API version required in the metadata can be satisfied by the running instance.
     * @param {{coreApi: { majorVersion: number, minorVersion: number }}} metadata The object containing information about the required core version
     * @param libraryName The name of the library that is being checked.
     * @param error The error object.
     * @returns true if the core API required in the metadata can be satisfied by the running instance. Also true if the metadata doesn't require any core API version.
     */
    PackageValidator.prototype.checkCoreVersion = function (metadata, libraryName, error) {
        log.info("checking core version for " + libraryName);
        if (!metadata.coreApi ||
            !metadata.coreApi.majorVersion ||
            !metadata.coreApi.minorVersion) {
            return true;
        }
        if (metadata.coreApi.majorVersion > this.config.coreApiVersion.major ||
            (metadata.coreApi.majorVersion ===
                this.config.coreApiVersion.major &&
                metadata.coreApi.minorVersion >
                    this.config.coreApiVersion.minor)) {
            log.error("api version " + metadata.coreApi.majorVersion + "." + metadata.coreApi.minorVersion + " for " + libraryName + " not supported");
            error.addError(new H5pError_1["default"]('api-version-unsupported', {
                component: libraryName,
                current: this.config.coreApiVersion.major + "." + this.config.coreApiVersion.minor,
                required: metadata.coreApi.majorVersion + "." + metadata.coreApi.minorVersion
            }, 400));
        }
        return true;
    };
    /**
     * Factory for the file extension rule: Checks if the file extensions of the files in the array are
     * in the whitelists.
     * Does NOT throw errors but appends them to the error object.
     * @param {(arg: string) => boolean} filter The filter function must return true if the filename passed to it should be checked
     * @param whitelist The file extensions that are allowed for files that match the filter
     * @returns the rule
     */
    PackageValidator.prototype.fileExtensionMustBeAllowed = function (filter, whitelist) {
        var _this = this;
        return function (zipEntries, error) { return __awaiter(_this, void 0, void 0, function () {
            var _i, zipEntries_2, zipEntry, lowercaseName;
            return __generator(this, function (_a) {
                for (_i = 0, zipEntries_2 = zipEntries; _i < zipEntries_2.length; _i++) {
                    zipEntry = zipEntries_2[_i];
                    lowercaseName = zipEntry.fileName.toLocaleLowerCase();
                    // Skip files that aren't matched by the filter and directories
                    if (filter(lowercaseName) &&
                        !PackageValidator.isDirectory(zipEntry.fileName) &&
                        !PackageValidator.isAllowedFileExtension(lowercaseName, whitelist)) {
                        log.error("file extension " + zipEntry.fileName + " is not in whitelist: " + whitelist.join(', '));
                        error.addError(new H5pError_1["default"]('not-in-whitelist', {
                            filename: zipEntry.fileName,
                            'files-allowed': this.contentExtensionWhitelist.join(' ')
                        }));
                    }
                }
                return [2 /*return*/, zipEntries];
            });
        }); };
    };
    /**
     * Factory for a rule that makes sure that a certain file must exist.
     * Does NOT throw errors but appends them to the error object.
     * @param filename The filename that must exist among the zip entries (path, not case-sensitive)
     * @param errorId The error message that is used if the file does not exist
     * @param throwOnError (optional) If true, the rule will throw an error if the file does not exist.
     * @param errorReplacements (optional) The replacement variables to pass to the error.
     * @returns the rule
     */
    PackageValidator.prototype.fileMustExist = function (filename, errorId, throwOnError, errorReplacements) {
        var _this = this;
        if (throwOnError === void 0) { throwOnError = false; }
        if (errorReplacements === void 0) { errorReplacements = {}; }
        log.verbose("checking if file " + filename + " exists");
        return function (zipEntries, error) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!zipEntries.find(function (e) {
                    return e.fileName.toLocaleLowerCase() ===
                        filename.toLocaleLowerCase();
                })) {
                    log.error("file " + filename + " does not exist");
                    error.addError(new H5pError_1["default"](errorId, errorReplacements));
                    if (throwOnError) {
                        throw error;
                    }
                }
                return [2 /*return*/, zipEntries];
            });
        }); };
    };
    /**
     * Factory for a rule that tries reading the files that are matched by the filter.
     * Does not throw errors.
     * @param {(path: string) => boolean} filter Returns true for files that should be readable.
     * @returns the rule
     */
    PackageValidator.prototype.filesMustBeReadable = function (filter) {
        var _this = this;
        log.info("checking if files are readable");
        return function (zipEntries, error) { return __awaiter(_this, void 0, void 0, function () {
            var _i, _a, entry, readStream, writeStream, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0, _a = zipEntries.filter(function (e) {
                            return filter(e.fileName.toLocaleLowerCase()) &&
                                !PackageValidator.isDirectory(e.fileName);
                        });
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 7];
                        entry = _a[_i];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 5, , 6]);
                        return [4 /*yield*/, entry.openReadStream()];
                    case 3:
                        readStream = _b.sent();
                        writeStream = new stream_buffers_1.WritableStreamBuffer({
                            incrementAmount: 100 * 1024,
                            initialSize: 500 * 1024
                        });
                        return [4 /*yield*/, promisepipe_1["default"](readStream, writeStream)];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        e_1 = _b.sent();
                        log.error("file " + e_1.fileName + " is not readable");
                        error.addError(new H5pError_1["default"]('corrupt-file', {
                            file: e_1.fileName
                        }, 400));
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 1];
                    case 7: return [2 /*return*/, zipEntries];
                }
            });
        }); };
    };
    /**
     * Factory for a rule that filters out files from the validation.
     * @param {(yauzlPromise.Entry) => boolean} filter The filter. Filenames matched by this filter will be filtered out.
     * @returns the rule
     */
    PackageValidator.prototype.filterOutEntries = function (filter) {
        var _this = this;
        /**
         * @param zipEntries The zip entries in the whole H5P package
         * @returns The zip entries without the filtered out entries
         */
        return function (zipEntries) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, zipEntries.filter(function (e) { return !filter(e); })];
            });
        }); };
    };
    /**
     * Initializes the JSON schema validators _h5pMetaDataValidator and _libraryMetadataValidator.
     * Can be called multiple times, as it only creates new validators when it hasn't been called before.
     */
    PackageValidator.prototype.initializeJsonValidators = function () {
        return __awaiter(this, void 0, void 0, function () {
            var jsonValidator, h5pJsonSchema, libraryNameSchema, librarySchema;
            return __generator(this, function (_a) {
                if (this.h5pMetadataValidator && this.libraryMetadataValidator) {
                    return [2 /*return*/];
                }
                log.info("initializing json validators");
                jsonValidator = new ajv_1["default"]();
                ajv_keywords_1["default"](jsonValidator, 'regexp');
                h5pJsonSchema = require('./schemas/h5p-schema.json');
                libraryNameSchema = require('./schemas/library-name-schema.json');
                librarySchema = require('./schemas/library-schema.json');
                jsonValidator.addSchema([
                    h5pJsonSchema,
                    libraryNameSchema,
                    librarySchema
                ]);
                this.h5pMetadataValidator = jsonValidator.compile(h5pJsonSchema);
                this.libraryMetadataValidator = jsonValidator.compile(librarySchema);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Factory for a rule that makes sure a JSON file is parsable.
     * Throws an error if the JSON file can't be parsed.
     * @param filename The path to the file.
     * @param errorId An optional error message to use instead of the default
     * @param skipIfNonExistent if true, the rule does not produce an error if the file doesn't exist.
     * @param throwIfError if true, the rule will throw an error if the JSON file is not parsable, otherwise it will append the error message to the error object
     * @param errorReplacements replacements to use when generating the an error
     * @return The rule
     */
    PackageValidator.prototype.jsonMustBeParsable = function (filename, errorId, skipIfNonExistent, throwIfError, errorReplacements) {
        var _this = this;
        if (skipIfNonExistent === void 0) { skipIfNonExistent = false; }
        if (throwIfError === void 0) { throwIfError = true; }
        if (errorReplacements === void 0) { errorReplacements = {}; }
        log.info("checking if json of " + filename + " is parsable");
        return function (zipEntries, error) { return __awaiter(_this, void 0, void 0, function () {
            var entry, jsonParseError_1, err;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        entry = zipEntries.find(function (e) {
                            return e.fileName.toLocaleLowerCase() ===
                                filename.toLocaleLowerCase();
                        });
                        if (!entry) {
                            if (skipIfNonExistent) {
                                return [2 /*return*/, zipEntries];
                            }
                            log.error("File " + filename + " missing from H5P package. Make sure to use the fileMustExistRule before using jsonMustBeParsableRule!");
                            throw new Error("File " + filename + " missing from H5P package. Make sure to use the fileMustExistRule before using jsonMustBeParsableRule!");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.tryParseJson(entry)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        jsonParseError_1 = _a.sent();
                        log.error("json " + filename + " is not parsable");
                        err = new H5pError_1["default"](errorId || jsonParseError_1.errorId, errorId ? errorReplacements : jsonParseError_1.replacements, 400, jsonParseError_1.debugMessage);
                        if (throwIfError) {
                            throw error.addError(err);
                        }
                        else {
                            error.addError(err);
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, zipEntries];
                }
            });
        }); };
    };
    /**
     * Factory for a rule that makes sure a JSON file is parsable and conforms to the specified JSON schema.
     * Throws an error if the JSON file can't be parsed or if it does not conform to the schema.
     * @param filename The path to the file.
     * @param schemaValidator The validator for the required schema.
     * @param errorIdAnyError The id of the message that is emitted, when there is an error. (Allowed placeholders: %name, %reason)
     * @param errorIdJsonParse (optional) The message to output if the JSON file is not parsable (will default to a generíc error message)
     * @param returnContent (optional) If true, the rule will return an object with { zipEntries, jsonData } where jsonData contains the parsed JSON of the file
     * @param errorReplacements (optional) The replacements to pass to error objects created in the method.
     * @return The rule (return value: An array of ZipEntries if returnContent == false, otherwise the JSON content is added to the return object)
     */
    PackageValidator.prototype.jsonMustConformToSchema = function (filename, schemaValidator, errorIdAnyError, errorIdJsonParse, returnContent, errorReplacements) {
        var _this = this;
        if (returnContent === void 0) { returnContent = false; }
        if (errorReplacements === void 0) { errorReplacements = {}; }
        log.info("checking if json " + filename + " conforms to schema");
        return function (zipEntries, error) { return __awaiter(_this, void 0, void 0, function () {
            var entry, jsonData, jsonParseError_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        entry = zipEntries.find(function (e) {
                            return e.fileName.toLocaleLowerCase() ===
                                filename.toLocaleLowerCase();
                        });
                        if (!entry) {
                            log.error("File " + filename + " missing from H5P package. Make sure to use the fileMustExistRule before using jsonMustConformToSchemaRule!");
                            throw new Error("File " + filename + " missing from H5P package. Make sure to use the fileMustExistRule before using jsonMustConformToSchemaRule!");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.tryParseJson(entry)];
                    case 2:
                        jsonData = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        jsonParseError_2 = _a.sent();
                        log.error("" + (errorIdJsonParse || jsonParseError_2.message));
                        throw error.addError(new H5pError_1["default"](errorIdJsonParse || jsonParseError_2.errorId, errorIdJsonParse
                            ? errorReplacements
                            : jsonParseError_2.replacements, 400));
                    case 4:
                        if (!schemaValidator(jsonData)) {
                            log.error("json " + filename + " does not conform to schema");
                            errorReplacements.reason = schemaValidator.errors
                                .map(function (e) { return e.dataPath + " " + e.message; })
                                .join(' ')
                                .trim();
                            throw error.addError(new H5pError_1["default"](errorIdAnyError, errorReplacements));
                        }
                        if (!returnContent) {
                            return [2 /*return*/, zipEntries];
                        }
                        return [2 /*return*/, { zipEntries: zipEntries, jsonData: jsonData }];
                }
            });
        }); };
    };
    /**
     * Factory for a rule that checks if library's directory conforms to naming standards
     * @param libraryName The name of the library (directory)
     * @returns the rule
     */
    PackageValidator.prototype.libraryDirectoryMustHaveValidName = function (libraryName) {
        var _this = this;
        log.info("validating library's directory to naming standards");
        return function (zipEntries, error) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.libraryDirectoryNameRegex.test(libraryName)) {
                    throw error.addError(new H5pError_1["default"]('invalid-library-name', {
                        name: libraryName
                    }));
                }
                return [2 /*return*/, zipEntries];
            });
        }); };
    };
    /**
     * Factory for a check that makes sure that the directory name of the library matches the name in
     * the library.json metadata.
     * Does not throw a ValidationError.
     * @param directoryName the name of the directory in the package this library is in
     * @returns the rule
     */
    PackageValidator.prototype.libraryMustHaveMatchingDirectoryName = function (directoryName) {
        var _this = this;
        /**
         * @param zipEntries zip entries in the package
         * @param jsonData jsonData of the library.json file
         * @param error The error object to use
         * @returns {Promise<{zipEntries: yauzl.Entry[], jsonData: any}>} the unchanged data passed to the rule
         */
        log.info("checking if directory names " + directoryName + " of libraries match library.json metadata");
        return function (_a, error) {
            var zipEntries = _a.zipEntries, jsonData = _a.jsonData;
            return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_b) {
                    // Library's directory name must be:
                    // - <machineName>
                    //     - or -
                    // - <machineName>-<majorVersion>.<minorVersion>
                    // where machineName, majorVersion and minorVersion is read from library.json
                    if (directoryName !== jsonData.machineName &&
                        directoryName !==
                            jsonData.machineName + "-" + jsonData.majorVersion + "." + jsonData.minorVersion) {
                        log.error("library directory does not match name " + directoryName);
                        error.addError(new H5pError_1["default"]('library-directory-name-mismatch', {
                            directoryName: directoryName,
                            machineName: jsonData.machineName,
                            majorVersion: jsonData.majorVersion,
                            minorVersion: jsonData.minorVersion
                        }));
                    }
                    return [2 /*return*/, { zipEntries: zipEntries, jsonData: jsonData }];
                });
            });
        };
    };
    /**
     * A rule that always returns true.
     */
    PackageValidator.prototype.returnTrue = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, true];
            });
        });
    };
    /**
     * Tries to open the file in the ZIP archive in memory and parse it as JSON. Will throw errors
     * if the file cannot be read or is no valid JSON.
     * @param entry The entry to read
     * @returns The read JSON as an object
     */
    PackageValidator.prototype.tryParseJson = function (entry) {
        return __awaiter(this, void 0, void 0, function () {
            var content, readStream, writeStream, ignored_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.verbose("parsing json " + entry.fileName);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, entry.openReadStream()];
                    case 2:
                        readStream = _a.sent();
                        writeStream = new stream_buffers_1.WritableStreamBuffer({
                            incrementAmount: 100 * 1024,
                            initialSize: 100 * 1024
                        });
                        return [4 /*yield*/, promisepipe_1["default"](readStream, writeStream)];
                    case 3:
                        _a.sent();
                        content = writeStream.getContentsAsString('utf8');
                        return [3 /*break*/, 5];
                    case 4:
                        ignored_3 = _a.sent();
                        log.error("unable to read package file");
                        throw new H5pError_1["default"]('unable-to-read-package-file', {
                            fileName: entry.fileName
                        });
                    case 5:
                        try {
                            return [2 /*return*/, JSON.parse(content)];
                        }
                        catch (ignored) {
                            log.error("unable to parse JSON file " + entry.fileName);
                            throw new H5pError_1["default"]('unable-to-parse-package', {
                                fileName: entry.fileName
                            });
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Checks whether the library conforms to the standard and returns its data.
     * @param zipEntries All (relevant) zip entries of the package.
     * @param libraryName The name of the library to check
     * @param error the error object
     * @returns {Promise< {semantics: any, hasIcon: boolean, language: any}|boolean >} the object from library.json with additional data from semantics.json, the language files and the icon.
     */
    PackageValidator.prototype.validateLibrary = function (zipEntries, libraryName, error) {
        return __awaiter(this, void 0, void 0, function () {
            var e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        log.info("validating library " + libraryName);
                        return [4 /*yield*/, new ValidatorBuilder_1.ValidatorBuilder()
                                .addRule(this.libraryDirectoryMustHaveValidName(libraryName))
                                .addRule(this.jsonMustBeParsable('semantics.json', 'invalid-semantics-json-file', true, false, { name: libraryName }))
                                .addRule(this.jsonMustConformToSchema(libraryName + "/library.json", this.libraryMetadataValidator, 'invalid-schema-library-json-file', 'invalid-library-json-file', true, { name: libraryName }))
                                .addRule(this.mustBeCompatibleToCoreVersion)
                                .addRule(this.libraryMustHaveMatchingDirectoryName(libraryName))
                                .addRule(this.libraryPreloadedFilesMustExist)
                                .addRule(this.libraryLanguageFilesMustBeValid)
                                .validate(zipEntries, error)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        e_2 = _a.sent();
                        if (e_2 instanceof AggregateH5pError_1["default"]) {
                            // Don't rethrow a ValidationError (and thus abort validation) as other libraries can still be validated, too. This is fine as the
                            // error values are appended to the ValidationError and the error will be thrown at some point anyway.
                            return [2 /*return*/, false];
                        }
                        throw e_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return PackageValidator;
}());
exports["default"] = PackageValidator;
//# sourceMappingURL=PackageValidator.js.map