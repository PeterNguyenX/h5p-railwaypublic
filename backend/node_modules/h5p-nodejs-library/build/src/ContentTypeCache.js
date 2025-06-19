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
var axios_1 = __importDefault(require("axios"));
var crc_1 = require("crc");
var merge = __importStar(require("merge"));
var qs = __importStar(require("qs"));
var H5pError_1 = __importDefault(require("./helpers/H5pError"));
var Logger_1 = __importDefault(require("./helpers/Logger"));
var log = new Logger_1["default"]('ContentTypeCache');
/**
 * This class caches the information about the content types on the H5P Hub.
 *
 * IT DOES NOT exactly correspond to the ContentTypeCache of the original PHP implementation,
 * as it only caches the data (and converts it to a local format). It DOES NOT add information
 * about locally installed libraries and user rights. ContentTypeInformationRepository is meant to do this.
 *
 * Usage:
 * - Get the content type information by calling get().
 * - The method updateIfNecessary() should be called regularly, e.g. through a cron-job.
 * - Use contentTypeCacheRefreshInterval in the IH5PConfig object to set how often
 *   the update should be performed. You can also use forceUpdate() if you want to bypass the
 *   interval.
 */
var ContentTypeCache = /** @class */ (function () {
    /**
     *
     * @param config The configuration to use.
     * @param storage The storage object.
     */
    function ContentTypeCache(config, storage) {
        log.info("initialize");
        this.config = config;
        this.storage = storage;
    }
    /**
     * Converts an entry from the H5P Hub into a format with flattened versions and integer date values.
     * @param entry the entry as received from H5P Hub
     * @returns the local content type object
     */
    ContentTypeCache.convertCacheEntryToLocalFormat = function (entry) {
        log.debug("converting Cache Entry to local format");
        return {
            categories: entry.categories || [],
            createdAt: Date.parse(entry.createdAt),
            description: entry.description,
            example: entry.example,
            h5pMajorVersion: entry.coreApiVersionNeeded.major,
            h5pMinorVersion: entry.coreApiVersionNeeded.minor,
            icon: entry.icon,
            isRecommended: entry.isRecommended,
            keywords: entry.keywords || [],
            license: entry.license,
            machineName: entry.id,
            majorVersion: entry.version.major,
            minorVersion: entry.version.minor,
            owner: entry.owner,
            patchVersion: entry.version.patch,
            popularity: entry.popularity,
            screenshots: entry.screenshots,
            summary: entry.summary,
            title: entry.title,
            tutorial: entry.tutorial || '',
            updatedAt: Date.parse(entry.updatedAt)
        };
    };
    /**
     * Creates an identifier for the running instance.
     * @returns id
     */
    ContentTypeCache.generateLocalId = function () {
        log.debug("generating local Id");
        return crc_1.crc32(__dirname);
    };
    /**
     * Downloads information about available content types from the H5P Hub. This method will
     * create a UUID to identify this site if required.
     * @returns content types
     */
    ContentTypeCache.prototype.downloadContentTypesFromHub = function () {
        return __awaiter(this, void 0, void 0, function () {
            var formData, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.info("downloading content types from hub " + this.config.hubContentTypesEndpoint);
                        return [4 /*yield*/, this.registerOrGetUuid()];
                    case 1:
                        _a.sent();
                        formData = this.compileRegistrationData();
                        if (this.config.sendUsageStatistics) {
                            formData = merge.recursive(true, formData, this.compileUsageStatistics());
                        }
                        return [4 /*yield*/, axios_1["default"].post(this.config.hubContentTypesEndpoint, qs.stringify(formData))];
                    case 2:
                        response = _a.sent();
                        if (response.status !== 200) {
                            throw new H5pError_1["default"]('error-communicating-with-hub', {
                                statusCode: response.status.toString(),
                                statusText: response.statusText
                            }, 504);
                        }
                        if (!response.data) {
                            throw new H5pError_1["default"]('error-communicating-with-hub-no-status', {}, 504);
                        }
                        return [2 /*return*/, response.data.contentTypes];
                }
            });
        });
    };
    /**
     * Downloads the content type information from the H5P Hub and stores it in the storage object.
     * @returns the downloaded (and saved) cache; undefined if it failed (e.g. because Hub was unreachable)
     */
    ContentTypeCache.prototype.forceUpdate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cacheInHubFormat, error_1, cacheInInternalFormat;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.info("forcing update");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.downloadContentTypesFromHub()];
                    case 2:
                        cacheInHubFormat = _a.sent();
                        if (!cacheInHubFormat) {
                            return [2 /*return*/, undefined];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        log.error(error_1);
                        return [2 /*return*/, undefined];
                    case 4:
                        cacheInInternalFormat = cacheInHubFormat.map(ContentTypeCache.convertCacheEntryToLocalFormat);
                        return [4 /*yield*/, this.storage.save('contentTypeCache', cacheInInternalFormat)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this.storage.save('contentTypeCacheUpdate', Date.now())];
                    case 6:
                        _a.sent();
                        return [2 /*return*/, cacheInInternalFormat];
                }
            });
        });
    };
    /**
     * Returns the cache data.
     * @param machineNames (optional) The method only returns content type cache data for these machine names.
     * @returns Cached hub data in a format in which the version objects are flattened into the main object,
     */
    ContentTypeCache.prototype.get = function () {
        var machineNames = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            machineNames[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var cache;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.info("getting content types");
                        return [4 /*yield*/, this.storage.load('contentTypeCache')];
                    case 1:
                        cache = _a.sent();
                        if (!!cache) return [3 /*break*/, 3];
                        log.info('ContentTypeCache was never updated before. Downloading it from the H5P Hub...');
                        return [4 /*yield*/, this.forceUpdate()];
                    case 2:
                        // try updating cache if it is empty for some reason
                        cache = _a.sent();
                        // if the cache is still empty (e.g. because no connection to the H5P Hub can be established, return an empty array)
                        if (!cache) {
                            log.info('ContentTypeCache could not be retrieved from H5P Hub.');
                            return [2 /*return*/, []];
                        }
                        _a.label = 3;
                    case 3:
                        if (!machineNames || machineNames.length === 0) {
                            return [2 /*return*/, cache];
                        }
                        return [2 /*return*/, cache.filter(function (contentType) {
                                return machineNames.some(function (machineName) { return machineName === contentType.machineName; });
                            })];
                }
            });
        });
    };
    /**
     * Returns the date and time of the last update of the cache.
     * @returns the date and time; undefined if the cache was never updated before.
     */
    ContentTypeCache.prototype.getLastUpdate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var lastUpdate;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.load('contentTypeCacheUpdate')];
                    case 1:
                        lastUpdate = _a.sent();
                        return [2 /*return*/, lastUpdate];
                }
            });
        });
    };
    /**
     * Checks if the cache is not up to date anymore (update interval exceeded).
     * @returns true if cache is outdated, false if not
     */
    ContentTypeCache.prototype.isOutdated = function () {
        return __awaiter(this, void 0, void 0, function () {
            var lastUpdate;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.info("checking if content type cache is up to date");
                        return [4 /*yield*/, this.storage.load('contentTypeCacheUpdate')];
                    case 1:
                        lastUpdate = _a.sent();
                        return [2 /*return*/, (!lastUpdate ||
                                Date.now() - lastUpdate >
                                    this.config.contentTypeCacheRefreshInterval)];
                }
            });
        });
    };
    /**
     * If the running site has already been registered at the H5P hub, this method will
     * return the UUID of it. If it hasn't been registered yet, it will do so and store
     * the UUID in the storage object.
     * @returns uuid
     */
    ContentTypeCache.prototype.registerOrGetUuid = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.info("registering or getting uuid from hub " + this.config.hubRegistrationEndpoint);
                        if (this.config.uuid && this.config.uuid !== '') {
                            return [2 /*return*/, this.config.uuid];
                        }
                        return [4 /*yield*/, axios_1["default"].post(this.config.hubRegistrationEndpoint, this.compileRegistrationData())];
                    case 1:
                        response = _a.sent();
                        if (response.status !== 200) {
                            throw new H5pError_1["default"]('error-registering-at-hub', {
                                statusCode: response.status.toString(),
                                statusText: response.statusText
                            }, 500);
                        }
                        if (!response.data || !response.data.uuid) {
                            throw new H5pError_1["default"]('error-registering-at-hub-no-status', {}, 500);
                        }
                        log.debug("setting uuid to " + response.data.uuid);
                        this.config.uuid = response.data.uuid;
                        return [4 /*yield*/, this.config.save()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, this.config.uuid];
                }
            });
        });
    };
    /**
     * Checks if the interval between updates has been exceeded and updates the cache if necessary.
     * @returns true if cache was updated, false if not
     */
    ContentTypeCache.prototype.updateIfNecessary = function () {
        return __awaiter(this, void 0, void 0, function () {
            var oldCache, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        log.info("checking if update is necessary");
                        return [4 /*yield*/, this.storage.load('contentTypeCache')];
                    case 1:
                        oldCache = _b.sent();
                        _a = !oldCache;
                        if (_a) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.isOutdated()];
                    case 2:
                        _a = (_b.sent());
                        _b.label = 3;
                    case 3:
                        if (!_a) return [3 /*break*/, 5];
                        log.info("update is necessary");
                        return [4 /*yield*/, this.forceUpdate()];
                    case 4: return [2 /*return*/, (_b.sent()) !== undefined];
                    case 5:
                        log.info("no update necessary");
                        return [2 /*return*/, false];
                }
            });
        });
    };
    /**
     * @returns An object with the registration data as required by the H5P Hub
     */
    ContentTypeCache.prototype.compileRegistrationData = function () {
        log.debug("compiling registration data for hub " + this.config.hubRegistrationEndpoint);
        return {
            core_api_version: this.config.coreApiVersion.major + "." + this.config.coreApiVersion.minor,
            disabled: this.config.fetchingDisabled,
            h5p_version: this.config.h5pVersion,
            local_id: ContentTypeCache.generateLocalId(),
            platform_name: this.config.platformName,
            platform_version: this.config.platformVersion,
            type: this.config.siteType,
            uuid: this.config.uuid
        };
    };
    /**
     * @returns An object with usage statistics as required by the H5P Hub
     */
    ContentTypeCache.prototype.compileUsageStatistics = function () {
        log.info("compiling usage statistics");
        return {
            libraries: {},
            num_authors: 0 // number of active authors
        };
    };
    return ContentTypeCache;
}());
exports["default"] = ContentTypeCache;
//# sourceMappingURL=ContentTypeCache.js.map