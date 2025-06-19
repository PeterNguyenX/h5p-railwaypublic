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
exports.__esModule = true;
/**
 * Maps file extensions to font types.
 */
var extensionsMap = {
    eot: 'embedded-opentype',
    ttf: 'truetype',
    otf: 'opentype'
};
/**
 * A PostCSS plugin Removing redundant URLs in @font-face rules by deleting all
 * URLs from src except for a single one.
 * @param fontPreference (optional) the order in which fonts should be kept; the
 * first one in the list is the one that is taken first, if it exists
 * @param removedCallback (optional) this function if executed for each file
 * reference that is removed by the plugin
 */
function default_1(fontPreference, removedCallback) {
    if (fontPreference === void 0) { fontPreference = [
        'woff',
        'woff2',
        'truetype',
        'svg',
        'opentype',
        'embedded-opentype'
    ]; }
    if (!fontPreference || fontPreference.length === 0) {
        throw new Error('You must specify the order in which fonts should be preferred as any array with at least one entry.');
    }
    return {
        postcssPlugin: 'postcss-remove-redundant-font-urls',
        // tslint:disable-next-line: function-name
        Once: function (styles) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    styles.walkAtRules('font-face', function (atRule) {
                        var fonts = [];
                        // Create a list of all fonts used in the @font-face rule.
                        atRule.nodes
                            .filter(function (node) { return node.prop === 'src'; })
                            .forEach(function (node) {
                            var _a, _b;
                            var regex = /url\(["']?([^'"\)\?#]+)\.(.*?)([\?\#].+?)?["']?\)( format\(["'](.*?)["']\))?[,$]?/g;
                            var matches;
                            while (
                            // tslint:disable-next-line: no-conditional-assignment
                            (matches = regex.exec(node.value))) {
                                var format = (_b = (_a = matches[5]) !== null && _a !== void 0 ? _a : extensionsMap[matches[2]]) !== null && _b !== void 0 ? _b : matches[2];
                                fonts.push({
                                    format: format,
                                    node: node,
                                    sourceText: matches[0],
                                    filename: matches[1],
                                    extension: matches[2]
                                });
                            }
                        });
                        // Determine which font should be kept by sorting the list.
                        var fontToKeep = fonts.sort(function (a, b) {
                            var indexA = fontPreference.indexOf(a.format);
                            var indexB = fontPreference.indexOf(b.format);
                            return ((indexA === -1 ? fontPreference.length : indexA) -
                                (indexB === -1 ? fontPreference.length : indexB));
                        })[0];
                        // Remove all other fonts from the rule.
                        fonts.forEach(function (f) {
                            if (f === fontToKeep) {
                                return;
                            }
                            var newValue = f.node.value;
                            newValue = newValue.replace(f.sourceText, '').trim();
                            if (newValue.endsWith(',')) {
                                newValue = newValue.substr(0, newValue.length - 1);
                            }
                            if (removedCallback) {
                                removedCallback(f.filename + "." + f.extension);
                            }
                            // Delete the whole src node if it has become empty because
                            // of the removed font.
                            if (newValue.trim() === '') {
                                atRule.removeChild(f.node);
                            }
                            else {
                                f.node.value = newValue.trim();
                            }
                        });
                    });
                    return [2 /*return*/];
                });
            });
        }
    };
}
exports["default"] = default_1;
//# sourceMappingURL=postCssRemoveRedundantFontUrls.js.map