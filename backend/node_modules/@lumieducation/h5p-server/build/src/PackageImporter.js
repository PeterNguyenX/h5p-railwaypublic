"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const promisepipe_1 = __importDefault(require("promisepipe"));
const tmp_promise_1 = require("tmp-promise");
const yauzl_promise_1 = __importDefault(require("yauzl-promise"));
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const H5pError_1 = __importDefault(require("./helpers/H5pError"));
const PackageValidator_1 = __importDefault(require("./PackageValidator"));
const types_1 = require("./types");
const Logger_1 = __importDefault(require("./helpers/Logger"));
const LibraryName_1 = __importDefault(require("./LibraryName"));
const log = new Logger_1.default('PackageImporter');
/**
 * Indicates what to do with content.
 */
var ContentCopyModes;
(function (ContentCopyModes) {
    /**
     * "Install" means that the content should be permanently added to the
     * system (i.e. added through ContentManager)
     */
    ContentCopyModes[ContentCopyModes["Install"] = 0] = "Install";
    /**
     * "Temporary" means that the content should not be permanently added to the
     * system. Instead only the content files (images etc.) are added to
     * temporary storage.
     */
    ContentCopyModes[ContentCopyModes["Temporary"] = 1] = "Temporary";
    /**
     * "NoCopy" means that content is ignored.
     */
    ContentCopyModes[ContentCopyModes["NoCopy"] = 2] = "NoCopy";
})(ContentCopyModes || (ContentCopyModes = {}));
/**
 * Handles the installation of libraries and saving of content from a H5P package.
 */
class PackageImporter {
    libraryManager;
    config;
    permissionSystem;
    contentManager;
    contentStorer;
    /**
     * @param libraryManager
     * @param config
     * @param contentStorer
     */
    constructor(libraryManager, config, permissionSystem, contentManager = null, contentStorer = null) {
        this.libraryManager = libraryManager;
        this.config = config;
        this.permissionSystem = permissionSystem;
        this.contentManager = contentManager;
        this.contentStorer = contentStorer;
        log.info(`initialize`);
    }
    /**
     * Extracts a H5P package to the specified directory.
     * @param packagePath The full path to the H5P package file on the local
     * disk
     * @param directoryPath The full path of the directory to which the package
     * should be extracted
     * @param includeLibraries If true, the library directories inside the
     * package will be extracted.
     * @param includeContent If true, the content folder inside the package will
     * be extracted.
     * @param includeMetadata If true, the h5p.json file inside the package will
     * be extracted.
     * @returns
     */
    static async extractPackage(packagePath, directoryPath, { includeLibraries = false, includeContent = false, includeMetadata = false }) {
        log.info(`extracting package ${packagePath} to ${directoryPath}`);
        const zipFile = await yauzl_promise_1.default.open(packagePath);
        for await (const entry of zipFile) {
            const basename = path_1.default.basename(entry.filename);
            if (!entry.filename.endsWith('/') &&
                !basename.startsWith('.') &&
                !basename.startsWith('_') &&
                ((includeContent && entry.filename.startsWith('content/')) ||
                    (includeLibraries &&
                        entry.filename.includes('/') &&
                        !entry.filename.startsWith('content/')) ||
                    (includeMetadata && entry.filename === 'h5p.json'))) {
                const readStream = await entry.openReadStream();
                const writePath = path_1.default.join(directoryPath, entry.filename);
                await (0, promises_1.mkdir)(path_1.default.dirname(writePath), { recursive: true });
                const writeStream = (0, fs_1.createWriteStream)(writePath);
                await (0, promisepipe_1.default)(readStream, writeStream);
            }
        }
        await zipFile.close();
    }
    /**
     * Permanently adds content from a H5P package to the system. This means
     * that content is __permanently__ added to storage and necessary libraries
     * are installed from the package if they are not already installed.
     *
     * This is __NOT__ what you want if the user is just uploading a package in
     * the editor client!
     *
     * Throws errors if something goes wrong.
     * @deprecated The method should not be used as it anymore, as there might
     * be issues with invalid filenames!
     * @param packagePath The full path to the H5P package file on the local
     * disk.
     * @param user The user who wants to upload the package.
     * @param contentId (optional) the content id to use for the package
     * @returns the newly assigned content id, the metadata (=h5p.json) and
     * parameters (=content.json) inside the package and a list of installed
     * libraries.
     */
    async addPackageLibrariesAndContent(packagePath, user, contentId) {
        log.info(`adding content from ${packagePath} to system`);
        const { id, metadata, parameters, installedLibraries } = await this.processPackage(packagePath, {
            copyMode: ContentCopyModes.Install,
            installLibraries: await this.permissionSystem.checkForGeneralAction(user, types_1.GeneralPermission.UpdateAndInstallLibraries)
        }, user, contentId);
        if (id === undefined) {
            throw new H5pError_1.default('import-package-no-id-assigned');
        }
        return { id, metadata, parameters, installedLibraries };
    }
    /**
     * Copies files inside the package into temporary storage and installs the
     * necessary libraries from the package if they are not already installed.
     * (This is what you want to do if the user uploads a package in the editor
     * client.) Pass the information returned about the content back to the
     * editor client. Throws errors if something goes wrong.
     * @param packagePath The full path to the H5P package file on the local
     * disk.
     * @param user The user who wants to upload the package.
     * @returns the metadata and parameters inside the package and a list of
     * installed libraries
     */
    async addPackageLibrariesAndTemporaryFiles(packagePath, user) {
        log.info(`adding content from ${packagePath} to system`);
        return this.processPackage(packagePath, {
            copyMode: ContentCopyModes.Temporary,
            installLibraries: await this.permissionSystem.checkForGeneralAction(user, types_1.GeneralPermission.UpdateAndInstallLibraries)
        }, user);
    }
    /**
     * Installs all libraries from the package. Assumes that the user calling
     * this has the permission to install libraries! Throws errors if something
     * goes wrong.
     * @param packagePath The full path to the H5P package file on the local
     * disk.
     * @returns a list of the installed libraries
     */
    async installLibrariesFromPackage(packagePath) {
        log.info(`installing libraries from package ${packagePath}`);
        return (await this.processPackage(packagePath, {
            copyMode: ContentCopyModes.NoCopy,
            installLibraries: true
        })).installedLibraries;
    }
    /**
     * Generic method to process a H5P package. Can install libraries and copy
     * content.
     * @param packagePath The full path to the H5P package file on the local
     * disk
     * @param installLibraries If true, try installing libraries from package.
     * Defaults to false.
     * @param copyMode indicates if and how content should be installed
     * @param user (optional) the user who wants to copy content (only needed
     * when copying content)
     * @returns the newly assigned content id (undefined if not saved
     * permanently), the metadata (=h5p.json) and parameters (=content.json)
     * inside the package. Also includes a list of libraries that were
     * installed.
     */
    async processPackage(packagePath, { installLibraries = false, copyMode = ContentCopyModes.NoCopy }, user, contentId) {
        log.info(`processing package ${packagePath}`);
        const packageValidator = new PackageValidator_1.default(this.config, this.libraryManager);
        // no need to check result as the validator throws an exception if there
        // is an error
        await packageValidator.validateFileSizes(packagePath);
        // we don't use withDir here, to have better error handling (catch &
        // finally block below)
        const { path: tempDirPath } = await (0, tmp_promise_1.dir)();
        let installedLibraries = [];
        try {
            await PackageImporter.extractPackage(packagePath, tempDirPath, {
                includeContent: copyMode === ContentCopyModes.Install ||
                    copyMode === ContentCopyModes.Temporary,
                includeLibraries: installLibraries,
                includeMetadata: copyMode === ContentCopyModes.Install ||
                    copyMode === ContentCopyModes.Temporary
            });
            await packageValidator.validateExtractedPackage(tempDirPath, copyMode === ContentCopyModes.Install ||
                copyMode === ContentCopyModes.Temporary, installLibraries);
            const dirContent = await (0, promises_1.readdir)(tempDirPath);
            // install all libraries
            if (installLibraries) {
                installedLibraries = (await Promise.all(dirContent
                    .filter((dirEntry) => dirEntry !== 'h5p.json' &&
                    dirEntry !== 'content')
                    .sort() // prevents deadlocks when installing libraries
                    .map((dirEntry) => this.libraryManager.installFromDirectory(path_1.default.join(tempDirPath, dirEntry), false)))).filter((installResult) => installResult !== undefined &&
                    installResult.type !== 'none');
            }
            let metadata;
            if (copyMode === ContentCopyModes.Install ||
                copyMode === ContentCopyModes.Temporary) {
                metadata = JSON.parse(await (0, promises_1.readFile)(path_1.default.join(tempDirPath, 'h5p.json'), 'utf-8'));
                // Check if all libraries needed for the content are installed.
                const requiredLibraries = this.getRequiredLibraries(metadata);
                const missingLibraries = await this.libraryManager.getNotInstalledLibraries(requiredLibraries);
                if (missingLibraries.length > 0) {
                    throw new H5pError_1.default('install-missing-libraries', {
                        libraries: missingLibraries
                            .map((l) => LibraryName_1.default.toUberName(l))
                            .join(', ')
                    }, 400);
                }
            }
            // Copy content files to the repository
            if (copyMode === ContentCopyModes.Install) {
                if (!this.contentManager) {
                    throw new Error('PackageImporter was initialized without a ContentManager, but you want to copy content from a package. Pass a ContentManager object to the the constructor!');
                }
                return {
                    ...(await this.contentStorer.copyFromDirectoryToStorage(metadata, tempDirPath, user, contentId)),
                    installedLibraries
                };
            }
            // Copy temporary files to the repository
            if (copyMode === ContentCopyModes.Temporary) {
                if (!this.contentStorer) {
                    throw new Error('PackageImporter was initialized without a ContentStorer, but you want to copy content from a package. Pass a ContentStorer object to the the constructor!');
                }
                return {
                    ...(await this.contentStorer.copyFromDirectoryToTemporary(metadata, tempDirPath, user)),
                    installedLibraries
                };
            }
            // eslint-disable-next-line no-useless-catch
        }
        catch (error) {
            // if we don't do this, finally weirdly just swallows the errors
            throw error;
        }
        finally {
            // clean up temporary files in any case
            await (0, promises_1.rm)(tempDirPath, { recursive: true, force: true });
        }
        return {
            id: undefined,
            installedLibraries,
            metadata: undefined,
            parameters: undefined
        };
    }
    /**
     * Gets all libraries referenced in the metadata
     * @param metadata
     * @returns the libraries
     */
    getRequiredLibraries = (metadata) => (metadata.editorDependencies ?? [])
        .concat(metadata.dynamicDependencies ?? [])
        .concat(metadata.preloadedDependencies);
}
exports.default = PackageImporter;
//# sourceMappingURL=PackageImporter.js.map