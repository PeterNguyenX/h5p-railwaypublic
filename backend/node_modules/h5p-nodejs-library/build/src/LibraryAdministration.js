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
var H5pError_1 = __importDefault(require("./helpers/H5pError"));
var LibraryName_1 = __importDefault(require("./LibraryName"));
/**
 * This class has methods that perform library administration, i.e, deleted
 * libraries. All parameters undergo validation and proper exceptions are thrown
 * when something went wrong.
 */
var LibraryAdministration = /** @class */ (function () {
    function LibraryAdministration(libraryManager, contentManager) {
        this.libraryManager = libraryManager;
        this.contentManager = contentManager;
    }
    /**
     * Deletes a library.
     *
     * Throws H5pError with HTTP status code 423 if the library cannot be
     * deleted because it is still in use.
     * @param ubername the ubername of the library to delete
     */
    LibraryAdministration.prototype.deleteLibrary = function (ubername) {
        return __awaiter(this, void 0, void 0, function () {
            var libraryName, usage, dependentsCount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.checkLibrary(ubername)];
                    case 1:
                        libraryName = _a.sent();
                        return [4 /*yield*/, this.contentManager.contentStorage.getUsage(libraryName)];
                    case 2:
                        usage = _a.sent();
                        return [4 /*yield*/, this.libraryManager.libraryStorage.getDependentsCount(libraryName)];
                    case 3:
                        dependentsCount = _a.sent();
                        if (usage.asDependency + usage.asMainLibrary + dependentsCount > 0) {
                            throw new H5pError_1["default"]('library-used', { library: ubername }, 423);
                        }
                        return [4 /*yield*/, this.libraryManager.libraryStorage.deleteLibrary(libraryName)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Lists all installed libraries. This operation can be relatively costly
     * as it has to go through the whole library metadata and calculate
     * usage of libraries across all content objects on the system.
     */
    LibraryAdministration.prototype.getLibraries = function () {
        return __awaiter(this, void 0, void 0, function () {
            var libraryNames, libraryMetadata, dependents;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.libraryManager.libraryStorage.getInstalledLibraryNames()];
                    case 1:
                        libraryNames = _a.sent();
                        return [4 /*yield*/, Promise.all(libraryNames.map(function (lib) { return _this.libraryManager.getLibrary(lib); }))];
                    case 2:
                        libraryMetadata = (_a.sent()).sort(function (a, b) { return a.compare(b); });
                        return [4 /*yield*/, this.libraryManager.libraryStorage.getAllDependentsCount()];
                    case 3:
                        dependents = _a.sent();
                        return [2 /*return*/, Promise.all(libraryMetadata.map(function (metadata) { return __awaiter(_this, void 0, void 0, function () {
                                var usage, dependentsCount;
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0: return [4 /*yield*/, this.contentManager.contentStorage.getUsage(metadata)];
                                        case 1:
                                            usage = _b.sent();
                                            dependentsCount = (_a = dependents[LibraryName_1["default"].toUberName(metadata)]) !== null && _a !== void 0 ? _a : 0;
                                            return [2 /*return*/, {
                                                    title: metadata.title,
                                                    machineName: metadata.machineName,
                                                    majorVersion: metadata.majorVersion,
                                                    minorVersion: metadata.minorVersion,
                                                    patchVersion: metadata.patchVersion,
                                                    isAddon: metadata.addTo !== undefined,
                                                    restricted: metadata.restricted,
                                                    // We coerce the inconsistent H5P type boolean | 0 | 1 into
                                                    // boolean.
                                                    // tslint:disable-next-line: triple-equals
                                                    runnable: metadata.runnable == true,
                                                    instancesCount: usage.asMainLibrary,
                                                    instancesAsDependencyCount: usage.asDependency,
                                                    dependentsCount: dependentsCount,
                                                    canBeDeleted: usage.asDependency +
                                                        usage.asMainLibrary +
                                                        dependentsCount ===
                                                        0,
                                                    // libraries can be updated if there is an installed library
                                                    // with the same machine name but a greater version
                                                    canBeUpdated: libraryNames.some(function (ln) {
                                                        return ln.machineName === metadata.machineName &&
                                                            metadata.compareVersions(ln) < 0;
                                                    })
                                                }];
                                    }
                                });
                            }); }))];
                }
            });
        });
    };
    /**
     * Returns detailed information about the library and its use.
     * @param ubername
     */
    LibraryAdministration.prototype.getLibrary = function (ubername) {
        return __awaiter(this, void 0, void 0, function () {
            var libraryName, _a, metadata, usage, dependentsCount;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.checkLibrary(ubername)];
                    case 1:
                        libraryName = _b.sent();
                        return [4 /*yield*/, Promise.all([
                                this.libraryManager.getLibrary(libraryName),
                                this.contentManager.contentStorage.getUsage(libraryName),
                                this.libraryManager.libraryStorage.getDependentsCount(libraryName)
                            ])];
                    case 2:
                        _a = _b.sent(), metadata = _a[0], usage = _a[1], dependentsCount = _a[2];
                        return [2 /*return*/, __assign(__assign({}, metadata), { dependentsCount: dependentsCount, instancesCount: usage.asMainLibrary, instancesAsDependencyCount: usage.asDependency, isAddon: metadata.addTo !== undefined })];
                }
            });
        });
    };
    /**
     * Changes the restricted status of a library
     * @param ubername the library's ubername you want to change
     * @param restricted the new value
     */
    LibraryAdministration.prototype.restrictLibrary = function (ubername, restricted) {
        return __awaiter(this, void 0, void 0, function () {
            var libraryName;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.checkLibrary(ubername)];
                    case 1:
                        libraryName = _a.sent();
                        if (restricted === undefined || typeof restricted !== 'boolean') {
                            throw new H5pError_1["default"]('invalid-patch-request', undefined, 400);
                        }
                        return [4 /*yield*/, this.libraryManager.libraryStorage.updateAdditionalMetadata(libraryName, { restricted: restricted })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Checks if the ubername is valid and if the library is installed.
     * Throws H5pErrors if the name is invalid (400) or the library is not
     * installed (404).
     * @param ubername the ubername to check
     * @returns the parsed library name
     */
    LibraryAdministration.prototype.checkLibrary = function (ubername) {
        return __awaiter(this, void 0, void 0, function () {
            var libraryName;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        libraryName = LibraryName_1["default"].fromUberName(ubername);
                        if (libraryName === undefined) {
                            throw new H5pError_1["default"]('invalid-ubername-pattern', { name: ubername }, 400);
                        }
                        return [4 /*yield*/, this.libraryManager.libraryStorage.isInstalled(libraryName)];
                    case 1:
                        // Check if library is installed
                        if (!(_a.sent())) {
                            throw new H5pError_1["default"]('library-missing', { library: ubername }, 404);
                        }
                        return [2 /*return*/, libraryName];
                }
            });
        });
    };
    return LibraryAdministration;
}());
exports["default"] = LibraryAdministration;
//# sourceMappingURL=LibraryAdministration.js.map