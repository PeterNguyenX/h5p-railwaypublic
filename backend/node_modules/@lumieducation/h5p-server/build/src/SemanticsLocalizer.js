"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = __importDefault(require("./helpers/Logger"));
const log = new Logger_1.default('SemanticsLocalizer');
/**
 * Scans a semantic structure and localizes the label, placeholder
 * and description fields. You can also localize all fields by
 * passing the respective option.
 */
class SemanticsLocalizer {
    t;
    constructor(t) {
        this.t = t;
        log.info('initialize');
    }
    localizableFields = [
        'label',
        'placeholder',
        'description'
    ];
    /**
     * Localizes all localizable fields in the semantic structure.
     * @param semantics the semantics object
     * @param language the language to localize to
     * @param localizeAllFields true if not only label, placeholder and description should be localized but all fields
     * @returns a copy of the semantic structure with localized fields
     */
    localize(semantics, language, localizeAllFields) {
        log.debug(`Localizing semantics into ${language}`);
        return this.walkSemanticsRecursive(semantics, language, localizeAllFields);
    }
    walkSemanticsRecursive(semantics, language, localizeAllFields) {
        let copy = Array.isArray(semantics) ? [] : {};
        if (Object.keys(semantics).length === 0) {
            copy = semantics;
        }
        else {
            for (const field in semantics) {
                if (typeof semantics[field] === 'object' &&
                    typeof semantics[field] !== 'string') {
                    copy[field] = this.walkSemanticsRecursive(semantics[field], language, localizeAllFields);
                }
                else if ((this.localizableFields.includes(field) &&
                    typeof semantics[field] === 'string') ||
                    localizeAllFields) {
                    const translated = this.t(semantics[field], language);
                    log.debug(`Replacing "${semantics[field]}" with "${translated}"`);
                    copy[field] = translated;
                }
                else {
                    copy[field] = semantics[field];
                }
            }
        }
        return copy;
    }
}
exports.default = SemanticsLocalizer;
//# sourceMappingURL=SemanticsLocalizer.js.map