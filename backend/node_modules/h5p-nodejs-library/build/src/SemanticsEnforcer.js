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
var sanitize_html_1 = __importDefault(require("sanitize-html"));
var html_escaper_1 = require("html-escaper");
var ContentScanner_1 = require("./ContentScanner");
var Logger_1 = __importDefault(require("./helpers/Logger"));
var log = new Logger_1["default"]('SemanticsEnforcer');
/**
 * Validates the params received by the editor or when uploading content against
 * the schema specified in the semantic structure of the H5P libraries used for
 * the content.
 *
 * IMPORTANT: This class is very incomplete and mostly only a stub!
 */
var SemanticsEnforcer = /** @class */ (function () {
    function SemanticsEnforcer(libraryManager) {
        log.info('initialize');
        this.contentScanner = new ContentScanner_1.ContentScanner(libraryManager);
    }
    /**
     * Makes sure the params follow the semantic structure of the library.
     * IMPORTANT: This method changes the contents of mainParams!
     * @param mainParams the params; THIS PARAMETER IS MANIPULATED BY THIS
     * METHOD!
     * @param mainLibraryName
     */
    SemanticsEnforcer.prototype.enforceSemanticStructure = function (mainParams, mainLibraryName) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        log.debug('Starting to enforcing semantic structure.');
                        return [4 /*yield*/, this.contentScanner.scanContent(mainParams, mainLibraryName, function (semantics, params, jsonPath, parentParams) {
                                var deleteMe = false;
                                if (semantics.type === 'library') {
                                    var result = _this.enforceLibrarySemantics(semantics, params, parentParams, jsonPath);
                                    deleteMe = result.deleteMe;
                                }
                                else if (semantics.type === 'text') {
                                    _this.enforceTextSemantics(semantics, params, parentParams, jsonPath);
                                }
                                if (deleteMe) {
                                    log.debug("Enforcing library semantics by deleting params path " + jsonPath + ".");
                                    delete parentParams[semantics.name];
                                    return true;
                                }
                                return false;
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * See h5p.classes.php:3994 for how the PHP implementation does this.
     * @param semantics
     * @param params
     * @param parentParams
     * @param jsonPath
     */
    SemanticsEnforcer.prototype.enforceLibrarySemantics = function (semantics, params, parentParams, jsonPath) {
        var _a, _b;
        log.debug('Enforcing structure of a library element.');
        var deleteMe;
        if (!params.library) {
            log.debug("Found a library entry without a library property (" + jsonPath + "). Marking it for deletion.");
            // We silently delete the params in this case, as the H5P editor
            // sometimes creates malformed library entries and this is not an
            // error by the user.
            deleteMe = true;
        }
        else {
            var allowedLibraries = (_b = (_a = semantics.options) === null || _a === void 0 ? void 0 : _a.map(function (o) { return (typeof o === 'string' ? o : o.name); })) === null || _b === void 0 ? void 0 : _b.filter(function (o) { return o; });
            if (!allowedLibraries ||
                !allowedLibraries.includes(params.library)) {
                log.debug("Library check: Found a library entry with a library that is not specified in the options. Allowed are: " + allowedLibraries.join(', ') + ". Library is set to: " + params.library + " (" + jsonPath + ").");
                deleteMe = true;
            }
        }
        // Further checks that should be performed here:
        // - Check if library version is only a different version from the one
        //   specified in options, or if library is not allowed in general.
        //   (delete the params entry in either case, but report different
        //   errors)
        // - Validate subcontent metadata (.metadata property)
        // - Filter out params that are not valid per se (only library, params,
        //   subContentId, metadata and the list in 'extraAttributes' is
        //   allowed). Remove all other keys in params.
        // - If subContentId exists: check if it is a properly formatted string
        //   (/^\{?[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\}?$/)
        //   and delete the subContentId if it's not.
        return {
            deleteMe: deleteMe
        };
    };
    /**
     * Checks if a text entry conforms to the semantics and enforces the
     * semantics if necessary. Implements all checks of the PHP version, but
     * does not include error reporting at the moment.
     */
    SemanticsEnforcer.prototype.enforceTextSemantics = function (semantics, params, parentParams, jsonPath) {
        // TODO:
        // - respect detailed font specifications in style filter
        // - report errors to user
        log.debug('Checking contents of text entry');
        var newText = params;
        if (!newText) {
            newText = '';
        }
        // Filter out disallowed HTML tags to prevent XSS attacks.
        if (semantics.tags) {
            // We always allow divs, spans, p and br.
            var allowedTags = __spreadArrays(['div', 'span', 'p', 'br'], semantics.tags);
            // We add related HTML tags
            if (allowedTags.includes('table')) {
                allowedTags = __spreadArrays(allowedTags, [
                    'tr',
                    'td',
                    'th',
                    'colgroup',
                    'thead',
                    'tbody',
                    'tfoot'
                ]);
            }
            if (allowedTags.includes('strong')) {
                allowedTags.push('b');
            }
            else {
                if (allowedTags.includes('b')) {
                    allowedTags.push('strong');
                }
            }
            if (allowedTags.includes('em')) {
                allowedTags.push('i');
            }
            else {
                if (allowedTags.includes('i')) {
                    allowedTags.push('em');
                }
            }
            if (allowedTags.includes('ul') || allowedTags.includes('ol')) {
                allowedTags.push('li');
            }
            if (allowedTags.includes('del') || allowedTags.includes('strike')) {
                allowedTags.push('s');
            }
            var uniqueTags = new Set(allowedTags);
            // We never allow inherently unsafe tags, even if the library would
            // allow this.
            uniqueTags["delete"]('script');
            uniqueTags["delete"]('style');
            uniqueTags["delete"]('textarea');
            uniqueTags["delete"]('option');
            allowedTags = Array.from(uniqueTags);
            // Text alignment is always allowed.
            var allowedStyles = {
                'text-align': [/^(center|left|right)$/i]
            };
            // We only allow the styles set in the semantics.
            if (semantics.font) {
                if (semantics.font.size) {
                    allowedStyles['font-size'] = [/^[0-9.]+(em|px|%)$/i];
                }
                if (semantics.font.family) {
                    allowedStyles['font-family'] = [/^[-a-z0-9," ]+$/i];
                }
                if (semantics.font.color) {
                    // tslint:disable-next-line: no-string-literal
                    allowedStyles['color'] = [
                        /^(#[a-f0-9]{3}[a-f0-9]{3}?|rgba?\([0-9, ]+\))$/i
                    ];
                }
                if (semantics.font.background) {
                    allowedStyles['background-color'] = [
                        /^(#[a-f0-9]{3}[a-f0-9]{3}?|rgba?\([0-9, ]+\))$/i
                    ];
                }
                if (semantics.font.spacing) {
                    // tslint:disable-next-line: no-string-literal
                    allowedStyles['spacing'] = [/^[0-9.]+(em|px|%)$/i];
                }
                if (semantics.font.height) {
                    allowedStyles['line-height'] = [/^[0-9.]+(em|px|%)$/i];
                }
            }
            log.debug('Filtering out disallowed HTML tags');
            newText = sanitize_html_1["default"](newText, {
                allowedTags: allowedTags,
                allowedAttributes: {
                    '*': ['style'],
                    a: ['href', 'hreflang', 'media', 'rel', 'target'],
                    td: ['colspan', 'rowspan', 'headers'],
                    th: ['colspan', 'rowspan', 'headers', 'scope'],
                    ol: ['start', 'reversed'],
                    table: ['summary']
                },
                allowedStyles: { '*': allowedStyles }
            });
        }
        else {
            log.debug('Filtering out all HTML tags');
            // Escape all HTML tags if the field doesn't allow HTML in general.
            // We avoid double escaping like &amp; becoming &amp;amp; by
            // unescaping first.
            newText = html_escaper_1.escape(html_escaper_1.unescape(newText));
        }
        // Check if string has the required length
        if (semantics.maxLength && newText.length > semantics.maxLength) {
            log.debug('Clipping string that is too long');
            newText = newText.substring(0, semantics.maxLength);
        }
        // Check if string conforms to regexp (if given and if set to optional)
        if (newText !== '' && semantics.optional && semantics.regexp) {
            var regexp = new RegExp(semantics.regexp.pattern, semantics.regexp.modifiers);
            if (!regexp.test(newText)) {
                log.debug("Provided string does not conform to regexp in semantics (value: " + newText + ", regexp: " + semantics.regexp + ")");
                newText = '';
            }
        }
        parentParams[semantics.name] = newText;
    };
    return SemanticsEnforcer;
}());
exports["default"] = SemanticsEnforcer;
//# sourceMappingURL=SemanticsEnforcer.js.map