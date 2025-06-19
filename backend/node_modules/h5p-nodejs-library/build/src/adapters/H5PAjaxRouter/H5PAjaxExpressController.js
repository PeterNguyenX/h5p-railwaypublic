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
var __1 = require("../..");
var mime_types_1 = require("mime-types");
var AjaxSuccessResponse_1 = __importDefault(require("../../helpers/AjaxSuccessResponse"));
var SemanticsEnforcer_1 = __importDefault(require("../../SemanticsEnforcer"));
/**
 * The methods in this class can be used to answer AJAX requests that are received by Express routers.
 * You can use all methods independently at your convenience.
 * Note that even though the names getAjax and postAjax imply that only these methods deal with AJAX
 * requests, ALL methods except getDownload deal with AJAX requests. This confusion is caused by the
 * HTTP interface the H5P client uses and we can't change it.
 */
var H5PAjaxExpressController = /** @class */ (function () {
    function H5PAjaxExpressController(h5pEditor) {
        var _this = this;
        this.h5pEditor = h5pEditor;
        /**
         * Get various things through the Ajax endpoint.
         */
        this.getAjax = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var action, _a, majorVersion, minorVersion, machineName, language, _b, contentTypeCache, library;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        action = req.query.action;
                        _a = req.query, majorVersion = _a.majorVersion, minorVersion = _a.minorVersion, machineName = _a.machineName, language = _a.language;
                        _b = action;
                        switch (_b) {
                            case 'content-type-cache': return [3 /*break*/, 1];
                            case 'libraries': return [3 /*break*/, 3];
                        }
                        return [3 /*break*/, 5];
                    case 1: return [4 /*yield*/, this.h5pEditor.getContentTypeCache(req.user)];
                    case 2:
                        contentTypeCache = _c.sent();
                        res.status(200).json(contentTypeCache);
                        return [3 /*break*/, 6];
                    case 3: return [4 /*yield*/, this.h5pEditor.getLibraryData(machineName === null || machineName === void 0 ? void 0 : machineName.toString(), majorVersion === null || majorVersion === void 0 ? void 0 : majorVersion.toString(), minorVersion === null || minorVersion === void 0 ? void 0 : minorVersion.toString(), language === null || language === void 0 ? void 0 : language.toString())];
                    case 4:
                        library = _c.sent();
                        res.status(200).json(library);
                        return [3 /*break*/, 6];
                    case 5:
                        res.status(400).end();
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        this.getContentFile = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var stats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.h5pEditor.contentStorage.getFileStats(req.params.id, req.params.file, req.user)];
                    case 1:
                        stats = _a.sent();
                        return [2 /*return*/, this.abstractGetContentFile(req.params.id, req.params.file, req.user, stats, req, res)];
                }
            });
        }); };
        this.getContentParameters = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var content;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.h5pEditor.getContent(req.params.contentId, req.user)];
                    case 1:
                        content = _a.sent();
                        res.status(200).json(content);
                        return [2 /*return*/];
                }
            });
        }); };
        this.getDownload = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // set filename for the package with .h5p extension
                        res.setHeader('Content-disposition', "attachment; filename=" + req.params.contentId + ".h5p");
                        return [4 /*yield*/, this.h5pEditor.exportContent(req.params.contentId, res, req.user)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        this.getLibraryFile = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var lib, _a, stats, stream;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        lib = __1.LibraryName.fromUberName(req.params.uberName);
                        return [4 /*yield*/, Promise.all([
                                this.h5pEditor.libraryManager.getFileStats(lib, req.params.file),
                                this.h5pEditor.getLibraryFileStream(lib, req.params.file)
                            ])];
                    case 1:
                        _a = _b.sent(), stats = _a[0], stream = _a[1];
                        this.pipeStreamToResponse(req.params.file, stream, res, stats.size);
                        return [2 /*return*/];
                }
            });
        }); };
        this.getTemporaryContentFile = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var stats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.h5pEditor.temporaryStorage.getFileStats(req.params.file, req.user)];
                    case 1:
                        stats = _a.sent();
                        return [2 /*return*/, this.abstractGetContentFile(undefined, req.params.file, req.user, stats, req, res)];
                }
            });
        }); };
        /**
         * Post various things through the Ajax endpoint
         * Don't be confused by the fact that many of the requests dealt with here are not
         * really POST requests, but look more like GET requests. This is simply how the H5P
         * client works and we can't change it.
         */
        this.postAjax = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var action, updatedLibCount, installedLibCount, getLibraryResultText, _a, libraryOverview, translationsResponse, field, uploadFileResponse, _b, unfilteredLibrary, unfilteredParams, unfilteredMetadata, enforcer, installedLibs, contentTypeCache, _c, installedLibraries, metadata, parameters, contentTypes;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        action = req.query.action;
                        getLibraryResultText = function (installed, updated) {
                            return ((installed
                                ? req.t
                                    ? req.t('installed-libraries', { count: installed })
                                    : "Installed " + installed + " libraries."
                                : '') + " " + (updated
                                ? req.t
                                    ? req.t('updated-libraries', { count: updated })
                                    : "Updated " + updated + " libraries."
                                : '')).trim();
                        };
                        _a = action;
                        switch (_a) {
                            case 'libraries': return [3 /*break*/, 1];
                            case 'translations': return [3 /*break*/, 3];
                            case 'files': return [3 /*break*/, 5];
                            case 'filter': return [3 /*break*/, 7];
                            case 'library-install': return [3 /*break*/, 9];
                            case 'library-upload': return [3 /*break*/, 12];
                        }
                        return [3 /*break*/, 15];
                    case 1: return [4 /*yield*/, this.h5pEditor.getLibraryOverview(req.body.libraries)];
                    case 2:
                        libraryOverview = _d.sent();
                        res.status(200).json(libraryOverview);
                        return [3 /*break*/, 16];
                    case 3: return [4 /*yield*/, this.h5pEditor.listLibraryLanguageFiles(req.body.libraries, req.query.language)];
                    case 4:
                        translationsResponse = _d.sent();
                        res.status(200).json(new AjaxSuccessResponse_1["default"](translationsResponse));
                        return [3 /*break*/, 16];
                    case 5:
                        if (!req.body.field) {
                            throw new __1.H5pError('malformed-request', { error: "'field' property is missing in request" }, 400);
                        }
                        field = void 0;
                        try {
                            field = JSON.parse(req.body.field);
                        }
                        catch (e) {
                            throw new __1.H5pError('malformed-request', {
                                error: "'field' property is malformed (must be in JSON)"
                            }, 400);
                        }
                        return [4 /*yield*/, this.h5pEditor.saveContentFile(req.body.contentId === '0'
                                ? req.query.contentId
                                : req.body.contentId, field, req.files.file, req.user)];
                    case 6:
                        uploadFileResponse = _d.sent();
                        res.status(200).json(uploadFileResponse);
                        return [3 /*break*/, 16];
                    case 7:
                        if (!req.body.libraryParameters) {
                            throw new __1.H5pError('malformed-request', { error: 'libraryParameters missing' }, 400);
                        }
                        _b = JSON.parse(req.body.libraryParameters), unfilteredLibrary = _b.library, unfilteredParams = _b.params, unfilteredMetadata = _b.metadata;
                        if (!unfilteredLibrary ||
                            !unfilteredParams ||
                            !unfilteredMetadata) {
                            throw new __1.H5pError('malformed-request', { error: 'Property missing in libraryParameters' }, 400);
                        }
                        enforcer = new SemanticsEnforcer_1["default"](this.h5pEditor.libraryManager);
                        return [4 /*yield*/, enforcer.enforceSemanticStructure(unfilteredParams, __1.LibraryName.fromUberName(unfilteredLibrary, {
                                useWhitespace: true
                            }))];
                    case 8:
                        _d.sent();
                        res.status(200).json(new AjaxSuccessResponse_1["default"]({
                            library: unfilteredLibrary,
                            metadata: unfilteredMetadata,
                            params: unfilteredParams
                        }));
                        return [3 /*break*/, 16];
                    case 9:
                        if (!req.query || !req.query.id || !req.user) {
                            throw new __1.H5pError('malformed-request', { error: 'Request Parameters incorrect.' }, 400);
                        }
                        return [4 /*yield*/, this.h5pEditor.installLibraryFromHub(req.query.id, req.user)];
                    case 10:
                        installedLibs = _d.sent();
                        updatedLibCount = installedLibs.filter(function (l) { return l.type === 'patch'; }).length;
                        installedLibCount = installedLibs.filter(function (l) { return l.type === 'new'; }).length;
                        return [4 /*yield*/, this.h5pEditor.getContentTypeCache(req.user)];
                    case 11:
                        contentTypeCache = _d.sent();
                        res.status(200).json(new AjaxSuccessResponse_1["default"](contentTypeCache, installedLibCount + updatedLibCount > 0
                            ? getLibraryResultText(installedLibCount, updatedLibCount)
                            : undefined));
                        return [3 /*break*/, 16];
                    case 12: return [4 /*yield*/, this.h5pEditor.uploadPackage(req.files.h5p.data, req.user)];
                    case 13:
                        _c = _d.sent(), installedLibraries = _c.installedLibraries, metadata = _c.metadata, parameters = _c.parameters;
                        updatedLibCount = installedLibraries.filter(function (l) { return l.type === 'patch'; }).length;
                        installedLibCount = installedLibraries.filter(function (l) { return l.type === 'new'; }).length;
                        return [4 /*yield*/, this.h5pEditor.getContentTypeCache(req.user)];
                    case 14:
                        contentTypes = _d.sent();
                        res.status(200).json(new AjaxSuccessResponse_1["default"]({
                            content: parameters,
                            contentTypes: contentTypes,
                            h5p: metadata
                        }, installedLibCount + updatedLibCount > 0
                            ? getLibraryResultText(installedLibCount, updatedLibCount)
                            : undefined));
                        return [3 /*break*/, 16];
                    case 15:
                        res.status(500).end('NOT IMPLEMENTED');
                        return [3 /*break*/, 16];
                    case 16: return [2 /*return*/];
                }
            });
        }); };
        this.pipeStreamToPartialResponse = function (filename, readStream, response, totalLength, start, end) {
            var contentType = mime_types_1.lookup(filename) || 'application/octet-stream';
            response.writeHead(206, {
                'Content-Type': contentType,
                'Content-Length': end - start + 1,
                'Content-Range': "bytes " + start + "-" + end + "/" + totalLength
            });
            readStream.on('error', function (err) {
                response.status(404).end();
            });
            readStream.pipe(response);
        };
        this.pipeStreamToResponse = function (filename, readStream, response, contentLength) {
            var contentType = mime_types_1.lookup(filename) || 'application/octet-stream';
            if (contentLength) {
                response.writeHead(200, {
                    'Content-Type': contentType,
                    'Content-Length': contentLength,
                    'Accept-Ranges': 'bytes'
                });
            }
            else {
                response.type(contentType);
            }
            readStream.on('error', function (err) {
                response.status(404).end();
            });
            readStream.pipe(response);
        };
    }
    /**
     * Unified handling of range requests for getContentFile and
     * getTemporaryContentFile.
     * @param contentId (optional) the contentId, can be undefined if a
     * temporary file is requested
     */
    H5PAjaxExpressController.prototype.abstractGetContentFile = function (contentId, file, user, stats, req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var range, start, end, stream;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        range = req.range(stats.size);
                        if (range) {
                            if (range === -2) {
                                throw new __1.H5pError('malformed-request', {}, 400);
                            }
                            if (range === -1) {
                                throw new __1.H5pError('unsatisfiable-range', {}, 416);
                            }
                            if (range.length > 1) {
                                throw new __1.H5pError('multipart-ranges-unsupported', {}, 400);
                            }
                            start = range[0].start;
                            end = range[0].end;
                        }
                        return [4 /*yield*/, this.h5pEditor.getContentFileStream(contentId, file, user, start, end)];
                    case 1:
                        stream = _a.sent();
                        if (range) {
                            this.pipeStreamToPartialResponse(req.params.file, stream, res, stats.size, start, end);
                        }
                        else {
                            this.pipeStreamToResponse(req.params.file, stream, res, stats.size);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return H5PAjaxExpressController;
}());
exports["default"] = H5PAjaxExpressController;
//# sourceMappingURL=H5PAjaxExpressController.js.map