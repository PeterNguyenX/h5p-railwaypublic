"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = __importDefault(require("./Logger"));
const log = new Logger_1.default('TranslatorWithFallback');
/**
 * Performs localizations with a custom fallback strategy: It tries all the
 * namespaces specified in the tryLocalize(...) call or in the constructor (in
 * the order of the list). If no localization was found, it will fallback to the
 * source string passed to tryLocalize.
 */
class TranslatorWithFallback {
    translationCallback;
    namespaces;
    /**
     *
     */
    constructor(translationCallback, namespaces = []) {
        this.translationCallback = translationCallback;
        this.namespaces = namespaces;
    }
    /**
     * Tries localizing the key. If it fails (indicated by the fact that the key
     * is part of the localized string), it will return the original source
     * string. Tries through all the namespaces specified before falling back.
     * @param key the key to look up the translation in the i18n data
     * @param sourceString the original English string received from the Hub
     * @param language the desired language
     * @param namespaces (optional) the namespaces to try. Will default to the
     * namespaces passed into the constructor if unspecified.
     * @returns the localized string or the original English source string
     */
    tryLocalize(key, sourceString, language, namespaces) {
        log.debug(`Trying to localize key ${key} into ${language}`);
        for (const namespace of namespaces ?? this.namespaces) {
            log.debug(`Trying namespace ${namespace}`);
            const localized = this.translationCallback(`${namespace}:${key}`, language);
            if (!localized.includes(key)) {
                log.debug(`Successfully localized to ${localized}`);
                return localized;
            }
        }
        log.debug(`Falling back to default string: ${sourceString}`);
        return sourceString;
    }
}
exports.default = TranslatorWithFallback;
//# sourceMappingURL=TranslatorWithFallback.js.map