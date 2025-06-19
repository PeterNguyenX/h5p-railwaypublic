"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasDependencyOn = hasDependencyOn;
const LibraryName_1 = __importDefault(require("../LibraryName"));
/**
 * Checks if the metadata contains any dependencies on the given library.
 * @param metadata
 * @param library
 */
function hasDependencyOn(metadata, library) {
    return (metadata.preloadedDependencies?.some((dep) => LibraryName_1.default.equal(dep, library)) ||
        metadata.editorDependencies?.some((dep) => LibraryName_1.default.equal(dep, library)) ||
        metadata.dynamicDependencies?.some((dep) => LibraryName_1.default.equal(dep, library)));
}
//# sourceMappingURL=DependencyChecker.js.map