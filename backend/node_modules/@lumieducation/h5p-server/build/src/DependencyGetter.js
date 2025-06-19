"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const LibraryName_1 = __importDefault(require("./LibraryName"));
const Logger_1 = __importDefault(require("./helpers/Logger"));
const log = new Logger_1.default('DependencyGetter');
/**
 * Gets the libraries required to run a specific library.
 * Uses LibraryManager to get metadata for libraries.
 */
class DependencyGetter {
    libraryStorage;
    constructor(libraryStorage) {
        this.libraryStorage = libraryStorage;
        log.info(`initialize`);
    }
    /**
     * Gets all dependent libraries of the libraries in the list.
     * @param libraries the libraries whose dependencies should be retrieved
     * @param dynamic include dependencies that are part of the dynamicDependencies property or used in the content
     * @param editor include dependencies that are listed in editorDependencies
     * @param preloaded include regular dependencies that are included in preloadedDependencies
     * @param doNotAdd libraries in this list will not be added to the dependency list
     * @returns a list of libraries
     */
    async getDependentLibraries(libraries, { dynamic = false, editor = false, preloaded = false }, doNotAdd) {
        log.info(`getting dependent libraries for ${libraries
            .map((dep) => `${dep.machineName}-${dep.majorVersion}.${dep.minorVersion}`)
            .join(', ')}`);
        const dependencies = new Set();
        for (const library of libraries) {
            await this.addDependenciesRecursive(new LibraryName_1.default(library.machineName, typeof library.majorVersion === 'string'
                ? Number.parseInt(library.majorVersion, 10)
                : library.majorVersion, typeof library.minorVersion === 'string'
                ? Number.parseInt(library.minorVersion, 10)
                : library.minorVersion), { preloaded, editor, dynamic }, dependencies, doNotAdd);
        }
        return Array.from(dependencies).map((str) => LibraryName_1.default.fromUberName(str));
    }
    /**
     * Recursively walks through all dependencies of a library and adds them to the set libraries.
     * @param library the library that is currently being processed
     * @param libraries the set to add to
     * @returns the set that was added to (same as libraries; can be used to chain the call)
     */
    async addDependenciesRecursive(library, { dynamic = false, editor = false, preloaded = false }, libraries, doNotAdd) {
        log.debug(`adding dependencies recursively`);
        // we use strings to make equality comparison easier
        if (libraries.has(LibraryName_1.default.toUberName(library))) {
            return null;
        }
        let metadata;
        try {
            metadata = await this.libraryStorage.getLibrary(library);
        }
        catch {
            // We silently ignore missing libraries, as this can happen with
            // 'fake libraries' used by the H5P client (= libraries which are
            // referenced in the parameters, but don't exist)
            return libraries;
        }
        if (!doNotAdd?.some((dna) => LibraryName_1.default.equal(dna, library))) {
            libraries.add(LibraryName_1.default.toUberName(library));
        }
        if (preloaded && metadata.preloadedDependencies) {
            await this.addDependenciesToSet(metadata.preloadedDependencies, { preloaded, editor, dynamic }, libraries);
        }
        if (editor && metadata.editorDependencies) {
            await this.addDependenciesToSet(metadata.editorDependencies, { preloaded, editor, dynamic }, libraries);
        }
        if (dynamic && metadata.dynamicDependencies) {
            await this.addDependenciesToSet(metadata.dynamicDependencies, { preloaded, editor, dynamic }, libraries);
        }
        if (dynamic) {
            // TODO: recurse through semantic structure of content.json
        }
        return libraries;
    }
    /**
     * Adds all dependencies in the list to the set.
     */
    async addDependenciesToSet(dependencies, { dynamic = false, editor = false, preloaded = false }, libraries, doNotAdd) {
        log.info(`adding dependencies to set`);
        for (const dependency of dependencies) {
            await this.addDependenciesRecursive(new LibraryName_1.default(dependency.machineName, dependency.majorVersion, dependency.minorVersion), { preloaded, editor, dynamic }, libraries, doNotAdd);
        }
    }
}
exports.default = DependencyGetter;
//# sourceMappingURL=DependencyGetter.js.map