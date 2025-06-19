"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.ContentFileScanner = void 0;
var ContentScanner_1 = require("./ContentScanner");
var Logger_1 = __importDefault(require("./helpers/Logger"));
var log = new Logger_1["default"]('ContentFileScanner');
/**
 * Scans the content parameters (=content.json) of a piece of content and
 * returns a list of references to file that are embedded inside the content.
 */
var ContentFileScanner = /** @class */ (function (_super) {
    __extends(ContentFileScanner, _super);
    function ContentFileScanner(libraryManager) {
        var _this = _super.call(this, libraryManager) || this;
        log.info('initialize');
        return _this;
    }
    /**
     * Loads the specified content from the ContentManager and scans its
     * parameters (= content.json) for references to local files (= audio,
     * video, images, generic files).
     * @param contentId the content to scan
     * @param user the user who wants to access the file
     * @returns a list of local files
     */
    ContentFileScanner.prototype.scanForFiles = function (mainParams, mainLibraryName) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        results = [];
                        return [4 /*yield*/, this.scanContent(mainParams, mainLibraryName, function (semantics, params, jsonPath) {
                                log.debug("Checking entry " + jsonPath + " (type " + semantics.type + ")");
                                switch (semantics.type) {
                                    case 'file':
                                    case 'image':
                                        log.debug("found " + semantics.type + " element");
                                        var element = _this.pushIfDefined(results, _this.checkFileElement(semantics, params, jsonPath));
                                        if (element) {
                                            log.debug("Found file is a reference to " + element.filePath);
                                        }
                                        if (params.originalImage) {
                                            var originalImageElement = _this.pushIfDefined(results, _this.checkFileElement(null, params.originalImage, jsonPath + ".originalImage"));
                                            if (originalImageElement) {
                                                log.debug("Found file is a reference to " + originalImageElement.filePath);
                                            }
                                        }
                                        return true; // returning true aborts further recursion
                                    case 'video':
                                    case 'audio':
                                        if (Array.isArray(params)) {
                                            for (var index = 0; index < params.length; index += 1) {
                                                var arrayElement = _this.pushIfDefined(results, _this.checkFileElement(null, params[index], jsonPath + "[" + index + "]"));
                                                if (arrayElement) {
                                                    log.debug("Found file is a reference to " + arrayElement.filePath);
                                                }
                                            }
                                        }
                                        return true; // returning true aborts further recursion
                                }
                                return false;
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Checks if an element in the parameter tree contains a valid reference to
     * a local file and removes temporary markers.
     * @param semantics The semantic structure of the element to check
     * @param params the parameter object of the element to check
     * @param jsonPath the JSONPath at which the element can be found in the
     * parameter object
     * @returns an object with information about the file reference; undefined
     * if the file reference is invalid
     */
    ContentFileScanner.prototype.checkFileElement = function (semantics, params, jsonPath) {
        if (!params.path) {
            // Path shouldn't be empty, but we simply ignore the entry in this
            // case.
            return undefined;
        }
        if (ContentFileScanner.urlRegExp.test(params.path)) {
            // If the file is a reference to a URL, we don't return it.
            return undefined;
        }
        var temporary = false;
        var cleanFileReferencePath = params.path;
        if (params.path.endsWith('#tmp')) {
            // files marked as temporary will be identified as such
            temporary = true;
            cleanFileReferencePath = params.path.substr(0, params.path.length - 4);
        }
        return {
            context: { semantics: semantics, params: params, jsonPath: jsonPath },
            filePath: cleanFileReferencePath,
            mimeType: params.mime,
            temporary: temporary
        };
    };
    /**
     * Helper function that pushes an item to an array if the item is defined.
     * @param array the array to push to
     * @param item the item to push
     * @returns the item (if defined); otherwise undefined
     */
    ContentFileScanner.prototype.pushIfDefined = function (array, item) {
        if (item !== undefined) {
            array.push(item);
            return item;
        }
        return undefined;
    };
    /**
     * Used to differentiate between local files and URLs.
     */
    // tslint:disable-next-line: typedef
    ContentFileScanner.urlRegExp = /^https?:\/\//;
    return ContentFileScanner;
}(ContentScanner_1.ContentScanner));
exports.ContentFileScanner = ContentFileScanner;
//# sourceMappingURL=ContentFileScanner.js.map