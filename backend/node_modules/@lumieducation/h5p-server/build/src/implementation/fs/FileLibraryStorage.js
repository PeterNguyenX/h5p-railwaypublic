"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const get_all_files_1 = require("get-all-files");
const path_1 = __importDefault(require("path"));
const promisepipe_1 = __importDefault(require("promisepipe"));
const upath_1 = __importDefault(require("upath"));
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const filenameUtils_1 = require("./filenameUtils");
const StreamHelpers_1 = require("../../helpers/StreamHelpers");
const H5pError_1 = __importDefault(require("../../helpers/H5pError"));
const InstalledLibrary_1 = __importDefault(require("../../InstalledLibrary"));
const LibraryName_1 = __importDefault(require("../../LibraryName"));
/**
 * Stores libraries in a directory.
 */
class FileLibraryStorage {
    librariesDirectory;
    /**
     * Gets the directory path of the specified library.
     * @param library
     * @returns the absolute path to the directory
     */
    getDirectoryPath(library) {
        return path_1.default.join(this.getLibrariesDirectory(), LibraryName_1.default.toUberName(library));
    }
    /**
     * Gets the path of any file of the specified library.
     * @param library
     * @param filename
     * @returns the absolute path to the file
     */
    getFilePath(library, filename) {
        return path_1.default.join(this.getLibrariesDirectory(), LibraryName_1.default.toUberName(library), filename);
    }
    /**
     * Get the base path of the libraries
     * @returns the base library path
     */
    getLibrariesDirectory() {
        return this.librariesDirectory;
    }
    /**
     * Files with this pattern are not returned when listing the directory contents. Can be used by classes
     * extending FileLibraryStorage to hide internals.
     */
    ignoredFilePatterns = [];
    /**
     * @param librariesDirectory The path of the directory in the file system at which libraries are stored.
     */
    constructor(librariesDirectory) {
        this.librariesDirectory = librariesDirectory;
        (0, fs_1.mkdirSync)(librariesDirectory, { recursive: true });
    }
    /**
     * Adds a library file to a library. The library metadata must have been installed with installLibrary(...) first.
     * Throws an error if something unexpected happens.
     * @param library The library that is being installed
     * @param filename Filename of the file to add, relative to the library root
     * @param stream The stream containing the file content
     * @returns true if successful
     */
    async addFile(library, filename, stream) {
        (0, filenameUtils_1.checkFilename)(filename);
        if (!(await this.isInstalled(library))) {
            throw new H5pError_1.default('storage-file-implementations:add-library-file-not-installed', { filename, libraryName: LibraryName_1.default.toUberName(library) }, 500);
        }
        const fullPath = this.getFilePath(library, filename);
        await (0, promises_1.mkdir)(path_1.default.dirname(fullPath), { recursive: true });
        const writeStream = (0, fs_1.createWriteStream)(fullPath);
        await (0, promisepipe_1.default)(stream, writeStream);
        return true;
    }
    /**
     * Adds the metadata of the library to the repository.
     * Throws errors if something goes wrong.
     * @param libraryMetadata The library metadata object (= content of library.json)
     * @param restricted True if the library can only be used be users allowed to install restricted libraries.
     * @returns The newly created library object to use when adding library files with addFile(...)
     */
    async addLibrary(libraryMetadata, restricted = false) {
        const library = new InstalledLibrary_1.default(libraryMetadata.machineName, libraryMetadata.majorVersion, libraryMetadata.minorVersion, libraryMetadata.patchVersion, restricted);
        const libPath = this.getDirectoryPath(library);
        try {
            await (0, promises_1.access)(libPath);
            throw new H5pError_1.default('storage-file-implementations:install-library-already-installed', {
                libraryName: LibraryName_1.default.toUberName(library)
            });
        }
        catch {
            // Do nothing
        }
        try {
            await (0, promises_1.mkdir)(libPath, { recursive: true });
            await (0, promises_1.writeFile)(this.getFilePath(library, 'library.json'), JSON.stringify(libraryMetadata));
            return library;
        }
        catch (error) {
            await (0, promises_1.rm)(libPath, { recursive: true, force: true });
            throw error;
        }
    }
    /**
     * Removes all files of a library. Doesn't delete the library metadata. (Used when updating libraries.)
     * @param library the library whose files should be deleted
     * @returns
     */
    async clearFiles(library) {
        if (!(await this.isInstalled(library))) {
            throw new H5pError_1.default('storage-file-implementations:clear-library-not-found', {
                libraryName: LibraryName_1.default.toUberName(library)
            });
        }
        const fullLibraryPath = this.getDirectoryPath(library);
        const directoryEntries = (await (0, promises_1.readdir)(fullLibraryPath)).filter((entry) => entry !== 'library.json');
        await Promise.all(directoryEntries.map((entry) => (0, promises_1.rm)(this.getFilePath(library, entry), {
            recursive: true,
            force: true
        })));
    }
    /**
     * Removes the library and all its files from the repository.
     * Throws errors if something went wrong.
     * @param library The library to remove.
     * @returns
     */
    async deleteLibrary(library) {
        const libPath = this.getDirectoryPath(library);
        try {
            await (0, promises_1.access)(libPath);
        }
        catch {
            throw new H5pError_1.default('storage-file-implementations:remove-library-library-missing', { libraryName: LibraryName_1.default.toUberName(library) }, 404);
        }
        await (0, promises_1.rm)(libPath, { recursive: true, force: true });
    }
    /**
     * Check if the library contains a file
     * @param library The library to check
     * @param filename
     * @returns true if file exists in library, false otherwise
     */
    async fileExists(library, filename) {
        (0, filenameUtils_1.checkFilename)(filename);
        if (this.isIgnored(filename)) {
            return false;
        }
        try {
            await (0, promises_1.access)(this.getFilePath(library, filename));
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Counts how often libraries are listed in the dependencies of other
     * libraries and returns a list of the number.
     * @returns an object with ubernames as key.
     * Example:
     * {
     *   'H5P.Example': 10
     * }
     * This means that H5P.Example is used by 10 other libraries.
     */
    async getAllDependentsCount() {
        const librariesNames = await this.getInstalledLibraryNames();
        const librariesMetadata = await Promise.all(librariesNames.map((lib) => this.getLibrary(lib)));
        // the metadata map allows faster access to libraries by ubername
        const librariesMetadataMap = librariesMetadata.reduce((prev, curr) => {
            prev[LibraryName_1.default.toUberName(curr)] = curr;
            return prev;
        }, {});
        // Remove circular dependencies caused by editor dependencies in
        // content types like H5P.InteractiveVideo.
        for (const libraryMetadata of librariesMetadata) {
            for (const dependency of libraryMetadata.editorDependencies ?? []) {
                const ubername = LibraryName_1.default.toUberName(dependency);
                const index = librariesMetadataMap[ubername]?.preloadedDependencies?.findIndex((ln) => LibraryName_1.default.equal(ln, libraryMetadata));
                if (index >= 0) {
                    librariesMetadataMap[ubername].preloadedDependencies.splice(index, 1);
                }
            }
        }
        // Count dependencies
        const dependencies = {};
        for (const libraryMetadata of librariesMetadata) {
            for (const dependency of (libraryMetadata.preloadedDependencies ?? [])
                .concat(libraryMetadata.editorDependencies ?? [])
                .concat(libraryMetadata.dynamicDependencies ?? [])) {
                const ubername = LibraryName_1.default.toUberName(dependency);
                dependencies[ubername] = (dependencies[ubername] ?? 0) + 1;
            }
        }
        return dependencies;
    }
    /**
     * Returns the number of libraries that depend on this (single) library.
     * @param library the library to check
     * @returns the number of libraries that depend on this library.
     */
    async getDependentsCount(library) {
        const allDependencies = await this.getAllDependentsCount();
        return allDependencies[LibraryName_1.default.toUberName(library)] ?? 0;
    }
    async getFileAsJson(library, file) {
        const str = await this.getFileAsString(library, file);
        return JSON.parse(str);
    }
    async getFileAsString(library, file) {
        const stream = await this.getFileStream(library, file);
        return (0, StreamHelpers_1.streamToString)(stream);
    }
    /**
     * Returns a information about a library file.
     * Throws an exception if the file does not exist.
     * @param library library
     * @param filename the relative path inside the library
     * @returns the file stats
     */
    async getFileStats(library, filename) {
        (0, filenameUtils_1.checkFilename)(filename);
        if (!(await this.fileExists(library, filename)) ||
            this.isIgnored(filename)) {
            throw new H5pError_1.default('library-file-missing', {
                filename,
                library: LibraryName_1.default.toUberName(library)
            }, 404);
        }
        return (0, promises_1.stat)(this.getFilePath(library, filename));
    }
    /**
     * Returns a readable stream of a library file's contents.
     * Throws an exception if the file does not exist.
     * @param library library
     * @param filename the relative path inside the library
     * @returns a readable stream of the file's contents
     */
    async getFileStream(library, filename) {
        (0, filenameUtils_1.checkFilename)(filename);
        if (!(await this.fileExists(library, filename)) ||
            this.isIgnored(filename)) {
            throw new H5pError_1.default('library-file-missing', {
                filename,
                library: LibraryName_1.default.toUberName(library)
            }, 404);
        }
        return (0, fs_1.createReadStream)(this.getFilePath(library, filename));
    }
    /**
     * Returns all installed libraries or the installed libraries that have the
     * machine names.
     * @param machineName (optional) only return libraries that have this
     * machine name
     * @returns the libraries installed
     */
    async getInstalledLibraryNames(machineName) {
        const nameRegex = /^([\w.]+)-(\d+)\.(\d+)$/i;
        const libraryDirectories = await (0, promises_1.readdir)(this.getLibrariesDirectory());
        return libraryDirectories
            .filter((name) => nameRegex.test(name))
            .map((name) => LibraryName_1.default.fromUberName(name))
            .filter((lib) => !machineName || lib.machineName === machineName);
    }
    /**
     * Gets a list of installed language files for the library.
     * @param library The library to get the languages for
     * @returns The list of JSON files in the language folder (without the extension .json)
     */
    async getLanguages(library) {
        const files = await (0, promises_1.readdir)(this.getFilePath(library, 'language'));
        return files
            .filter((file) => path_1.default.extname(file) === '.json')
            .map((file) => path_1.default.basename(file, '.json'));
    }
    /**
     * Gets the library metadata (= content of library.json) of the library.
     * @param library the library
     * @returns the metadata
     */
    async getLibrary(library) {
        if (!(await this.isInstalled(library))) {
            throw new H5pError_1.default('storage-file-implementations:get-library-metadata-not-installed', { libraryName: LibraryName_1.default.toUberName(library) }, 404);
        }
        return InstalledLibrary_1.default.fromMetadata(JSON.parse(await (0, StreamHelpers_1.streamToString)(await this.getFileStream(library, 'library.json'))));
    }
    /**
     * Checks if a library is installed in the system.
     * @param library the library to check
     * @returns true if installed, false if not
     */
    async isInstalled(library) {
        try {
            await (0, promises_1.access)(this.getFilePath(library, 'library.json'));
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Returns a list of library addons that are installed in the system.
     * Addons are libraries that have the property 'addTo' in their metadata.
     */
    async listAddons() {
        const installedLibraries = await this.getInstalledLibraryNames();
        return (await Promise.all(installedLibraries.map((addonName) => this.getLibrary(addonName)))).filter((library) => library.addTo !== undefined);
    }
    /**
     * Gets a list of all library files that exist for this library.
     * @param library
     * @returns all files that exist for the library
     */
    async listFiles(library) {
        const libPath = this.getDirectoryPath(library);
        const libPathLength = libPath.length + 1;
        return (await (0, get_all_files_1.getAllFiles)(libPath).toArray())
            .map((p) => p.substr(libPathLength))
            .filter((p) => !this.isIgnored(p))
            .map((p) => upath_1.default.toUnix(p))
            .sort();
    }
    /**
     * Updates the additional metadata properties that is added to the
     * stored libraries. This metadata can be used to customize behavior like
     * restricting libraries to specific users.
     * @param library the library for which the metadata should be updated
     * @param additionalMetadata the metadata to update
     * @returns true if the additionalMetadata object contained real changes
     * and if they were successfully saved; false if there were not changes.
     * Throws an error if saving was not possible.
     */
    async updateAdditionalMetadata(library, additionalMetadata) {
        const metadata = await this.getLibrary(library);
        // We set dirty to true if there is an actual update in the
        // additional metadata.
        let dirty = false;
        for (const property of Object.keys(additionalMetadata)) {
            if (additionalMetadata[property] !== metadata[property]) {
                metadata[property] = additionalMetadata[property];
                dirty = true;
            }
        }
        if (!dirty) {
            return false;
        }
        try {
            await (0, promises_1.writeFile)(this.getFilePath(library, 'library.json'), JSON.stringify(metadata));
            return true;
        }
        catch (error) {
            throw new H5pError_1.default('storage-file-implementations:error-updating-metadata', {
                library: LibraryName_1.default.toUberName(library),
                error: error.message
            }, 500);
        }
    }
    /**
     * Updates the library metadata.
     * This is necessary when updating to a new patch version.
     * You also need to call clearFiles(...) to remove all old files
     * during the update process and addFile(...) to add the files of
     * the patch.
     * @param libraryMetadata the new library metadata
     * @returns The updated library object
     */
    async updateLibrary(libraryMetadata) {
        const libPath = this.getDirectoryPath(libraryMetadata);
        try {
            await (0, promises_1.access)(libPath);
        }
        catch {
            throw new H5pError_1.default('storage-file-implementations:update-library-library-missing', { libraryName: LibraryName_1.default.toUberName(libraryMetadata) }, 404);
        }
        await (0, promises_1.writeFile)(this.getFilePath(libraryMetadata, 'library.json'), JSON.stringify(libraryMetadata));
        const newLibrary = InstalledLibrary_1.default.fromMetadata(libraryMetadata);
        return newLibrary;
    }
    /**
     * Checks if a filename is in the ignore list.
     * @param filename the filename to check
     */
    isIgnored(filename) {
        return this.ignoredFilePatterns.some((pattern) => pattern.test(filename));
    }
}
exports.default = FileLibraryStorage;
//# sourceMappingURL=FileLibraryStorage.js.map