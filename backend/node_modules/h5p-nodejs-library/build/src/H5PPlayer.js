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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var LibraryName_1 = __importDefault(require("./LibraryName"));
var UrlGenerator_1 = __importDefault(require("./UrlGenerator"));
var Logger_1 = __importDefault(require("./helpers/Logger"));
var ContentMetadata_1 = require("./ContentMetadata");
var en_json_1 = __importDefault(require("../assets/translations/client/en.json"));
var playerAssetList_json_1 = __importDefault(require("./playerAssetList.json"));
var player_1 = __importDefault(require("./renderers/player"));
var H5pError_1 = __importDefault(require("./helpers/H5pError"));
var LibraryManager_1 = __importDefault(require("./LibraryManager"));
var log = new Logger_1["default"]('Player');
var H5PPlayer = /** @class */ (function () {
    /**
     *
     * @param libraryStorage the storage for libraries (can be read only)
     * @param contentStorage the storage for content (can be read only)
     * @param config the configuration object
     * @param integrationObjectDefaults (optional) the default values to use for the integration object
     * @param globalCustomScripts (optional) references to these scripts will be added when rendering content
     */
    function H5PPlayer(libraryStorage, contentStorage, config, integrationObjectDefaults, globalCustomScripts, urlGenerator) {
        if (globalCustomScripts === void 0) { globalCustomScripts = []; }
        if (urlGenerator === void 0) { urlGenerator = new UrlGenerator_1["default"](config); }
        this.libraryStorage = libraryStorage;
        this.contentStorage = contentStorage;
        this.config = config;
        this.integrationObjectDefaults = integrationObjectDefaults;
        this.globalCustomScripts = globalCustomScripts;
        this.urlGenerator = urlGenerator;
        log.info('initialize');
        this.renderer = player_1["default"];
        this.clientTranslation = en_json_1["default"];
        this.libraryManager = new LibraryManager_1["default"](libraryStorage, urlGenerator.libraryFile);
    }
    /**
     * Creates a frame for displaying H5P content. You can customize this frame by calling setRenderer(...).
     * It normally is enough to call this method with the content id. Only call it with parameters and metadata
     * if don't want to use the IContentStorage object passed into the constructor.
     * @param contentId the content id
     * @param parameters (optional) the parameters of a piece of content (=content.json)
     * @param metadata (optional) the metadata of a piece of content (=h5p.json)
     * @returns a HTML string that you can insert into your page
     */
    H5PPlayer.prototype.render = function (contentId, parameters, metadata, user) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var error_1, error_2, installedAddons, dependencies, _b, _c, _d, _e, _f, _g, _h, libraries, assets, mainLibrarySupportsFullscreen, model;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        log.info("rendering page for " + contentId);
                        _j.label = 1;
                    case 1:
                        _j.trys.push([1, 4, , 5]);
                        if (!!parameters) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.contentStorage.getParameters(contentId)];
                    case 2:
                        // tslint:disable-next-line: no-parameter-reassignment
                        parameters = _j.sent();
                        _j.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_1 = _j.sent();
                        throw new H5pError_1["default"]('h5p-player:content-missing', {}, 404);
                    case 5:
                        _j.trys.push([5, 8, , 9]);
                        if (!!metadata) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.contentStorage.getMetadata(contentId)];
                    case 6:
                        // tslint:disable-next-line: no-parameter-reassignment
                        metadata = _j.sent();
                        _j.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        error_2 = _j.sent();
                        throw new H5pError_1["default"]('h5p-player:content-missing', {}, 404);
                    case 9:
                        log.debug('Getting list of installed addons.');
                        installedAddons = [];
                        if (!((_a = this.libraryStorage) === null || _a === void 0 ? void 0 : _a.listAddons)) return [3 /*break*/, 11];
                        return [4 /*yield*/, this.libraryStorage.listAddons()];
                    case 10:
                        installedAddons = _j.sent();
                        _j.label = 11;
                    case 11:
                        _c = (_b = Array).from;
                        _d = Set.bind;
                        _g = (_f = (metadata.preloadedDependencies || []))
                            .concat;
                        return [4 /*yield*/, this.getAddonsByParameters(parameters, installedAddons)];
                    case 12:
                        _h = (_e = _g.apply(_f, [_j.sent()]))
                            .concat;
                        return [4 /*yield*/, this.getAddonsByLibrary(metadata.mainLibrary, installedAddons)];
                    case 13:
                        dependencies = _c.apply(_b, [new (_d.apply(Set, [void 0, _h.apply(_e, [_j.sent()])]))()]);
                        return [4 /*yield*/, this.getMetadataRecursive(dependencies)];
                    case 14:
                        libraries = _j.sent();
                        assets = this.aggregateAssetsRecursive(dependencies, libraries);
                        mainLibrarySupportsFullscreen = !metadata.mainLibrary
                            ? false
                            : libraries[LibraryName_1["default"].toUberName(metadata.preloadedDependencies.find(function (dep) { return dep.machineName === metadata.mainLibrary; }))].fullscreen === 1;
                        model = {
                            contentId: contentId,
                            dependencies: dependencies,
                            downloadPath: this.getDownloadPath(contentId),
                            integration: this.generateIntegration(contentId, parameters, metadata, assets, mainLibrarySupportsFullscreen),
                            scripts: this.listCoreScripts()
                                .concat(this.globalCustomScripts)
                                .concat(assets.scripts),
                            styles: this.listCoreStyles().concat(assets.styles),
                            translations: {},
                            embedTypes: metadata.embedTypes,
                            user: user
                        };
                        return [2 /*return*/, this.renderer(model)];
                }
            });
        });
    };
    /**
     * Overrides the default renderer.
     * @param renderer
     */
    H5PPlayer.prototype.setRenderer = function (renderer) {
        log.info('changing renderer');
        this.renderer = renderer;
        return this;
    };
    /**
     *
     * @param dependencies
     * @param libraries
     * @param assets
     * @param loaded
     * @returns aggregated asset lists
     */
    H5PPlayer.prototype.aggregateAssetsRecursive = function (dependencies, libraries, assets, loaded) {
        var _a, _b, _c, _d;
        var _this = this;
        if (assets === void 0) { assets = (_a = { scripts: [], styles: [], translations: [] }, _b = _a.scripts, _c = _a.styles, _d = _a.translations, _a); }
        if (loaded === void 0) { loaded = {}; }
        log.verbose("loading assets from dependencies: " + dependencies
            .map(function (dep) { return LibraryName_1["default"].toUberName(dep); })
            .join(', '));
        dependencies.forEach(function (dependency) {
            var key = LibraryName_1["default"].toUberName(dependency);
            if (key in loaded)
                return;
            loaded[key] = true;
            var lib = libraries[key];
            if (lib) {
                _this.aggregateAssetsRecursive(lib.preloadedDependencies || [], libraries, assets, loaded);
                (lib.preloadedCss || []).forEach(function (asset) {
                    return assets.styles.push(_this.urlGenerator.libraryFile(dependency, asset.path));
                });
                (lib.preloadedJs || []).forEach(function (script) {
                    return assets.scripts.push(_this.urlGenerator.libraryFile(dependency, script.path));
                });
            }
        });
        return assets;
    };
    /**
     * Scans the parameters for occurances of the regex pattern in any string
     * property.
     * @param parameters the parameters (= content.json)
     * @param regex the regex to look for
     * @returns true if the regex occurs in a string inside the parametres
     */
    H5PPlayer.prototype.checkIfRegexIsInParameters = function (parameters, regex) {
        var type = typeof parameters;
        if (type === 'string') {
            if (regex.test(parameters)) {
                return true;
            }
        }
        else if (type === 'object') {
            // tslint:disable-next-line: forin
            for (var property in parameters) {
                var found = this.checkIfRegexIsInParameters(parameters[property], regex);
                if (found) {
                    return true;
                }
            }
        }
        return false;
    };
    H5PPlayer.prototype.generateIntegration = function (contentId, parameters, metadata, assets, supportsFullscreen) {
        var _a;
        var _b;
        // see https://h5p.org/creating-your-own-h5p-plugin
        log.info("generating integration for " + contentId);
        return __assign({ contents: (_a = {},
                _a["cid-" + contentId] = {
                    displayOptions: {
                        copy: false,
                        copyright: false,
                        embed: false,
                        "export": false,
                        frame: false,
                        icon: false
                    },
                    fullScreen: supportsFullscreen ? '1' : '0',
                    jsonContent: JSON.stringify(parameters),
                    library: ContentMetadata_1.ContentMetadata.toUbername(metadata),
                    contentUrl: (_b = this.config.contentFilesUrlPlayerOverride) === null || _b === void 0 ? void 0 : _b.replace('{{contentId}}', contentId),
                    metadata: {
                        license: metadata.license || 'U',
                        title: metadata.title || '',
                        defaultLanguage: metadata.language || 'en'
                    },
                    scripts: this.listCoreScripts()
                        .concat(this.globalCustomScripts)
                        .concat(assets.scripts),
                    styles: this.listCoreStyles().concat(assets.styles)
                },
                _a), core: {
                scripts: this.listCoreScripts().concat(this.globalCustomScripts),
                styles: this.listCoreStyles()
            }, l10n: {
                H5P: this.clientTranslation
            }, libraryConfig: this.config.libraryConfig, postUserStatistics: false, saveFreq: false, url: this.config.baseUrl, hubIsEnabled: true, fullscreenDisabled: this.config.disableFullscreen ? 1 : 0 }, this.integrationObjectDefaults);
    };
    /**
     * Finds out which adds should be added to the library due to the settings
     * in the global configuration or in the library metadata.
     * @param machineName the machine name of the library to which addons should
     * be added
     * @param installedAddons a list of installed addons on the system
     * @returns the list of addons to install
     */
    H5PPlayer.prototype.getAddonsByLibrary = function (machineName, installedAddons) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        return __awaiter(this, void 0, void 0, function () {
            var neededAddons, _i, installedAddons_1, installedAddon, configRequestedAddons, _l, configRequestedAddons_1, addonMachineName, installedAddonVersions;
            return __generator(this, function (_m) {
                switch (_m.label) {
                    case 0:
                        neededAddons = [];
                        // add addons that are required by the H5P library metadata extension
                        for (_i = 0, installedAddons_1 = installedAddons; _i < installedAddons_1.length; _i++) {
                            installedAddon = installedAddons_1[_i];
                            // The property addTo.player.machineNames is a custom
                            // h5p-nodejs-library extension.
                            if (((_c = (_b = (_a = installedAddon.addTo) === null || _a === void 0 ? void 0 : _a.player) === null || _b === void 0 ? void 0 : _b.machineNames) === null || _c === void 0 ? void 0 : _c.includes(machineName)) || ((_f = (_e = (_d = installedAddon.addTo) === null || _d === void 0 ? void 0 : _d.player) === null || _e === void 0 ? void 0 : _e.machineNames) === null || _f === void 0 ? void 0 : _f.includes('*'))) {
                                log.debug("Addon " + LibraryName_1["default"].toUberName(installedAddon) + " will be added to the player.");
                                neededAddons.push(installedAddon);
                            }
                        }
                        configRequestedAddons = __spreadArrays(((_h = (_g = this.config.playerAddons) === null || _g === void 0 ? void 0 : _g[machineName]) !== null && _h !== void 0 ? _h : []), ((_k = (_j = this.config.playerAddons) === null || _j === void 0 ? void 0 : _j['*']) !== null && _k !== void 0 ? _k : []));
                        _l = 0, configRequestedAddons_1 = configRequestedAddons;
                        _m.label = 1;
                    case 1:
                        if (!(_l < configRequestedAddons_1.length)) return [3 /*break*/, 4];
                        addonMachineName = configRequestedAddons_1[_l];
                        return [4 /*yield*/, this.libraryManager.listInstalledLibraries([addonMachineName])];
                    case 2:
                        installedAddonVersions = _m.sent();
                        if (!neededAddons
                            .map(function (a) { return a.machineName; })
                            .includes(addonMachineName) &&
                            installedAddonVersions[addonMachineName] !== undefined) {
                            log.debug("Addon " + addonMachineName + " will be added to the player.");
                            neededAddons.push(installedAddonVersions[addonMachineName].sort()[installedAddonVersions[addonMachineName].length - 1]);
                        }
                        _m.label = 3;
                    case 3:
                        _l++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, neededAddons];
                }
            });
        });
    };
    /**
     * Determines which addons should be used for the parameters. It will scan
     * the parameters for patterns specified by installed addons.
     * @param parameters the parameters to scan
     * @param installedAddons a list of addons installed on the system
     * @returns a list of addons that should be used
     */
    H5PPlayer.prototype.getAddonsByParameters = function (parameters, installedAddons) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var addonsToAdd, _i, installedAddons_2, installedAddon, _c, _d, types, matches;
            return __generator(this, function (_e) {
                log.debug('Checking which of the addons must be used for the content.');
                addonsToAdd = {};
                for (_i = 0, installedAddons_2 = installedAddons; _i < installedAddons_2.length; _i++) {
                    installedAddon = installedAddons_2[_i];
                    if (!((_b = (_a = installedAddon.addTo) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.types)) {
                        continue;
                    }
                    for (_c = 0, _d = installedAddon.addTo.content.types; _c < _d.length; _c++) {
                        types = _d[_c];
                        if (types.text) {
                            matches = /^\/(.+?)\/([gimy]+)?$/.exec(types.text.regex);
                            if (matches.length < 1) {
                                log.error("The addon " + LibraryName_1["default"].toUberName(installedAddon) + " contains an invalid regexp pattern in the addTo selector: " + types.text.regex + ". This will be silently ignored, but the addon will never be used!");
                                continue;
                            }
                            if (this.checkIfRegexIsInParameters(parameters, new RegExp(matches[1], matches[2]))) {
                                log.debug("Adding addon " + LibraryName_1["default"].toUberName(installedAddon) + " to dependencies as the regexp pattern " + types.text.regex + " was found in the parameters.");
                                addonsToAdd[installedAddon.machineName] = installedAddon;
                            }
                        }
                    }
                }
                return [2 /*return*/, Object.values(addonsToAdd)];
            });
        });
    };
    H5PPlayer.prototype.getDownloadPath = function (contentId) {
        return this.urlGenerator.downloadPackage(contentId);
    };
    H5PPlayer.prototype.getMetadata = function (machineName, majorVersion, minorVersion) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                log.verbose("loading library " + machineName + "-" + majorVersion + "." + minorVersion);
                return [2 /*return*/, this.libraryStorage.getLibrary(new LibraryName_1["default"](machineName, majorVersion, minorVersion))];
            });
        });
    };
    /**
     *
     * @param dependencies
     * @param loaded can be left out in initial call
     */
    H5PPlayer.prototype.getMetadataRecursive = function (dependencies, loaded) {
        if (loaded === void 0) { loaded = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.verbose("loading libraries from dependencies: " + dependencies
                            .map(function (dep) { return LibraryName_1["default"].toUberName(dep); })
                            .join(', '));
                        return [4 /*yield*/, Promise.all(dependencies.map(function (dependency) { return __awaiter(_this, void 0, void 0, function () {
                                var name, majVer, minVer, key, lib, _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            name = dependency.machineName;
                                            majVer = dependency.majorVersion;
                                            minVer = dependency.minorVersion;
                                            key = LibraryName_1["default"].toUberName(dependency);
                                            if (key in loaded) {
                                                return [2 /*return*/];
                                            }
                                            _b.label = 1;
                                        case 1:
                                            _b.trys.push([1, 3, , 4]);
                                            return [4 /*yield*/, this.getMetadata(name, majVer, minVer)];
                                        case 2:
                                            lib = _b.sent();
                                            return [3 /*break*/, 4];
                                        case 3:
                                            _a = _b.sent();
                                            log.info("Could not find library " + name + "-" + majVer + "." + minVer + " in storage. Silently ignoring...");
                                            return [3 /*break*/, 4];
                                        case 4:
                                            if (!lib) return [3 /*break*/, 6];
                                            loaded[key] = lib;
                                            return [4 /*yield*/, this.getMetadataRecursive(lib.preloadedDependencies || [], loaded)];
                                        case 5:
                                            _b.sent();
                                            _b.label = 6;
                                        case 6: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, loaded];
                }
            });
        });
    };
    H5PPlayer.prototype.listCoreScripts = function () {
        return playerAssetList_json_1["default"].scripts.core.map(this.urlGenerator.coreFile);
    };
    H5PPlayer.prototype.listCoreStyles = function () {
        return playerAssetList_json_1["default"].styles.core.map(this.urlGenerator.coreFile);
    };
    return H5PPlayer;
}());
exports["default"] = H5PPlayer;
//# sourceMappingURL=H5PPlayer.js.map