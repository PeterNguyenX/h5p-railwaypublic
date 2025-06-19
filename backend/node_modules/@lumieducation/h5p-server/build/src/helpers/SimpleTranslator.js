"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flat_1 = require("flat");
/**
 * This class performs translations using a simple object with string keys as
 * a place to look up the translations. Can be used in tests and as a fallback
 * when the implementation does not pass a translation function.
 * Uses namespaces but does not support multiple languages.
 */
class SimpleTranslator {
    /**
     * @param translationStrings an object containing all relevant translation strings
     * sorted by namespaces
     */
    constructor(translationStrings) {
        this.translationStrings = {};
        for (const namespace of Object.keys(translationStrings)) {
            this.translationStrings[namespace] = (0, flat_1.flatten)(translationStrings[namespace]);
        }
    }
    translationStrings;
    /**
     * Translates a string using the key (identified).
     * @params key the key with optional namespace separated by a colon (e.g.
     * namespace:key)
     * @returns the translated string
     * @memberof SimpleTranslator
     */
    t = (key) => {
        const matches = /^(.+):(.+)$/.exec(key);
        if (matches?.length > 0) {
            return this.translationStrings[matches[1]][matches[2]] ?? key;
        }
        return key;
    };
}
exports.default = SimpleTranslator;
//# sourceMappingURL=SimpleTranslator.js.map