"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var Logger_1 = __importDefault(require("./helpers/Logger"));
var log = new Logger_1["default"]('SemanticsLocalizer');
/**
 * Scans a semantic structure and localizes the label, placeholder
 * and description fields. You can also localize all fields by
 * passing the respective option.
 */
var SemanticsLocalizer = /** @class */ (function () {
    function SemanticsLocalizer(t) {
        this.t = t;
        this.localizableFields = [
            'label',
            'placeholder',
            'description'
        ];
        log.info('initialize');
    }
    /**
     * Localizes all localizable fields in the semantic structure.
     * @param semantics the semantics object
     * @param language the language to localize to
     * @param localizeAllFields true if not only label, placeholder and description should be localized but all fields
     * @returns a copy of the semantic structure with localized fields
     */
    SemanticsLocalizer.prototype.localize = function (semantics, language, localizeAllFields) {
        return this.walkSemanticsRecursive(semantics, language, localizeAllFields);
    };
    SemanticsLocalizer.prototype.walkSemanticsRecursive = function (semantics, language, localizeAllFields) {
        var copy = Array.isArray(semantics) ? [] : {};
        // tslint:disable-next-line: forin
        if (Object.keys(semantics).length === 0) {
            copy = semantics;
        }
        else {
            for (var field in semantics) {
                if ((this.localizableFields.includes(field) &&
                    typeof semantics[field] === 'string') ||
                    localizeAllFields) {
                    var translated = this.t(semantics[field], language);
                    log.debug("Replacing \"" + semantics[field] + "\" with \"" + translated + "\"");
                    copy[field] = translated;
                }
                else if (typeof semantics[field] === 'object') {
                    copy[field] = this.walkSemanticsRecursive(semantics[field], language, localizeAllFields);
                }
                else {
                    copy[field] = semantics[field];
                }
            }
        }
        return copy;
    };
    return SemanticsLocalizer;
}());
exports["default"] = SemanticsLocalizer;
//# sourceMappingURL=SemanticsLocalizer.js.map