"use strict";
exports.__esModule = true;
var __1 = require("../");
/**
 * Collects lists of files grouped by libraries.
 */
var LibrariesFilesList = /** @class */ (function () {
    function LibrariesFilesList() {
        this.usedFiles = {};
    }
    /**
     * Adds a library file to the list.
     * @param library
     * @param filename
     */
    LibrariesFilesList.prototype.addFile = function (library, filename) {
        var ubername = __1.LibraryName.toUberName(library);
        if (!this.usedFiles[ubername]) {
            this.usedFiles[ubername] = [];
        }
        this.usedFiles[ubername].push(filename);
    };
    /**
     * Checks if a library file is in the list
     * @param library
     * @param filename
     */
    LibrariesFilesList.prototype.checkFile = function (library, filename) {
        var _a;
        return (_a = this.usedFiles[__1.LibraryName.toUberName(library)]) === null || _a === void 0 ? void 0 : _a.includes(filename);
    };
    /**
     * Clears the list of all libraries.
     */
    LibrariesFilesList.prototype.clear = function () {
        this.usedFiles = {};
    };
    return LibrariesFilesList;
}());
exports["default"] = LibrariesFilesList;
//# sourceMappingURL=LibrariesFilesList.js.map