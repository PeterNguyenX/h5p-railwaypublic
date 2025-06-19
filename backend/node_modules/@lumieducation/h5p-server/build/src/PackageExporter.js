"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const yazl_1 = __importDefault(require("yazl"));
const upath_1 = __importDefault(require("upath"));
const DependencyGetter_1 = __importDefault(require("./DependencyGetter"));
const H5pError_1 = __importDefault(require("./helpers/H5pError"));
const LibraryName_1 = __importDefault(require("./LibraryName"));
const types_1 = require("./types");
const ContentFileScanner_1 = require("./ContentFileScanner");
const Logger_1 = __importDefault(require("./helpers/Logger"));
const FilenameGenerator_1 = __importDefault(require("./helpers/FilenameGenerator"));
const utils_1 = require("./implementation/utils");
const LaissezFairePermissionSystem_1 = require("./implementation/LaissezFairePermissionSystem");
const log = new Logger_1.default('PackageExporter');
/**
 * Offers functionality to create .h5p files from content that is stored in the
 * system.
 */
class PackageExporter {
    libraryManager;
    contentStorage;
    /**
     * @param libraryManager
     * @param contentStorage (optional) Only needed if you want to use the
     * PackageExporter to copy content from a package (e.g. Upload option in the
     * editor)
     */
    constructor(
    // we don't use content storage directly as we want the
    // alterLibrarySemantics hook to work
    libraryManager, 
    // eslint-disable-next-line @typescript-eslint/default-param-last
    contentStorage = null, { exportMaxContentPathLength, permissionSystem }) {
        this.libraryManager = libraryManager;
        this.contentStorage = contentStorage;
        log.info(`initialize`);
        this.maxContentPathLength = exportMaxContentPathLength ?? 255;
        if (permissionSystem) {
            this.permissionSystem = permissionSystem;
        }
        else {
            this.permissionSystem = new LaissezFairePermissionSystem_1.LaissezFairePermissionSystem();
        }
    }
    maxContentPathLength;
    permissionSystem;
    /**
     * Creates a .h5p-package for the specified content file and pipes it to the
     * stream. Throws H5pErrors if something goes wrong. The contents of the
     * stream should be disregarded then.
     *
     * IMPORTANT: This method's returned promise will resolve BEFORE piping to
     * the writeable has been finished. If you outputStream is directly piped to
     * a download that's not an issue, but if you do something else with this
     * stream, you have to wait for the piping to finish by subscribing to the
     * 'finish' event of the stream!
     *
     * @param contentId The contentId for which the package should be created.
     * @param outputStream The stream that the package is written to (e.g. the
     * response stream fo Express)
     */
    async createPackage(contentId, outputStream, user) {
        log.info(`creating package for ${contentId}`);
        await this.checkPermission(contentId, user);
        // create zip files
        const outputZipFile = new yazl_1.default.ZipFile();
        outputZipFile.outputStream.pipe(outputStream);
        // get content data
        const parameters = await this.contentStorage.getParameters(contentId, user);
        const { metadata, metadataStream } = await this.getMetadata(contentId, user);
        // check if filenames are too long and shorten them in the parameters
        // if necessary; the substitutions that took place are returned and
        // later used to change the paths inside the zip archive
        const substitutions = await this.shortenFilenames(parameters, metadata, this.maxContentPathLength);
        // add json files
        const contentStream = await this.createContentFileStream(parameters);
        outputZipFile.addReadStream(contentStream, 'content/content.json');
        outputZipFile.addReadStream(metadataStream, 'h5p.json');
        // add content file (= files in content directory)
        await this.addContentFiles(contentId, user, outputZipFile, substitutions);
        // add library files
        await this.addLibraryFiles(metadata, outputZipFile);
        // signal the end of zip creation
        outputZipFile.end();
    }
    /**
     * Adds the files inside the content directory to the zip file. Does not
     * include content.json!
     * @param contentId the contentId of the content
     * @param user the user who wants to export
     * @param outputZipFile the file to write to
     * @param pathSubstitutions list of unix (!) paths to files whose paths were
     * changed in the parameters; this means the paths in the zip file must
     * be changed accordingly
     */
    async addContentFiles(contentId, user, outputZipFile, pathSubstitutions) {
        log.info(`adding content files to ${contentId}`);
        const contentFiles = await this.contentStorage.listFiles(contentId, user);
        for (const contentFile of contentFiles) {
            outputZipFile.addReadStream(await this.contentStorage.getFileStream(contentId, contentFile, user), `content/${pathSubstitutions[upath_1.default.toUnix(contentFile)] ?? contentFile}`);
        }
    }
    /**
     * Adds the library files to the zip file that are required for the content
     * to be playable.
     */
    async addLibraryFiles(metadata, outputZipFile) {
        log.info(`adding library files`);
        {
            const dependencyGetter = new DependencyGetter_1.default(this.libraryManager.libraryStorage);
            const dependencies = await dependencyGetter.getDependentLibraries(metadata.preloadedDependencies
                .concat(metadata.editorDependencies || [])
                .concat(metadata.dynamicDependencies || []), { editor: true, preloaded: true });
            for (const dependency of dependencies) {
                const files = await this.libraryManager.listFiles(dependency);
                for (const file of files) {
                    outputZipFile.addReadStream(await this.libraryManager.getFileStream(dependency, file), `${LibraryName_1.default.toUberName(dependency)}/${file}`);
                }
            }
        }
    }
    /**
     * Checks if a piece of content exists and if the user has download
     * permissions for it. Throws an exception with the respective error message
     * if this is not the case.
     */
    async checkPermission(contentId, user) {
        if (!(await this.contentStorage.contentExists(contentId))) {
            throw new H5pError_1.default('download-content-not-found', { contentId }, 404);
        }
        if (!(await this.permissionSystem.checkForContent(user, types_1.ContentPermission.Download, contentId))) {
            throw new H5pError_1.default('download-content-forbidden', { contentId }, 403);
        }
    }
    /**
     * Creates a readable stream for the content.json file
     */
    async createContentFileStream(parameters) {
        let contentStream;
        try {
            contentStream = new stream_1.Readable();
            // eslint-disable-next-line no-underscore-dangle
            contentStream._read = () => { };
            contentStream.push(JSON.stringify(parameters));
            contentStream.push(null);
        }
        catch (error) {
            throw new H5pError_1.default('download-content-unreadable-data');
        }
        return contentStream;
    }
    /**
     * Gets the metadata for the piece of content (h5p.json) and also creates a
     * file stream for it.
     */
    async getMetadata(contentId, user) {
        let metadataStream;
        let metadata;
        try {
            metadata = await this.contentStorage.getMetadata(contentId, user);
            metadataStream = new stream_1.Readable();
            // eslint-disable-next-line no-underscore-dangle
            metadataStream._read = () => { };
            metadataStream.push(JSON.stringify(metadata));
            metadataStream.push(null);
        }
        catch (error) {
            throw new H5pError_1.default('download-content-unreadable-metadata');
        }
        return { metadata, metadataStream };
    }
    /**
     * Scans the parameters of the piece of content and looks for paths that are
     * longer than the specified max length. If this happens the filenames are
     * shortened in the parameters and the substitution is returned in the
     * substitution list
     * @param parameters the parameters to scan; IMPORTANT: The parameters are
     * mutated by this method!!!
     * @param metadata the metadata of the piece of content
     * @param maxFilenameLength the maximum acceptable filename length
     * @returns an object whose keys are old paths and values the new paths to
     * be used instead; IMPORTANT: All paths are unix paths using slashes as
     * directory separators!
     */
    async shortenFilenames(parameters, metadata, maxFilenameLength) {
        const substitutions = {};
        // usedFilenames keeps track of filenames that are used in the package
        // to avoid duplicate filenames
        const usedFilenames = {};
        const contentScanner = new ContentFileScanner_1.ContentFileScanner(this.libraryManager);
        const files = await contentScanner.scanForFiles(parameters, metadata.preloadedDependencies.find((dep) => dep.machineName === metadata.mainLibrary));
        for (const file of files) {
            if (file.filePath.length >= maxFilenameLength) {
                const newFilename = await (0, FilenameGenerator_1.default)(file.filePath, (filenameToCheck) => (0, utils_1.generalizedSanitizeFilename)(filenameToCheck, new RegExp(''), maxFilenameLength - 17 // 9 for shortid and and 8
                // for content/ prefix of path in package
                ), async (fileToCheck) => usedFilenames[fileToCheck]);
                substitutions[file.filePath] = newFilename;
                file.context.params.path = newFilename;
                usedFilenames[newFilename] = true;
            }
            else {
                usedFilenames[file.filePath] = true;
            }
        }
        return substitutions;
    }
}
exports.default = PackageExporter;
//# sourceMappingURL=PackageExporter.js.map