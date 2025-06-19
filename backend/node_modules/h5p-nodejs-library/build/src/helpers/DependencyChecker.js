"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.hasDependencyOn = void 0;
var LibraryName_1 = __importDefault(require("../LibraryName"));
/**
 * Checks if the metadata contains any dependencies on the given library.
 * @param metadata
 * @param library
 */
function hasDependencyOn(metadata, library) {
    var _a, _b, _c;
    return (((_a = metadata.preloadedDependencies) === null || _a === void 0 ? void 0 : _a.some(function (dep) {
        return LibraryName_1["default"].equal(dep, library);
    })) || ((_b = metadata.editorDependencies) === null || _b === void 0 ? void 0 : _b.some(function (dep) {
        return LibraryName_1["default"].equal(dep, library);
    })) || ((_c = metadata.dynamicDependencies) === null || _c === void 0 ? void 0 : _c.some(function (dep) {
        return LibraryName_1["default"].equal(dep, library);
    })));
}
exports.hasDependencyOn = hasDependencyOn;
//# sourceMappingURL=DependencyChecker.js.map