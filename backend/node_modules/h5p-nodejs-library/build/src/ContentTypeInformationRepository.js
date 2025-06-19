"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var axios_1 = __importDefault(require("axios"));
var fsExtra = __importStar(require("fs-extra"));
var promisepipe_1 = __importDefault(require("promisepipe"));
var tmp_promise_1 = require("tmp-promise");
var H5pError_1 = __importDefault(require("./helpers/H5pError"));
var PackageImporter_1 = __importDefault(require("./PackageImporter"));
var Logger_1 = __importDefault(require("./helpers/Logger"));
var log = new Logger_1["default"]('ContentTypeInformationRepository');
/**
 * This class provides access to information about content types that are either available at the H5P Hub
 * or were installed locally. It is used by the editor to display the list of available content types. Technically
 * it fulfills the same functionality as the "ContentTypeCache" in the original PHP implementation, but it has been
 * renamed in the NodeJS version, as it provides more functionality than just caching the information from the Hub:
 *   - it checks if the current user has the rights to update or install a content type
 *   - it checks if a content type in the Hub is installed locally and is outdated locally
 *   - it adds information about only locally installed content types
 */
var ContentTypeInformationRepository = /** @class */ (function () {
    /**
     *
     * @param contentTypeCache
     * @param libraryManager
     * @param config
     */
    function ContentTypeInformationRepository(contentTypeCache, libraryManager, config) {
        this.contentTypeCache = contentTypeCache;
        this.libraryManager = libraryManager;
        this.config = config;
        log.info("initialize");
    }
    /**
     * Gets the information about available content types with all the extra information as listed in the class description.
     */
    ContentTypeInformationRepository.prototype.get = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var cachedHubInfo, hubInfoWithLocalInfo;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        log.info("getting information about available content types");
                        return [4 /*yield*/, this.contentTypeCache.get()];
                    case 1:
                        cachedHubInfo = _b.sent();
                        return [4 /*yield*/, this.addUserAndInstallationSpecificInfo(cachedHubInfo, user)];
                    case 2:
                        hubInfoWithLocalInfo = _b.sent();
                        return [4 /*yield*/, this.addLocalLibraries(hubInfoWithLocalInfo, user)];
                    case 3:
                        hubInfoWithLocalInfo = _b.sent();
                        _a = {
                            apiVersion: this.config.coreApiVersion,
                            details: null,
                            libraries: hubInfoWithLocalInfo
                        };
                        return [4 /*yield*/, this.contentTypeCache.isOutdated()];
                    case 4: return [2 /*return*/, (_a.outdated = (_b.sent()) &&
                            (user.canInstallRecommended ||
                                user.canUpdateAndInstallLibraries),
                            _a.recentlyUsed = [],
                            _a.user = user.type,
                            _a)];
                }
            });
        });
    };
    /**
     * Installs a library from the H5P Hub.
     * Throws H5PError exceptions if there are errors.
     * @param machineName The machine name of the library to install (must be listed in the Hub, otherwise rejected)
     * @returns a list of libraries that were installed (includes dependent libraries). Empty if none were installed.
     */
    ContentTypeInformationRepository.prototype.installContentType = function (machineName, user) {
        return __awaiter(this, void 0, void 0, function () {
            var localContentType, response, installedLibraries;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.info("installing library " + machineName + " from hub " + this.config.hubContentTypesEndpoint);
                        if (!machineName) {
                            log.error("content type " + machineName + " not found");
                            throw new H5pError_1["default"]('hub-install-no-content-type', {}, 404);
                        }
                        return [4 /*yield*/, this.contentTypeCache.get(machineName)];
                    case 1:
                        localContentType = _a.sent();
                        if (!localContentType || localContentType.length === 0) {
                            log.error("rejecting content type " + machineName + ": content type is not listed in the hub " + this.config.hubContentTypesEndpoint);
                            throw new H5pError_1["default"]('hub-install-invalid-content-type', {}, 400);
                        }
                        // Reject installation of content types that the user has no permission to
                        if (!this.canInstallLibrary(localContentType[0], user)) {
                            log.warn("rejecting installation of content type " + machineName + ": user has no permission");
                            throw new H5pError_1["default"]('hub-install-denied', {}, 403);
                        }
                        return [4 /*yield*/, axios_1["default"].get(this.config.hubContentTypesEndpoint + machineName, { responseType: 'stream' })];
                    case 2:
                        response = _a.sent();
                        installedLibraries = [];
                        // withFile is supposed to clean up the temporary file after it has been used
                        return [4 /*yield*/, tmp_promise_1.withFile(function (_a) {
                                var tempPackagePath = _a.path;
                                return __awaiter(_this, void 0, void 0, function () {
                                    var writeStream, error_1, packageImporter;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                writeStream = fsExtra.createWriteStream(tempPackagePath);
                                                _b.label = 1;
                                            case 1:
                                                _b.trys.push([1, 3, , 4]);
                                                return [4 /*yield*/, promisepipe_1["default"](response.data, writeStream)];
                                            case 2:
                                                _b.sent();
                                                return [3 /*break*/, 4];
                                            case 3:
                                                error_1 = _b.sent();
                                                log.error(error_1);
                                                throw new H5pError_1["default"]('hub-install-download-failed', {}, 504);
                                            case 4:
                                                packageImporter = new PackageImporter_1["default"](this.libraryManager, this.config);
                                                return [4 /*yield*/, packageImporter.installLibrariesFromPackage(tempPackagePath)];
                                            case 5:
                                                installedLibraries = _b.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            }, { postfix: '.h5p', keep: false })];
                    case 3:
                        // withFile is supposed to clean up the temporary file after it has been used
                        _a.sent();
                        return [2 /*return*/, installedLibraries];
                }
            });
        });
    };
    /**
     *
     * @param hubInfo
     * @returns The original hub information as passed into the method with appended information about
     * locally installed libraries.
     */
    ContentTypeInformationRepository.prototype.addLocalLibraries = function (hubInfo, user) {
        return __awaiter(this, void 0, void 0, function () {
            var localLibsWrapped, localLibs, finalLocalLibs;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.libraryManager.listInstalledLibraries()];
                    case 1:
                        localLibsWrapped = _a.sent();
                        localLibs = Object.keys(localLibsWrapped)
                            .map(function (machineName) {
                            return localLibsWrapped[machineName][localLibsWrapped[machineName].length - 1];
                        })
                            .filter(function (lib) {
                            return !hubInfo.some(function (hubLib) { return hubLib.machineName === lib.machineName; }) && lib.runnable;
                        })
                            .map(function (localLib) { return __awaiter(_this, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _a = {
                                            canInstall: false,
                                            description: ''
                                        };
                                        return [4 /*yield*/, this.libraryManager.libraryFileExists(localLib, 'icon.svg')];
                                    case 1: return [2 /*return*/, (_a.icon = (_b.sent())
                                            ? this.libraryManager.getLibraryFileUrl(localLib, 'icon.svg')
                                            : undefined,
                                            _a.installed = true,
                                            _a.isUpToDate = true,
                                            _a.localMajorVersion = localLib.majorVersion,
                                            _a.localMinorVersion = localLib.minorVersion,
                                            _a.localPatchVersion = localLib.patchVersion,
                                            _a.machineName = localLib.machineName,
                                            _a.majorVersion = localLib.majorVersion,
                                            _a.minorVersion = localLib.minorVersion,
                                            _a.owner = '',
                                            _a.patchVersion = localLib.patchVersion,
                                            _a.restricted = this.libraryIsRestricted(localLib) &&
                                                !user.canCreateRestricted,
                                            _a.title = localLib.title,
                                            _a)];
                                }
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(localLibs)];
                    case 2:
                        finalLocalLibs = _a.sent();
                        log.info("adding local libraries: " + finalLocalLibs
                            .map(function (lib) {
                            return lib.machineName + "-" + lib.majorVersion + "." + lib.minorVersion;
                        })
                            .join(', '));
                        return [2 /*return*/, hubInfo.concat(finalLocalLibs)];
                }
            });
        });
    };
    /**
     * Adds information about installation status, restriction, right to install and up-to-dateness.
     * @param hubInfo
     * @returns The hub information as passed into the method with added information.
     */
    ContentTypeInformationRepository.prototype.addUserAndInstallationSpecificInfo = function (hubInfo, user) {
        return __awaiter(this, void 0, void 0, function () {
            var localLibsWrapped, localLibs;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.info("adding user and installation specific information");
                        return [4 /*yield*/, this.libraryManager.listInstalledLibraries()];
                    case 1:
                        localLibsWrapped = _a.sent();
                        localLibs = Object.keys(localLibsWrapped).map(function (machineName) {
                            return localLibsWrapped[machineName][localLibsWrapped[machineName].length - 1];
                        });
                        return [2 /*return*/, Promise.all(hubInfo.map(function (hl) { return __awaiter(_this, void 0, void 0, function () {
                                var hubLib, localLib, _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            hubLib = __assign(__assign({}, hl), { canInstall: false, installed: false, isUpToDate: false, localMajorVersion: 0, localMinorVersion: 0, localPatchVersion: 0, restricted: false });
                                            localLib = localLibs.find(function (l) { return l.machineName === hubLib.machineName; });
                                            if (!!localLib) return [3 /*break*/, 1];
                                            hubLib.installed = false;
                                            hubLib.restricted = !this.canInstallLibrary(hubLib, user);
                                            hubLib.canInstall = this.canInstallLibrary(hubLib, user);
                                            hubLib.isUpToDate = true;
                                            return [3 /*break*/, 3];
                                        case 1:
                                            hubLib.installed = true;
                                            hubLib.restricted =
                                                this.libraryIsRestricted(localLib) &&
                                                    !user.canCreateRestricted;
                                            hubLib.canInstall =
                                                !this.libraryIsRestricted(localLib) &&
                                                    this.canInstallLibrary(hubLib, user);
                                            _a = hubLib;
                                            return [4 /*yield*/, this.libraryManager.libraryHasUpgrade(hubLib)];
                                        case 2:
                                            _a.isUpToDate = !(_b.sent());
                                            hubLib.localMajorVersion = localLib.majorVersion;
                                            hubLib.localMinorVersion = localLib.minorVersion;
                                            hubLib.localPatchVersion = localLib.patchVersion;
                                            _b.label = 3;
                                        case 3: return [2 /*return*/, hubLib];
                                    }
                                });
                            }); }))];
                }
            });
        });
    };
    /**
     * Checks if users can install library due to their rights.
     * @param library
     */
    ContentTypeInformationRepository.prototype.canInstallLibrary = function (library, user) {
        log.verbose("checking if user can install library " + library.machineName);
        return (user.canUpdateAndInstallLibraries ||
            (library.isRecommended && user.canInstallRecommended));
    };
    /**
     * Checks if the library is restricted e.g. because it is LRS dependent and the
     * admin has restricted them or because it was set as restricted individually.
     * @param library
     */
    ContentTypeInformationRepository.prototype.libraryIsRestricted = function (library) {
        log.verbose("checking if library " + library.machineName + " is restricted");
        if (this.config.enableLrsContentTypes) {
            return library.restricted;
        }
        if (this.config.lrsContentTypes.some(function (contentType) { return contentType === library.machineName; })) {
            return true;
        }
        return library.restricted;
    };
    return ContentTypeInformationRepository;
}());
exports["default"] = ContentTypeInformationRepository;
//# sourceMappingURL=ContentTypeInformationRepository.js.map