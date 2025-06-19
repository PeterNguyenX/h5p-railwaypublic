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
exports.ContentScanner = void 0;
var Logger_1 = __importDefault(require("./helpers/Logger"));
var LibraryName_1 = __importDefault(require("./LibraryName"));
var log = new Logger_1["default"]('ContentScanner');
/**
 * Scans the content parameters (= content.json) of a piece of content and calls
 * a callback for each element in the semantic tree. This includes all nested
 * pieces of content.
 *
 * You must pass ins a callback that is called for every element in the params
 * tree. If this callback returns true, the scan will be aborted _for the
 * element and its children_, but not for the rest of the params.
 */
var ContentScanner = /** @class */ (function () {
    function ContentScanner(libraryManager) {
        this.libraryManager = libraryManager;
        log.info('initialize');
    }
    /**
     * Scans the specified parameters and executes the callback for every
     * element in the tree. This includes nested content!
     * @param params the params to scan
     * @param mainLibraryName the library name
     * @param callback a function that is executed for every element in the
     * semantic structure. Return true in it to abort the scan for the element
     * itself and all of its children (the rest of the scan will continue).
     */
    ContentScanner.prototype.scanContent = function (params, mainLibraryName, callback) {
        return __awaiter(this, void 0, void 0, function () {
            var mainSemantics;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.debug("scanning content for of type " + LibraryName_1["default"].toUberName(mainLibraryName));
                        return [4 /*yield*/, this.libraryManager.getSemantics(mainLibraryName)];
                    case 1:
                        mainSemantics = _a.sent();
                        return [4 /*yield*/, this.walkSemanticsRecursive(mainSemantics, params, '$', callback, {
                                doNotAddNameToJsonPath: false
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Walks through an element in the semantic tree of a library.
     * @param elementSemantics the semantic information for the current element
     * @param elementParams the parameters for the current element (as in
     * content.json)
     * @param parentJsonPath the JSON path of the parent (example: .media.type)
     * @param parentParams the parent params in the params tree
     * @param callback a function that is executed for this element and for
     * every child
     * @param doNotAddNameToJsonPath if true, the name of the current element
     * will not appended to the JSON path This is the case when a group contains
     * only one element. Then the child's name is omitted in the parameters.
     */
    ContentScanner.prototype.walkEntryRecursive = function (elementSemantics, elementParams, parentJsonPath, parentParams, callback, options) {
        if (options === void 0) { options = {
            doNotAddNameToJsonPath: false
        }; }
        return __awaiter(this, void 0, void 0, function () {
            var currentJsonPath, _a, subLibraryName, subSemantics, _i, _b, groupElement, counter, _c, elementParams_1, listElement;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (elementParams === undefined && !elementSemantics.optional) {
                            log.info(elementSemantics.name + " has no params but is not optional.");
                        }
                        // we ignore elements that are not used in the parameters
                        if (elementParams === undefined) {
                            return [2 /*return*/];
                        }
                        currentJsonPath = options.doNotAddNameToJsonPath
                            ? parentJsonPath
                            : parentJsonPath + "." + elementSemantics.name;
                        if (!(elementSemantics.type === 'group' &&
                            elementSemantics.fields.length === 1 &&
                            !elementParams[elementSemantics.name])) return [3 /*break*/, 2];
                        // The parameters produced by H5P are weird in this case: You would
                        // expect the parameters to be an array with a single entry [{...}],
                        // as the semantic structure defines a group with a single entry.
                        // For some reason, H5P directly puts the object {...} into the
                        // parameters. We have to compensate for this special case.
                        log.debug("found single group entry " + currentJsonPath);
                        return [4 /*yield*/, this.walkEntryRecursive(__assign(__assign({}, elementSemantics.fields[0]), { name: elementSemantics.name }), elementParams, options.doNotAddNameToJsonPath
                                ? parentJsonPath
                                : parentJsonPath + "." + elementSemantics.name, parentParams, callback, {
                                // We have already added the parent's name to the JSON path,
                                // so we don't want the child to add its name.
                                doNotAddNameToJsonPath: true
                            })];
                    case 1:
                        _d.sent();
                        return [2 /*return*/];
                    case 2:
                        if (callback(elementSemantics, elementParams, currentJsonPath, parentParams)) {
                            // don't walk further into the tree if the callback signalled to stop
                            return [2 /*return*/];
                        }
                        _a = elementSemantics.type;
                        switch (_a) {
                            case 'library': return [3 /*break*/, 3];
                            case 'group': return [3 /*break*/, 6];
                            case 'list': return [3 /*break*/, 11];
                        }
                        return [3 /*break*/, 16];
                    case 3:
                        // If an element contains another library, we have to retrieve
                        // the exact name, and the nested content parameters.
                        if (elementParams.library === undefined) {
                            // Skip if the element is empty. (= unused)
                            return [2 /*return*/];
                        }
                        subLibraryName = LibraryName_1["default"].fromUberName(elementParams.library, {
                            useWhitespace: true
                        });
                        return [4 /*yield*/, this.libraryManager.getSemantics(subLibraryName)];
                    case 4:
                        subSemantics = _d.sent();
                        return [4 /*yield*/, this.walkSemanticsRecursive(subSemantics, elementParams.params, currentJsonPath + ".params", callback, { doNotAddNameToJsonPath: false })];
                    case 5:
                        _d.sent();
                        return [3 /*break*/, 16];
                    case 6:
                        _i = 0, _b = elementSemantics.fields;
                        _d.label = 7;
                    case 7:
                        if (!(_i < _b.length)) return [3 /*break*/, 10];
                        groupElement = _b[_i];
                        return [4 /*yield*/, this.walkEntryRecursive(groupElement, elementParams[groupElement.name], currentJsonPath, elementParams, callback, { doNotAddNameToJsonPath: false })];
                    case 8:
                        _d.sent();
                        _d.label = 9;
                    case 9:
                        _i++;
                        return [3 /*break*/, 7];
                    case 10: return [3 /*break*/, 16];
                    case 11:
                        counter = 0;
                        _c = 0, elementParams_1 = elementParams;
                        _d.label = 12;
                    case 12:
                        if (!(_c < elementParams_1.length)) return [3 /*break*/, 15];
                        listElement = elementParams_1[_c];
                        return [4 /*yield*/, this.walkEntryRecursive(elementSemantics.field, listElement, currentJsonPath + "[" + counter + "]", elementParams, callback, {
                                // We don't want the field name of a list to be
                                // added to the JSON path.
                                doNotAddNameToJsonPath: true
                            })];
                    case 13:
                        _d.sent();
                        counter += 1;
                        _d.label = 14;
                    case 14:
                        _c++;
                        return [3 /*break*/, 12];
                    case 15: return [3 /*break*/, 16];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Walks through all semantic entries in a library semantics.
     * @param semantics the semantic structure of a library
     * @param params the parameter object for the content
     * @param parentJsonPath the path of the parent
     * @param callback the callback to execute for every element in the tree
     */
    ContentScanner.prototype.walkSemanticsRecursive = function (semantics, params, parentJsonPath, callback, options) {
        if (options === void 0) { options = {
            doNotAddNameToJsonPath: false
        }; }
        return __awaiter(this, void 0, void 0, function () {
            var _i, semantics_1, semanticEntry;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _i = 0, semantics_1 = semantics;
                        _a.label = 1;
                    case 1:
                        if (!(_i < semantics_1.length)) return [3 /*break*/, 4];
                        semanticEntry = semantics_1[_i];
                        return [4 /*yield*/, this.walkEntryRecursive(semanticEntry, params[semanticEntry.name], parentJsonPath, params, callback, options)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return ContentScanner;
}());
exports.ContentScanner = ContentScanner;
//# sourceMappingURL=ContentScanner.js.map