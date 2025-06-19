"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const upath_1 = __importDefault(require("upath"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const Logger_1 = __importDefault(require("./Logger"));
const H5pError_1 = __importDefault(require("./H5pError"));
const log = new Logger_1.default('FilenameGenerator');
const idCharacters = '1234567890abcdefghjiklmnoprstuvwxyABCDEFGHJIKLMNOPRSTUVWYXZ';
const idRegex = new RegExp(`^[${idCharacters}]+$`);
/**
 * Generates an ID of with the alphabet in idCharacters, e.g. aB34aAxy
 * @param size
 * @returns
 */
function generateId(size = 8) {
    const array = new Uint8Array(size);
    node_crypto_1.default.getRandomValues(array);
    return Array.from(array, (byte) => idCharacters[byte % idCharacters.length]).join('');
}
/**
 * Generates a unique filename. Removes short-ids that were added to filenames
 * @param contentId the content object for which the file is about to be saved
 * @param filename the filename on which to base the unique filename on
 * @returns a unique filename (within the content object)
 */
exports.default = async (filename, sanitize, checkIfFileExists) => {
    log.debug(`Getting unique name for ${filename}.`);
    let actualFilename = filename;
    // remove already assigned shortids
    const match = filename.match(/^(.+?)-([^/]+?)(\.\w+)$/);
    if (match && idRegex.test(match[2])) {
        actualFilename = match[1] + match[3];
        log.debug(`Actual filename is ${actualFilename}.`);
    }
    // try newly generated filenames
    let attempts = 0;
    let filenameAttempt = '';
    let exists = false;
    actualFilename = sanitize(actualFilename);
    const dirname = upath_1.default.dirname(actualFilename);
    do {
        filenameAttempt = `${dirname && dirname !== '.' ? `${dirname}/` : ''}${upath_1.default.basename(actualFilename, upath_1.default.extname(actualFilename))}-${generateId()}${upath_1.default.extname(actualFilename)}`;
        log.debug(`Checking if ${filenameAttempt} already exists`);
        exists = await checkIfFileExists(filenameAttempt);
        attempts += 1;
    } while (attempts < 5 && exists); // only try 5 times
    if (exists) {
        log.error(`Cannot determine a unique filename for ${filename}`);
        throw new H5pError_1.default('error-generating-unique-content-filename', { filename }, 500);
    }
    log.debug(`Unique filename is ${filenameAttempt}`);
    return filenameAttempt;
};
//# sourceMappingURL=FilenameGenerator.js.map