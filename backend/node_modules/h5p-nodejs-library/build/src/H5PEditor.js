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
var ajv_1 = __importDefault(require("ajv"));
var ajv_keywords_1 = __importDefault(require("ajv-keywords"));
var stream_1 = require("stream");
var tmp_promise_1 = require("tmp-promise");
var fs_extra_1 = __importDefault(require("fs-extra"));
var image_size_1 = __importDefault(require("image-size"));
var mime_types_1 = __importDefault(require("mime-types"));
var path_1 = __importDefault(require("path"));
var promisepipe_1 = __importDefault(require("promisepipe"));
var defaultClientStrings_json_1 = __importDefault(require("../assets/defaultClientStrings.json"));
var defaultCopyrightSemantics_json_1 = __importDefault(require("../assets/defaultCopyrightSemantics.json"));
var defaultMetadataSemantics_json_1 = __importDefault(require("../assets/defaultMetadataSemantics.json"));
var en_json_1 = __importDefault(require("../assets/translations/client/en.json"));
var en_json_2 = __importDefault(require("../assets/translations/copyright-semantics/en.json"));
var en_json_3 = __importDefault(require("../assets/translations/metadata-semantics/en.json"));
var editorAssetList_json_1 = __importDefault(require("./editorAssetList.json"));
var default_1 = __importDefault(require("./renderers/default"));
var editorLanguages_json_1 = __importDefault(require("../assets/editorLanguages.json"));
var ContentManager_1 = __importDefault(require("./ContentManager"));
var ContentMetadata_1 = require("./ContentMetadata");
var ContentStorer_1 = __importDefault(require("./ContentStorer"));
var ContentTypeCache_1 = __importDefault(require("./ContentTypeCache"));
var ContentTypeInformationRepository_1 = __importDefault(require("./ContentTypeInformationRepository"));
var H5pError_1 = __importDefault(require("./helpers/H5pError"));
var Logger_1 = __importDefault(require("./helpers/Logger"));
var LibraryManager_1 = __importDefault(require("./LibraryManager"));
var LibraryName_1 = __importDefault(require("./LibraryName"));
var PackageExporter_1 = __importDefault(require("./PackageExporter"));
var PackageImporter_1 = __importDefault(require("./PackageImporter"));
var TemporaryFileManager_1 = __importDefault(require("./TemporaryFileManager"));
var UrlGenerator_1 = __importDefault(require("./UrlGenerator"));
var SemanticsLocalizer_1 = __importDefault(require("./SemanticsLocalizer"));
var SimpleTranslator_1 = __importDefault(require("./helpers/SimpleTranslator"));
var DependencyGetter_1 = __importDefault(require("./DependencyGetter"));
var log = new Logger_1["default"]('H5PEditor');
var H5PEditor = /** @class */ (function () {
    /**
     * @param cache the cache is used to store key - value pairs that must be
     * accessed often; values stored in it must be accessible by ALL instances
     * of the editor (across machines)
     * @param config the configuration values for the editor; note that the
     * editor can also change these values and save them!
     * @param libraryStorage the storage object for libraries
     * @param contentStorage the storage object for content
     * @param temporaryStorage the storage object for temporary files
     * @param translationCallback a function that is called to retrieve
     * translations of keys in a certain language; the keys use the i18next
     * format (e.g. namespace:key). See the ITranslationFunction documentation
     * for more details.
     */
    function H5PEditor(cache, config, libraryStorage, contentStorage, temporaryStorage, translationCallback, urlGenerator) {
        if (translationCallback === void 0) { translationCallback = new SimpleTranslator_1["default"]({
            // We use a simplistic translation function that is hard-wired to
            // English if the implementation does not pass us a proper one.
            client: en_json_1["default"],
            'metadata-semantics': en_json_3["default"],
            'copyright-semantics': en_json_2["default"]
        }).t; }
        if (urlGenerator === void 0) { urlGenerator = new UrlGenerator_1["default"](config); }
        this.cache = cache;
        this.config = config;
        this.libraryStorage = libraryStorage;
        this.contentStorage = contentStorage;
        this.temporaryStorage = temporaryStorage;
        this.urlGenerator = urlGenerator;
        this.copyrightSemantics = defaultCopyrightSemantics_json_1["default"];
        this.metadataSemantics = defaultMetadataSemantics_json_1["default"];
        log.info('initialize');
        this.config = config;
        this.renderer = default_1["default"];
        this.contentTypeCache = new ContentTypeCache_1["default"](config, cache);
        this.libraryManager = new LibraryManager_1["default"](libraryStorage, this.urlGenerator.libraryFile);
        this.contentManager = new ContentManager_1["default"](contentStorage);
        this.contentTypeRepository = new ContentTypeInformationRepository_1["default"](this.contentTypeCache, this.libraryManager, config);
        this.temporaryFileManager = new TemporaryFileManager_1["default"](temporaryStorage, this.config);
        this.contentStorer = new ContentStorer_1["default"](this.contentManager, this.libraryManager, this.temporaryFileManager);
        this.packageImporter = new PackageImporter_1["default"](this.libraryManager, this.config, this.contentManager, this.contentStorer);
        this.packageExporter = new PackageExporter_1["default"](this.libraryStorage, this.contentStorage, config);
        this.semanticsLocalizer = new SemanticsLocalizer_1["default"](translationCallback);
        this.dependencyGetter = new DependencyGetter_1["default"](libraryStorage);
        var jsonValidator = new ajv_1["default"]();
        ajv_keywords_1["default"](jsonValidator, 'regexp');
        var saveMetadataJsonSchema = require('./schemas/save-metadata.json');
        var libraryNameSchema = require('./schemas/library-name-schema.json');
        jsonValidator.addSchema([saveMetadataJsonSchema, libraryNameSchema]);
        this.contentMetadataValidator = jsonValidator.compile(saveMetadataJsonSchema);
    }
    /**
     * Deletes a piece of content and all files dependent on it.
     * @param contentId the piece of content to delete
     * @param user the user who wants to delete it
     */
    H5PEditor.prototype.deleteContent = function (contentId, user) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.contentManager.deleteContent(contentId, user)];
            });
        });
    };
    /**
     * Creates a .h5p-package for the specified content file and pipes it to the stream.
     * Throws H5pErrors if something goes wrong. The contents of the stream should be disregarded then.
     * @param contentId The contentId for which the package should be created.
     * @param outputWritable The writable that the package is written to (e.g. the response stream fo Express)
     */
    H5PEditor.prototype.exportContent = function (contentId, outputWritable, user) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.packageExporter.createPackage(contentId, outputWritable, user)];
            });
        });
    };
    /**
     * Returns all the data needed to editor or display content
     * @param contentId the content id
     * @param user (optional) the user who wants to access the content; if undefined, access will be granted
     * @returns all relevant information for the content (you can send it back to the GET request for content)
     */
    H5PEditor.prototype.getContent = function (contentId, user) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, h5pJson, content;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        log.info("loading h5p for " + contentId);
                        return [4 /*yield*/, Promise.all([
                                this.contentManager.getContentMetadata(contentId, user),
                                this.contentManager.getContentParameters(contentId, user)
                            ])];
                    case 1:
                        _a = _b.sent(), h5pJson = _a[0], content = _a[1];
                        return [2 /*return*/, {
                                h5p: h5pJson,
                                library: ContentMetadata_1.ContentMetadata.toUbername(h5pJson),
                                params: {
                                    metadata: h5pJson,
                                    params: content
                                }
                            }];
                }
            });
        });
    };
    /**
     * Returns a readable for a file that was uploaded for a content object.
     * The requested content file can be a temporary file uploaded for unsaved content or a
     * file in permanent content storage.
     * @param contentId the content id (undefined if retrieved for unsaved content)
     * @param filename the file to get (without 'content/' prefix!)
     * @param user the user who wants to retrieve the file
     * @param rangeStart (optional) the position in bytes at which the stream should start
     * @param rangeEnd (optional) the position in bytes at which the stream should end
     * @returns a readable of the content file
     */
    H5PEditor.prototype.getContentFileStream = function (contentId, filename, user, rangeStart, rangeEnd) {
        return __awaiter(this, void 0, void 0, function () {
            var returnStream, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!contentId) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.contentManager.getContentFileStream(contentId, filename, user, rangeStart, rangeEnd)];
                    case 2:
                        returnStream = _a.sent();
                        return [2 /*return*/, returnStream];
                    case 3:
                        error_1 = _a.sent();
                        log.debug("Couldn't find file " + filename + " in storage. Trying temporary storage.");
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, this.temporaryFileManager.getFileStream(filename, user, rangeStart, rangeEnd)];
                }
            });
        });
    };
    /**
     * Returns the content type cache for a specific user. This includes all available content types for the user (some
     * might be restricted) and what the user can do with them (update, install from Hub).
     */
    H5PEditor.prototype.getContentTypeCache = function (user) {
        log.info("getting content type cache");
        return this.contentTypeRepository.get(user);
    };
    /**
     * Returns detailed information about an installed library.
     */
    H5PEditor.prototype.getLibraryData = function (machineName, majorVersion, minorVersion, language) {
        if (language === void 0) { language = 'en'; }
        return __awaiter(this, void 0, void 0, function () {
            var majorVersionAsNr, minorVersionAsNr, library, _a, assets, semantics, languageObject, languages, installedLibrary, upgradeScriptPath;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        log.info("getting data for library " + machineName + "-" + majorVersion + "." + minorVersion);
                        majorVersionAsNr = Number.parseInt(majorVersion, 10);
                        minorVersionAsNr = Number.parseInt(minorVersion, 10);
                        library = new LibraryName_1["default"](machineName, majorVersionAsNr, minorVersionAsNr);
                        this.validateLanguageCode(language);
                        return [4 /*yield*/, this.libraryManager.libraryExists(library)];
                    case 1:
                        if (!(_b.sent())) {
                            throw new H5pError_1["default"]('library-not-found', { name: LibraryName_1["default"].toUberName(library) }, 404);
                        }
                        return [4 /*yield*/, Promise.all([
                                this.listAssets(new LibraryName_1["default"](machineName, majorVersionAsNr, minorVersionAsNr), language),
                                this.libraryManager.getSemantics(library),
                                this.libraryManager.getLanguage(library, language),
                                this.libraryManager.listLanguages(library),
                                this.libraryManager.getLibrary(library),
                                this.libraryManager.getUpgradesScriptPath(library)
                            ])];
                    case 2:
                        _a = _b.sent(), assets = _a[0], semantics = _a[1], languageObject = _a[2], languages = _a[3], installedLibrary = _a[4], upgradeScriptPath = _a[5];
                        return [2 /*return*/, {
                                languages: languages,
                                semantics: semantics,
                                css: assets.styles,
                                defaultLanguage: null,
                                language: languageObject,
                                name: machineName,
                                version: {
                                    major: majorVersionAsNr,
                                    minor: minorVersionAsNr
                                },
                                javascript: assets.scripts,
                                title: installedLibrary.title,
                                translations: assets.translations,
                                upgradesScript: upgradeScriptPath // we don't check whether the path is null, as we can return null
                            }];
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
    H5PEditor.prototype.getLibraryFileStream = function (library, filename) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                LibraryName_1["default"].validate(library);
                return [2 /*return*/, this.libraryManager.getFileStream(library, filename)];
            });
        });
    };
    /**
     * Gets a rough overview of information about the requested libraries.
     * @param ubernames
     */
    H5PEditor.prototype.getLibraryOverview = function (ubernames) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.info("getting library overview for libraries: " + ubernames.join(', '));
                        return [4 /*yield*/, Promise.all(ubernames
                                .map(function (name) {
                                return LibraryName_1["default"].fromUberName(name, {
                                    useWhitespace: true
                                });
                            })
                                .filter(function (lib) { return lib !== undefined; }) // we filter out undefined values as Library.creatFromNames returns undefined for invalid names
                                .map(function (lib) { return __awaiter(_this, void 0, void 0, function () {
                                var loadedLibrary, error_2;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            _a.trys.push([0, 2, , 3]);
                                            return [4 /*yield*/, this.libraryManager.getLibrary(lib)];
                                        case 1:
                                            loadedLibrary = _a.sent();
                                            if (!loadedLibrary) {
                                                return [2 /*return*/, undefined];
                                            }
                                            return [2 /*return*/, {
                                                    majorVersion: loadedLibrary.majorVersion,
                                                    metadataSettings: null,
                                                    minorVersion: loadedLibrary.minorVersion,
                                                    name: loadedLibrary.machineName,
                                                    restricted: false,
                                                    runnable: loadedLibrary.runnable,
                                                    title: loadedLibrary.title,
                                                    tutorialUrl: '',
                                                    uberName: loadedLibrary.machineName + " " + loadedLibrary.majorVersion + "." + loadedLibrary.minorVersion
                                                }];
                                        case 2:
                                            error_2 = _a.sent();
                                            // if a library can't be loaded the whole call should still succeed
                                            return [2 /*return*/, undefined];
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 1: return [2 /*return*/, (_a.sent()).filter(function (lib) { return lib !== undefined; })]; // we filter out undefined values as the last map return undefined values if a library doesn't exist
                }
            });
        });
    };
    /**
     * Installs a content type from the H5P Hub.
     * @param machineName The name of the content type to install (e.g. H5P.Test) Note that this is not a full ubername!
     * @returns a list of installed libraries if successful. Will throw errors if something goes wrong.
     */
    H5PEditor.prototype.installLibraryFromHub = function (machineName, user) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                LibraryName_1["default"].validateMachineName(machineName);
                return [2 /*return*/, this.contentTypeRepository.installContentType(machineName, user)];
            });
        });
    };
    /**
     * Retrieves the installed languages for libraries
     * @param libraryUbernames A list of libraries for which the language files should be retrieved.
     *                     In this list the names of the libraries don't use hyphens to separate
     *                     machine name and version.
     * @param language the language code to get the files for
     * @returns The strings of the language files
     */
    H5PEditor.prototype.listLibraryLanguageFiles = function (libraryUbernames, language) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.info("getting language files (" + language + ") for " + libraryUbernames.join(', '));
                        this.validateLanguageCode(language);
                        return [4 /*yield*/, Promise.all(libraryUbernames.map(function (name) { return __awaiter(_this, void 0, void 0, function () {
                                var lib;
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            lib = LibraryName_1["default"].fromUberName(name, {
                                                useWhitespace: true
                                            });
                                            _a = {};
                                            return [4 /*yield*/, this.libraryManager.getLanguage(lib, language)];
                                        case 1: return [2 /*return*/, (_a.languageString = _b.sent(),
                                                _a.name = name,
                                                _a)];
                                    }
                                });
                            }); }))];
                    case 1: return [2 /*return*/, (_a.sent()).reduce(function (builtObject, _a) {
                            var languageString = _a.languageString, name = _a.name;
                            if (languageString) {
                                builtObject[name] = languageString;
                            }
                            return builtObject;
                        }, {})];
                }
            });
        });
    };
    /**
     * Renders the content. This means that a frame in which the editor is displayed is generated and returned. You can
     * override the default frame by calling setRenderer(...).
     * @param contentId
     * @returns the rendered frame that you can include in your website. Normally a string, but can be anything you want it to be if you override the renderer.
     */
    H5PEditor.prototype.render = function (contentId, language) {
        if (language === void 0) { language = 'en'; }
        log.info("rendering " + contentId);
        this.validateLanguageCode(language);
        var model = {
            integration: this.generateIntegration(contentId, language),
            scripts: this.listCoreScripts(language),
            styles: this.listCoreStyles(),
            urlGenerator: this.urlGenerator
        };
        return Promise.resolve(this.renderer(model));
    };
    /**
     * Stores an uploaded file in temporary storage.
     * @param contentId the id of the piece of content the file is attached to; Set to null/undefined if
     * the content hasn't been saved before.
     * @param field the semantic structure of the field the file is attached to.
     * @param file information about the uploaded file
     * @returns information about the uploaded file
     */
    H5PEditor.prototype.saveContentFile = function (contentId, field, file, user) {
        return __awaiter(this, void 0, void 0, function () {
            var imageDimensions, cleanFilename, dataStream, tmpFilename;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        try {
                            if (file.mimetype.startsWith('image/')) {
                                imageDimensions = image_size_1["default"](file.data);
                            }
                        }
                        catch (error) {
                            // A caught error means that the file format is not supported by image-size. This usually
                            // means that the file is corrupt.
                            log.debug("Invalid image upload: " + error);
                            throw new H5pError_1["default"]('upload-validation-error', {}, 400);
                        }
                        cleanFilename = 
                        // We check if the field type is allowed to protect against injections
                        (field.type &&
                            [
                                'file',
                                'text',
                                'number',
                                'boolean',
                                'group',
                                'list',
                                'select',
                                'library',
                                'image',
                                'video',
                                'audio'
                            ].includes(field.type)
                            ? field.type
                            : 'file') + path_1["default"].extname(file.name);
                        // Some PHP implementations of H5P (Moodle) expect the uploaded files to be in sub-directories of the content
                        // folder. To achieve compatibility, we also put them into these directories by their mime-types.
                        cleanFilename = this.addDirectoryByMimetype(cleanFilename);
                        dataStream = new stream_1.PassThrough();
                        dataStream.end(file.data);
                        log.info("Putting content file " + cleanFilename + " into temporary storage");
                        return [4 /*yield*/, this.temporaryFileManager.addFile(cleanFilename, dataStream, user)];
                    case 1:
                        tmpFilename = _a.sent();
                        log.debug("New temporary filename is " + tmpFilename);
                        return [2 /*return*/, {
                                height: imageDimensions === null || imageDimensions === void 0 ? void 0 : imageDimensions.height,
                                mime: file.mimetype,
                                path: tmpFilename + "#tmp",
                                width: imageDimensions === null || imageDimensions === void 0 ? void 0 : imageDimensions.width
                            }];
                }
            });
        });
    };
    /**
     * Stores new content or updates existing content.
     * Copies over files from temporary storage if necessary.
     * @param contentId the contentId of existing content (undefined or previously unsaved content)
     * @param parameters the content parameters (=content.json)
     * @param metadata the content metadata (~h5p.json)
     * @param mainLibraryUbername the ubername with whitespace as separator (no hyphen!)
     * @param user the user who wants to save the piece of content
     * @returns the existing contentId or the newly assigned one
     */
    H5PEditor.prototype.saveOrUpdateContent = function (contentId, parameters, metadata, mainLibraryUbername, user) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.saveOrUpdateContentReturnMetaData(contentId, parameters, metadata, mainLibraryUbername, user)];
                    case 1: return [2 /*return*/, (_a.sent()).id];
                }
            });
        });
    };
    /**
     * Stores new content or updates existing content.
     * Copies over files from temporary storage if necessary.
     * @param contentId the contentId of existing content (undefined or previously unsaved content)
     * @param parameters the content parameters (=content.json)
     * @param metadata the content metadata (~h5p.json)
     * @param mainLibraryUbername the ubername with whitespace as separator (no hyphen!)
     * @param user the user who wants to save the piece of content
     * @returns the existing contentId or the newly assigned one and the metatdata
     */
    H5PEditor.prototype.saveOrUpdateContentReturnMetaData = function (contentId, parameters, metadata, mainLibraryUbername, user) {
        return __awaiter(this, void 0, void 0, function () {
            var libraryName, h5pJson, newContentId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (contentId !== undefined) {
                            log.info("saving h5p content for " + contentId);
                        }
                        else {
                            log.info('saving new content');
                        }
                        try {
                            libraryName = LibraryName_1["default"].fromUberName(mainLibraryUbername, {
                                useWhitespace: true
                            });
                        }
                        catch (error) {
                            throw new H5pError_1["default"]('invalid-main-library-name', { message: error.message }, 400);
                        }
                        // Validate metadata against schema
                        if (!this.contentMetadataValidator(metadata)) {
                            throw new Error('Metadata does not conform to schema.');
                        }
                        return [4 /*yield*/, this.generateContentMetadata(metadata, libraryName, this.findLibrariesInParameters(parameters))];
                    case 1:
                        h5pJson = _a.sent();
                        return [4 /*yield*/, this.contentStorer.addOrUpdateContent(contentId, parameters, h5pJson, libraryName, user)];
                    case 2:
                        newContentId = _a.sent();
                        return [2 /*return*/, { id: newContentId, metadata: h5pJson }];
                }
            });
        });
    };
    /**
     * By setting custom copyright semantics, you can customize what licenses
     * are displayed when editing metadata of files.
     *
     * NOTE: It is unclear if copyrightSemantics is deprecated in the H5P
     * client. Use setMetadataSemantics instead, which certainly works.
     *
     * NOTE: The semantic structure is localized before delivered to the H5P
     * client. If you change it, you must either make sure there is a appropriate
     * language file loaded in your translation library (and set one in the
     * first place).
     * @param copyrightSemantics a semantic structure similar to the one used in
     * semantics.json of regular H5P libraries. See https://h5p.org/semantics
     * for more documentation. However, you can only add one entry (which can
     * be nested). See the file assets/defaultCopyrightSemantics.json for the
     * default version which you can build on.
     * @returns the H5PEditor object that you can use to chain method calls
     */
    H5PEditor.prototype.setCopyrightSemantics = function (copyrightSemantics) {
        this.copyrightSemantics = copyrightSemantics;
        return this;
    };
    /**
     * By setting custom metadata semantics, you can customize what licenses are
     * displayed when editing metadata of content object and files.
     *
     * NOTE: It is only trivial to change the license offered as a a selection
     * to the editors. All other semantic entries CANNOT be changed, as the
     * form displayed in the editor is hard-coded in h5peditor-metadata.js in
     * the client. You'll have to replace this file with a custom implementation
     * if you want to change more metadata.
     *
     * NOTE: The semantic structure is localized before delivered to the H5P
     * client. If you change it, you must either make sure there is a appropriate
     * language file loaded in your translation library (and set one in the
     * first place).
     * @param metadataSemantics a semantic structure similar to the one used in
     * semantics.json of regular H5P libraries. See https://h5p.org/semantics
     * for more documentation. See the file assets/defaultMetadataSemantics.json
     * for the default version which you can build on
     * @returns the H5PEditor object that you can use to chain method calls
     */
    H5PEditor.prototype.setMetadataSemantics = function (metadataSemantics) {
        this.metadataSemantics = metadataSemantics;
        return this;
    };
    /**
     * By setting a custom renderer you can change the way the editor produces
     * HTML output
     * @param renderer
     * @returns the H5PEditor object that you can use to chain method calls
     */
    H5PEditor.prototype.setRenderer = function (renderer) {
        this.renderer = renderer;
        return this;
    };
    /**
     * Adds the contents of a package to the system: Installs required libraries (if
     * the user has the permissions for this), adds files to temporary storage and
     * returns the actual content information for the editor to process.
     * Throws errors if something goes wrong.
     * @param data the raw data of the h5p package as a buffer
     * @param user the user who is uploading the package; optional if onlyInstallLibraries
     * is set to true
     * @param options (optional) further options:
     * @param onlyInstallLibraries true if content should be disregarded
     * @returns the content information extracted from the package. The metadata
     * and parameters property will be undefined if onlyInstallLibraries was set
     * to true.
     */
    H5PEditor.prototype.uploadPackage = function (data, user, options) {
        return __awaiter(this, void 0, void 0, function () {
            var dataStream, returnValues;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.info("uploading package");
                        dataStream = new stream_1.PassThrough();
                        dataStream.end(data);
                        return [4 /*yield*/, tmp_promise_1.withFile(function (_a) {
                                var tempPackagePath = _a.path;
                                return __awaiter(_this, void 0, void 0, function () {
                                    var writeStream, error_3;
                                    var _b;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0:
                                                writeStream = fs_extra_1["default"].createWriteStream(tempPackagePath);
                                                _c.label = 1;
                                            case 1:
                                                _c.trys.push([1, 3, , 4]);
                                                return [4 /*yield*/, promisepipe_1["default"](dataStream, writeStream)];
                                            case 2:
                                                _c.sent();
                                                return [3 /*break*/, 4];
                                            case 3:
                                                error_3 = _c.sent();
                                                throw new H5pError_1["default"]('upload-package-failed-tmp');
                                            case 4:
                                                if (!(options === null || options === void 0 ? void 0 : options.onlyInstallLibraries)) return [3 /*break*/, 6];
                                                _b = {};
                                                return [4 /*yield*/, this.packageImporter.installLibrariesFromPackage(tempPackagePath)];
                                            case 5:
                                                returnValues = (_b.installedLibraries = _c.sent(),
                                                    _b);
                                                return [3 /*break*/, 8];
                                            case 6: return [4 /*yield*/, this.packageImporter.addPackageLibrariesAndTemporaryFiles(tempPackagePath, user)];
                                            case 7:
                                                returnValues = _c.sent();
                                                _c.label = 8;
                                            case 8: return [2 /*return*/];
                                        }
                                    });
                                });
                            }, { postfix: '.h5p', keep: false })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, returnValues];
                }
            });
        });
    };
    /**
     * If a file is a video, an audio file or an image, the filename is suffixed
     * with the corresponding directory (videos, audios, images).
     * @param filename the filename including the file extension
     * @returns the path including the directory; the same if the filename is not a video, audio file or image
     */
    H5PEditor.prototype.addDirectoryByMimetype = function (filename) {
        var mimetype = mime_types_1["default"].lookup(filename);
        if (mimetype !== false) {
            if (mimetype.startsWith('video')) {
                return "videos/" + filename;
            }
            if (mimetype.startsWith('audio')) {
                return "audios/" + filename;
            }
            if (mimetype.startsWith('image')) {
                return "images/" + filename;
            }
        }
        return filename;
    };
    /**
     * Recursively crawls through the parameters and finds usages of libraries.
     * @param parameters the parameters to scan
     * @param collect a collecting object used by the recursion. Do not use
     * @returns a list of libraries that are referenced in the parameters
     */
    H5PEditor.prototype.findLibrariesInParameters = function (parameters, collect) {
        var _this = this;
        if (collect === void 0) { collect = {}; }
        if (parameters === undefined ||
            parameters === null ||
            typeof parameters !== 'object') {
            return collect;
        }
        Object.keys(parameters).forEach(function (key) {
            if (key === 'library' && typeof parameters[key] === 'string') {
                if (parameters[key].match(/.+ \d+\.\d+/)) {
                    collect[parameters[key]] = LibraryName_1["default"].fromUberName(parameters[key], {
                        useWhitespace: true
                    });
                }
            }
            else {
                _this.findLibrariesInParameters(parameters[key], collect);
            }
        });
        return Object.values(collect);
    };
    H5PEditor.prototype.generateContentMetadata = function (metadata, mainLibrary, contentDependencies) {
        if (contentDependencies === void 0) { contentDependencies = []; }
        return __awaiter(this, void 0, void 0, function () {
            var mainLibraryMetadata, newMetadata, _a, _b;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        log.info("generating h5p.json");
                        return [4 /*yield*/, this.libraryManager.getLibrary(mainLibrary)];
                    case 1:
                        mainLibraryMetadata = _d.sent();
                        _a = ContentMetadata_1.ContentMetadata.bind;
                        _b = [void 0, metadata,
                            { mainLibrary: mainLibraryMetadata.machineName }];
                        _c = {};
                        return [4 /*yield*/, this.dependencyGetter.getDependentLibraries(__spreadArrays(contentDependencies, [mainLibrary]), {
                                preloaded: true
                            }, [mainLibrary])];
                    case 2:
                        newMetadata = new (_a.apply(ContentMetadata_1.ContentMetadata, _b.concat([(_c.preloadedDependencies = __spreadArrays.apply(void 0, [(_d.sent()), [
                                    mainLibrary
                                ]]),
                                _c)])))();
                        return [2 /*return*/, newMetadata];
                }
            });
        });
    };
    H5PEditor.prototype.generateEditorIntegration = function (contentId, language) {
        log.info("generating integration for " + contentId);
        return {
            ajaxPath: "" + this.config.baseUrl + this.config.ajaxUrl + "?action=",
            apiVersion: {
                majorVersion: this.config.coreApiVersion.major,
                minorVersion: this.config.coreApiVersion.minor
            },
            assets: {
                css: this.listCoreStyles(),
                js: this.listCoreScripts(language)
            },
            copyrightSemantics: this.semanticsLocalizer.localize(this.copyrightSemantics, language),
            filesPath: this.urlGenerator.temporaryFiles(),
            libraryUrl: this.urlGenerator.editorLibraryFiles(),
            metadataSemantics: this.semanticsLocalizer.localize(this.metadataSemantics, language),
            nodeVersionId: contentId,
            language: language
        };
    };
    H5PEditor.prototype.generateIntegration = function (contentId, language) {
        return {
            ajax: {
                contentUserData: this.config.baseUrl + "/contentUserData",
                setFinished: this.config.baseUrl + "/setFinished"
            },
            ajaxPath: "" + this.config.baseUrl + this.config.ajaxUrl + "?action=",
            editor: this.generateEditorIntegration(contentId, language),
            hubIsEnabled: true,
            l10n: {
                H5P: this.semanticsLocalizer.localize(defaultClientStrings_json_1["default"], language, true)
            },
            libraryConfig: this.config.libraryConfig,
            postUserStatistics: false,
            saveFreq: false,
            libraryUrl: this.urlGenerator.coreFile('js'),
            pluginCacheBuster: '',
            url: this.config.baseUrl,
            fullscreenDisabled: this.config.disableFullscreen ? 1 : 0,
            user: {
                mail: '',
                name: ''
            }
        };
    };
    /**
     * Returns a list of addons that should be used for the library
     * @param machineName the library identified by its machine name
     * @returns a list of addons
     */
    H5PEditor.prototype.getAddonsForLibrary = function (machineName) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        return __awaiter(this, void 0, void 0, function () {
            var installedAddons, neededAddons, _i, installedAddons_1, installedAddon, configRequestedAddons, _l, configRequestedAddons_1, addonMachineName, installedAddonVersions;
            return __generator(this, function (_m) {
                switch (_m.label) {
                    case 0:
                        log.debug('Getting list of installed addons.');
                        return [4 /*yield*/, this.libraryManager.listAddons()];
                    case 1:
                        installedAddons = _m.sent();
                        neededAddons = [];
                        // add addons that are required by the H5P library metadata extension
                        for (_i = 0, installedAddons_1 = installedAddons; _i < installedAddons_1.length; _i++) {
                            installedAddon = installedAddons_1[_i];
                            // The property addTo.editor.machineNames is a custom
                            // h5p-nodejs-library extension.
                            if (((_c = (_b = (_a = installedAddon.addTo) === null || _a === void 0 ? void 0 : _a.editor) === null || _b === void 0 ? void 0 : _b.machineNames) === null || _c === void 0 ? void 0 : _c.includes(machineName)) || ((_f = (_e = (_d = installedAddon.addTo) === null || _d === void 0 ? void 0 : _d.editor) === null || _e === void 0 ? void 0 : _e.machineNames) === null || _f === void 0 ? void 0 : _f.includes('*'))) {
                                log.debug("Addon " + LibraryName_1["default"].toUberName(installedAddon) + " will be added to the editor.");
                                neededAddons.push(installedAddon);
                            }
                        }
                        configRequestedAddons = __spreadArrays(((_h = (_g = this.config.editorAddons) === null || _g === void 0 ? void 0 : _g[machineName]) !== null && _h !== void 0 ? _h : []), ((_k = (_j = this.config.editorAddons) === null || _j === void 0 ? void 0 : _j['*']) !== null && _k !== void 0 ? _k : []));
                        _l = 0, configRequestedAddons_1 = configRequestedAddons;
                        _m.label = 2;
                    case 2:
                        if (!(_l < configRequestedAddons_1.length)) return [3 /*break*/, 5];
                        addonMachineName = configRequestedAddons_1[_l];
                        return [4 /*yield*/, this.libraryManager.listInstalledLibraries([addonMachineName])];
                    case 3:
                        installedAddonVersions = _m.sent();
                        if (!neededAddons
                            .map(function (a) { return a.machineName; })
                            .includes(addonMachineName) &&
                            installedAddonVersions[addonMachineName] !== undefined) {
                            log.debug("Addon " + addonMachineName + " will be added to the editor.");
                            neededAddons.push(installedAddonVersions[addonMachineName].sort()[installedAddonVersions[addonMachineName].length - 1]);
                        }
                        _m.label = 4;
                    case 4:
                        _l++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, neededAddons];
                }
            });
        });
    };
    /**
     * Returns a functions that replaces the h5p editor language file with the
     * one for the language desired. Checks if the H5P editor core supports
     * a language and falls back to English if it doesn't. Also removes region
     * suffixes like the US in 'en-US' if it can't find a language file with
     * the suffix.
     * @param language
     */
    H5PEditor.prototype.getLanguageReplacer = function (language) {
        if (editorLanguages_json_1["default"].includes(language)) {
            return function (f) {
                return f.replace('language/en.js', "language/" + language + ".js");
            };
        }
        var languageWithRegion = language.replace(/-.+$/, '');
        if (editorLanguages_json_1["default"].includes(languageWithRegion)) {
            return function (f) {
                return f.replace('language/en.js', "language/" + languageWithRegion + ".js");
            };
        }
        return function (f) { return f; };
    };
    H5PEditor.prototype.listAssets = function (libraryName, language, loaded) {
        if (loaded === void 0) { loaded = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var key, assets, _a, library, translation, addonsForLibrary, combinedDependencies, parsedLanguageObject;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        key = LibraryName_1["default"].toUberName(libraryName);
                        if (key in loaded) {
                            return [2 /*return*/, null];
                        }
                        loaded[key] = true;
                        assets = {
                            scripts: [],
                            styles: [],
                            translations: {}
                        };
                        return [4 /*yield*/, Promise.all([
                                this.libraryManager.getLibrary(libraryName),
                                this.libraryManager.getLanguage(libraryName, language || 'en')
                            ])];
                    case 1:
                        _a = _b.sent(), library = _a[0], translation = _a[1];
                        return [4 /*yield*/, this.getAddonsForLibrary(library.machineName)];
                    case 2:
                        addonsForLibrary = _b.sent();
                        return [4 /*yield*/, Promise.all([
                                this.resolveDependencies(library.preloadedDependencies || [], language, loaded),
                                this.resolveDependencies(library.editorDependencies || [], language, loaded),
                                addonsForLibrary
                                    ? this.resolveDependencies(addonsForLibrary, language, loaded)
                                    : undefined
                            ])];
                    case 3:
                        combinedDependencies = _b.sent();
                        combinedDependencies.forEach(function (dependencies) {
                            return dependencies.forEach(function (dependency) {
                                dependency.scripts.forEach(function (script) {
                                    return assets.scripts.push(script);
                                });
                                dependency.styles.forEach(function (script) {
                                    return assets.styles.push(script);
                                });
                                Object.keys(dependency.translations).forEach(function (k) {
                                    assets.translations[k] = dependency.translations[k];
                                });
                            });
                        });
                        (library.preloadedJs || []).forEach(function (script) {
                            return assets.scripts.push(_this.urlGenerator.libraryFile(libraryName, script.path));
                        });
                        (library.preloadedCss || []).forEach(function (style) {
                            return assets.styles.push(_this.urlGenerator.libraryFile(libraryName, style.path));
                        });
                        try {
                            parsedLanguageObject = JSON.parse(translation);
                        }
                        catch (_c) {
                            parsedLanguageObject = undefined;
                        }
                        if (parsedLanguageObject) {
                            assets.translations[libraryName.machineName] = parsedLanguageObject;
                        }
                        return [2 /*return*/, assets];
                }
            });
        });
    };
    H5PEditor.prototype.listCoreScripts = function (language) {
        var replacer = this.getLanguageReplacer(language);
        return editorAssetList_json_1["default"].scripts.core
            .map(this.urlGenerator.coreFile)
            .concat(editorAssetList_json_1["default"].scripts.editor
            .map(replacer)
            .map(this.urlGenerator.editorLibraryFile));
    };
    H5PEditor.prototype.listCoreStyles = function () {
        return editorAssetList_json_1["default"].styles.core
            .map(this.urlGenerator.coreFile)
            .concat(editorAssetList_json_1["default"].styles.editor.map(this.urlGenerator.editorLibraryFile));
    };
    H5PEditor.prototype.resolveDependencies = function (originalDependencies, language, loaded) {
        var _this = this;
        var dependencies = originalDependencies.slice();
        var resolved = [];
        var resolve = function (dependency) {
            if (!dependency)
                return Promise.resolve(resolved);
            return _this.listAssets(dependency, language, loaded)
                .then(function (assets) {
                return assets ? resolved.push(assets) : null;
            })
                .then(function () { return resolve(dependencies.shift()); });
        };
        return resolve(dependencies.shift());
    };
    H5PEditor.prototype.validateLanguageCode = function (languageCode) {
        // We are a bit more tolerant than the ISO standard, as there are three
        // character languages codes and country codes like 'hans' for
        // 'zh-hans'.
        if (!/^[a-z]{2,3}(-[A-Z]{2,6})?$/i.test(languageCode)) {
            throw new Error("Language code " + languageCode + " is invalid.");
        }
    };
    return H5PEditor;
}());
exports["default"] = H5PEditor;
//# sourceMappingURL=H5PEditor.js.map