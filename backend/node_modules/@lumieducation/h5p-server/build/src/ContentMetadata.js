"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentMetadata = void 0;
const LibraryName_1 = __importDefault(require("./LibraryName"));
/**
 * Content metadata object with defaults for required values and
 * sanitization to make sure it the metadata conforms to the schema.
 */
class ContentMetadata {
    /**
     * Creates an object conforming to the h5p.json schema.
     * @param furtherMetadata these objects will be merged into the newly created object
     */
    constructor(...furtherMetadata) {
        for (const metadata of furtherMetadata) {
            Object.assign(this, metadata);
        }
        // Remove empty arrays for authors and changes, as this breaks the
        // H5P schema.
        if (this.authors && this.authors.length === 0) {
            this.authors = undefined;
        }
        if (this.changes && this.changes.length === 0) {
            this.changes = undefined;
        }
    }
    a11yTitle;
    author;
    authorComments;
    authors;
    changes;
    contentType;
    defaultLanguage;
    dynamicDependencies;
    editorDependencies;
    embedTypes = ['iframe'];
    h;
    language = 'en';
    license;
    licenseExtras;
    licenseVersion;
    mainLibrary;
    metaDescription;
    metaKeywords;
    preloadedDependencies;
    source;
    title;
    w;
    yearsFrom;
    yearsTo;
    /**
     * Determines the main library and returns the ubername for it (e.g. "H5P.Example 1.0").
     * @param metadata the metadata object (=h5p.json)
     * @returns the ubername with a whitespace as separator
     */
    static toUbername(metadata) {
        const library = (metadata.preloadedDependencies || []).find((dependency) => dependency.machineName === metadata.mainLibrary);
        if (!library) {
            return undefined;
        }
        return LibraryName_1.default.toUberName(library, { useWhitespace: true });
    }
}
exports.ContentMetadata = ContentMetadata;
//# sourceMappingURL=ContentMetadata.js.map