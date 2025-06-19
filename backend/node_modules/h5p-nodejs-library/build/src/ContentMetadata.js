"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.ContentMetadata = void 0;
var LibraryName_1 = __importDefault(require("./LibraryName"));
/**
 * Content metadata object with defaults for required values and
 * sanitization to make sure it the metadata conforms to the schema.
 */
var ContentMetadata = /** @class */ (function () {
    /**
     * Creates an object conforming to the h5p.json schema.
     * @param furtherMetadata these objects will be merged into the newly created object
     */
    function ContentMetadata() {
        var furtherMetadata = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            furtherMetadata[_i] = arguments[_i];
        }
        this.embedTypes = ['iframe'];
        this.language = 'en';
        for (var _a = 0, furtherMetadata_1 = furtherMetadata; _a < furtherMetadata_1.length; _a++) {
            var metadata = furtherMetadata_1[_a];
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
    /**
     * Determines the main library and returns the ubername for it (e.g. "H5P.Example 1.0").
     * @param metadata the metadata object (=h5p.json)
     * @returns the ubername with a whitespace as separator
     */
    ContentMetadata.toUbername = function (metadata) {
        var library = (metadata.preloadedDependencies || []).find(function (dependency) { return dependency.machineName === metadata.mainLibrary; });
        if (!library) {
            return undefined;
        }
        return LibraryName_1["default"].toUberName(library, { useWhitespace: true });
    };
    return ContentMetadata;
}());
exports.ContentMetadata = ContentMetadata;
//# sourceMappingURL=ContentMetadata.js.map