"use strict";
exports.__esModule = true;
exports.sanitizeFilename = exports.checkFilename = void 0;
var __1 = require("../..");
var utils_1 = require("../utils");
function checkFilename(filename) {
    if (/\.\.\//.test(filename)) {
        throw new __1.H5pError('storage-file-implementations:illegal-relative-filename', { filename: filename }, 400);
    }
    if (filename.startsWith('/')) {
        throw new __1.H5pError('storage-file-implementations:illegal-absolute-filename', { filename: filename }, 400);
    }
}
exports.checkFilename = checkFilename;
/**
 * Sanitizes a filename or path by shortening it to the specified maximum length
 * and removing the invalid characters in the RegExp. If you don't specify a
 * RegExp a very strict invalid character list will be used that only leaves
 * alphanumeric filenames untouched.
 * @param filename the filename or path (with UNIX slash separator) to sanitize
 * @param maxFileLength the filename will be shortened to this length
 * @param invalidCharactersRegex these characters will be removed from the
 * filename
 * @returns the cleaned filename
 */
function sanitizeFilename(filename, maxFileLength, invalidCharactersRegex) {
    return utils_1.generalizedSanitizeFilename(filename, invalidCharactersRegex !== null && invalidCharactersRegex !== void 0 ? invalidCharactersRegex : /[^A-Za-z0-9\-._!()\/]/g, maxFileLength);
}
exports.sanitizeFilename = sanitizeFilename;
//# sourceMappingURL=filenameUtils.js.map