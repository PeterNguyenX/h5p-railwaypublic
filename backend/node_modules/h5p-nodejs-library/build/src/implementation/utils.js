"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.generalizedSanitizeFilename = void 0;
var upath_1 = __importDefault(require("upath"));
/**
 * Sanitizes a filename. Removes invalid characters and shortens to the max
 * length.
 * @param filename
 * @param invalidCharacterRegex
 * @param maxLength
 * @returns the sanitized filename
 */
function generalizedSanitizeFilename(filename, invalidCharacterRegex, maxLength) {
    // First remove all invalid characters.
    // We keep / and \ as the "filename" can be a relative path with
    // directories. We don't use the sanitize-filename package, as it
    // also removes directory separators.
    var cleanedFilename = filename.replace(invalidCharacterRegex, '');
    // Should the filename only contain the extension now (because all
    // characters of the basename were invalid), we add a generic filename.
    var extension = upath_1["default"].extname(cleanedFilename);
    var basename = upath_1["default"].basename(cleanedFilename, extension);
    var dirname = upath_1["default"].dirname(cleanedFilename);
    if (extension === '') {
        extension = basename;
        basename = 'file';
        cleanedFilename = dirname + "/" + basename + extension;
    }
    // Shorten the filename if it is too long.
    var numberOfCharactersToCut = cleanedFilename.length - maxLength;
    if (numberOfCharactersToCut < 0) {
        return cleanedFilename;
    }
    var finalBasenameLength = Math.max(1, basename.length - numberOfCharactersToCut);
    return dirname + "/" + basename.substr(0, finalBasenameLength) + extension;
}
exports.generalizedSanitizeFilename = generalizedSanitizeFilename;
//# sourceMappingURL=utils.js.map