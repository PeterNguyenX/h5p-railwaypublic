"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentFileScanner = void 0;
const ContentScanner_1 = require("./ContentScanner");
const Logger_1 = __importDefault(require("./helpers/Logger"));
const log = new Logger_1.default('ContentFileScanner');
/**
 * Scans the content parameters (=content.json) of a piece of content and
 * returns a list of references to file that are embedded inside the content.
 */
class ContentFileScanner extends ContentScanner_1.ContentScanner {
    constructor(libraryManager) {
        super(libraryManager);
        log.info('initialize');
    }
    /**
     * Used to differentiate between local files and URLs.
     */
    static urlRegExp = /^https?:\/\//;
    /**
     * Loads the specified content from the ContentManager and scans its
     * parameters (= content.json) for references to local files (= audio,
     * video, images, generic files).
     * @param contentId the content to scan
     * @param user the user who wants to access the file
     * @returns a list of local files
     */
    async scanForFiles(mainParams, mainLibraryName) {
        const results = [];
        await this.scanContent(mainParams, mainLibraryName, (semantics, params, jsonPath) => {
            log.debug(`Checking entry ${jsonPath} (type ${semantics.type})`);
            switch (semantics.type) {
                case 'file':
                case 'image': {
                    log.debug(`found ${semantics.type} element`);
                    const element = this.pushIfDefined(results, this.checkFileElement(semantics, params, jsonPath));
                    if (element) {
                        log.debug(`Found file is a reference to ${element.filePath}`);
                    }
                    if (params.originalImage) {
                        const originalImageElement = this.pushIfDefined(results, this.checkFileElement(null, params.originalImage, `${jsonPath}.originalImage`));
                        if (originalImageElement) {
                            log.debug(`Found file is a reference to ${originalImageElement.filePath}`);
                        }
                    }
                    return true; // returning true aborts further recursion
                }
                case 'video':
                case 'audio':
                    if (Array.isArray(params)) {
                        for (let index = 0; index < params.length; index += 1) {
                            const arrayElement = this.pushIfDefined(results, this.checkFileElement(null, params[index], `${jsonPath}[${index}]`));
                            if (arrayElement) {
                                log.debug(`Found file is a reference to ${arrayElement.filePath}`);
                            }
                        }
                    }
                    return true; // returning true aborts further recursion
                default:
                    return false;
            }
        });
        return results;
    }
    /**
     * Checks if an element in the parameter tree contains a valid reference to
     * a local file and removes temporary markers.
     * @param semantics The semantic structure of the element to check
     * @param params the parameter object of the element to check
     * @param jsonPath the JSONPath at which the element can be found in the
     * parameter object
     * @returns an object with information about the file reference; undefined
     * if the file reference is invalid
     */
    checkFileElement(semantics, params, jsonPath) {
        if (!params.path) {
            // Path shouldn't be empty, but we simply ignore the entry in this
            // case.
            return undefined;
        }
        if (ContentFileScanner.urlRegExp.test(params.path)) {
            // If the file is a reference to a URL, we don't return it.
            return undefined;
        }
        let temporary = false;
        let cleanFileReferencePath = params.path;
        if (params.path.endsWith('#tmp')) {
            // files marked as temporary will be identified as such
            temporary = true;
            cleanFileReferencePath = params.path.substr(0, params.path.length - 4);
        }
        return {
            context: { semantics, params, jsonPath },
            filePath: cleanFileReferencePath,
            mimeType: params.mime,
            temporary
        };
    }
    /**
     * Helper function that pushes an item to an array if the item is defined.
     * @param array the array to push to
     * @param item the item to push
     * @returns the item (if defined); otherwise undefined
     */
    pushIfDefined(array, item) {
        if (item !== undefined) {
            array.push(item);
            return item;
        }
        return undefined;
    }
}
exports.ContentFileScanner = ContentFileScanner;
//# sourceMappingURL=ContentFileScanner.js.map