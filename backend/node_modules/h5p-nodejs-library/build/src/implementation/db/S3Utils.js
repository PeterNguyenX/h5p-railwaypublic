"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.sanitizeFilename = exports.validateFilename = void 0;
var Logger_1 = __importDefault(require("../../helpers/Logger"));
var H5pError_1 = __importDefault(require("../../helpers/H5pError"));
var utils_1 = require("../utils");
var log = new Logger_1["default"]('S3Utils');
/**
 * Checks if the filename can be used in S3 storage. Throws errors if the
 * filename is not valid
 * @param filename the filename to check
 * @returns no return value; throws errors if the filename is not valid
 */
function validateFilename(filename, invalidCharactersRegExp) {
    if (/\.\.\//.test(filename)) {
        log.error("Relative paths in filenames are not allowed: " + filename + " is illegal");
        throw new H5pError_1["default"]('illegal-filename', { filename: filename }, 400);
    }
    if (filename.startsWith('/')) {
        log.error("Absolute paths in filenames are not allowed: " + filename + " is illegal");
        throw new H5pError_1["default"]('illegal-filename', { filename: filename }, 400);
    }
    // See https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html
    // for a list of problematic characters. We filter all of them out
    // expect for ranges of non-printable ASCII characters:
    // &$@=;:+ ,?\\{^}%`]'">[~<#
    if (/[^A-Za-z0-9\-._!()\/]/.test(filename)) {
        log.error("Found illegal character in filename: " + filename);
        throw new H5pError_1["default"]('illegal-filename', { filename: filename }, 400);
    }
}
exports.validateFilename = validateFilename;
/**
 * Sanitizes a filename or path by shortening it to the specified maximum length
 * and removing the invalid characters in the RegExp. If you don't specify a
 * RegExp a very strict invalid character list will be used that only leaves
 * alphanumeric filenames untouched.
 * @param filename the filename or path (with UNIX slash separator) to sanitize
 * @param maxFileLength the filename will be shortened to this length
 * @param invalidCharactersRegExp these characters will be removed from the
 * filename
 * @returns the cleaned filename
 */
function sanitizeFilename(filename, maxFileLength, invalidCharactersRegExp) {
    return utils_1.generalizedSanitizeFilename(filename, invalidCharactersRegExp !== null && invalidCharactersRegExp !== void 0 ? invalidCharactersRegExp : /[^A-Za-z0-9\-._!()\/]/g, maxFileLength);
}
exports.sanitizeFilename = sanitizeFilename;
//# sourceMappingURL=S3Utils.js.map