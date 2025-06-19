"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ajv_1 = __importDefault(require("ajv"));
const ajv_keywords_1 = __importDefault(require("ajv-keywords"));
const path = __importStar(require("path"));
const yauzl = __importStar(require("yauzl-promise"));
const upath_1 = __importDefault(require("upath"));
const get_all_files_1 = require("get-all-files");
const promises_1 = require("fs/promises");
const AggregateH5pError_1 = __importDefault(require("./helpers/AggregateH5pError"));
const H5pError_1 = __importDefault(require("./helpers/H5pError"));
const Logger_1 = __importDefault(require("./helpers/Logger"));
const StringFormatter_1 = require("./helpers/StringFormatter");
const ValidatorBuilder_1 = require("./helpers/ValidatorBuilder");
const LibraryName_1 = __importDefault(require("./LibraryName"));
const log = new Logger_1.default('PackageValidator');
/**
 * Performs checks if uploaded H5P packages or those from the H5P Hub are valid.
 * Call await validatePackage(...) to perform these checks.
 *
 * The validator currently does not check if all necessary library versions will
 * be present after performing an upgrade (done in ll. 968 - 1032 of
 * h5p.classes.php). This is not done because it would require enumerating all
 * installed libraries and this is not possible in the extractor without
 * introducing a dependency to the core.
 *
 * REMARK: Note that the validator operates on zip files and thus has to use
 * slashes (/) in paths regardless of the operating system!
 */
class PackageValidator {
    config;
    libraryManager;
    /**
     * @param configurationValues Object containing all required configuration
     * parameters
     */
    constructor(config, libraryManager) {
        this.config = config;
        this.libraryManager = libraryManager;
        log.debug(`initialize`);
        this.contentExtensionWhitelist = config.contentWhitelist.split(' ');
        this.libraryExtensionWhitelist = config.libraryWhitelist
            .split(' ')
            .concat(this.contentExtensionWhitelist);
    }
    contentExtensionWhitelist;
    h5pMetadataValidator;
    languageFileRegex = /^(-?[a-z]+){1,7}\.json$/i;
    libraryDirectoryNameRegex = /^[\w0-9\-.]{1,255}$/i;
    libraryExtensionWhitelist;
    libraryMetadataValidator;
    /**
     * Returns a list of top-level directories in the directory
     * @param pathPrefix the path of the parent directory
     * @returns list of top-level directories
     */
    static async getTopLevelDirectories(pathPrefix) {
        log.verbose(`getting top level directories`);
        return (await (0, promises_1.readdir)(pathPrefix, { withFileTypes: true }))
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);
    }
    /**
     * Checks if the passed filename has an extension that is in the passed list.
     * @param filename The filename to check
     * @param allowedExtensions A list of extensions to check against
     */
    static isAllowedFileExtension(filename, allowedExtensions) {
        log.verbose(`checking allowed file extension: ${filename} - allowed extensions: ${allowedExtensions.join(', ')}`);
        let actualExtension = path.extname(filename);
        if (actualExtension === '') {
            return false;
        }
        actualExtension = actualExtension.substr(1);
        if (allowedExtensions.some((allowedExtension) => allowedExtension === actualExtension)) {
            return true;
        }
        return false;
    }
    /**
     * Opens the zip archive.
     * @param file Path to file to open
     * @returns Zip archive object or undefined if zip file cannot be opened.
     */
    static async openZipArchive(file) {
        try {
            log.debug(`opening zip archive ${file}`);
            // we await the promise here because we want to catch the error and
            // return undefined
            return await yauzl.open(file);
        }
        catch (ignored) {
            log.error(`zip file ${file} could not be opened: ${ignored}`);
            return undefined;
        }
    }
    async validateFileSizes(h5pFile) {
        log.debug(`validating file sizes in ${h5pFile}`);
        const zipArchive = await PackageValidator.openZipArchive(h5pFile);
        if (!zipArchive) {
            log.error(`zip archive not valid`);
            throw new H5pError_1.default('unable-to-unzip', {}, 400);
        }
        const result = await new ValidatorBuilder_1.ValidatorBuilder()
            .addRule(this.fileSizeMustBeWithinLimits)
            .addRule(ValidatorBuilder_1.throwErrorsNowRule)
            .addRule(this.returnTrue)
            .validate(await zipArchive.readEntries(), '');
        await zipArchive.close();
        return result;
    }
    /**
     * Validates the H5P package located at the path passed to the method.
     * @param h5pFile Path to H5P file to validate
     * @param checkContent If true, the method will check if the content in the
     * package conforms to the standard
     * @param checkLibraries If true, the method will check if the libraries in
     * the package conform to the standard
     * @returns true if the package is valid. Will throw Errors with the error
     * in Error.message if there is a validation error.
     */
    async validateExtractedPackage(packagePath, checkContent = true, checkLibraries = true, skipInstalledLibraries = true) {
        log.debug(`validating package in directory ${packagePath}`);
        await this.initializeJsonValidators();
        const packagePathLength = packagePath.length + 1;
        const files = (await (0, get_all_files_1.getAllFiles)(packagePath).toArray()).map((f) => upath_1.default.toUnix(f.substr(packagePathLength)));
        const result = await new ValidatorBuilder_1.ValidatorBuilder()
            .addRule(this.filterOutEntries((filename) => path.basename(filename).startsWith('.') ||
            path.basename(filename).startsWith('_')))
            .addRuleWhen(this.fileExtensionMustBeAllowed((name) => name.startsWith('content/'), this.contentExtensionWhitelist), checkContent)
            .addRuleWhen(this.fileExtensionMustBeAllowed((name) => name.includes('/') && !name.startsWith('content/'), this.libraryExtensionWhitelist), checkLibraries)
            .addRuleWhen(this.fileMustExist('h5p.json', 'invalid-h5p-json-file', true), checkContent)
            .addRuleWhen(this.jsonMustConformToSchema('h5p.json', this.h5pMetadataValidator, 'invalid-h5p-json-file-2', 'unable-to-parse-package', undefined, {
            filename: 'h5p.json'
        }), checkContent)
            .addRuleWhen(this.fileMustExist('content/content.json', 'invalid-content-folder', true), checkContent)
            .addRuleWhen(this.jsonMustBeParsable('content/content.json', 'unable-to-parse-package', undefined, undefined, { filename: 'content/content.json' }), checkContent)
            .addRule(ValidatorBuilder_1.throwErrorsNowRule)
            .addRuleWhen(this.librariesMustBeValid(skipInstalledLibraries), checkLibraries)
            .addRule(ValidatorBuilder_1.throwErrorsNowRule)
            .addRule(this.returnTrue)
            .validate(files, packagePath);
        return result;
    }
    /**
     * Checks if the core API version required in the metadata can be satisfied
     * by the running instance.
     * @param metadata The object containing information about the required core
     * version
     * @param libraryName The name of the library that is being checked.
     * @param error The error object.
     * @returns true if the core API required in the metadata can be satisfied
     * by the running instance. Also true if the metadata doesn't require any
     * core API version.
     */
    checkCoreVersion(metadata, libraryName, error) {
        log.debug(`checking core version for ${libraryName}`);
        if (!metadata.coreApi ||
            !metadata.coreApi.majorVersion ||
            !metadata.coreApi.minorVersion) {
            return true;
        }
        if (metadata.coreApi.majorVersion > this.config.coreApiVersion.major ||
            (metadata.coreApi.majorVersion ===
                this.config.coreApiVersion.major &&
                metadata.coreApi.minorVersion >
                    this.config.coreApiVersion.minor)) {
            log.error(`api version ${metadata.coreApi.majorVersion}.${metadata.coreApi.minorVersion} for ${libraryName} not supported`);
            error.addError(new H5pError_1.default('api-version-unsupported', {
                component: libraryName,
                current: `${this.config.coreApiVersion.major}.${this.config.coreApiVersion.minor}`,
                required: `${metadata.coreApi.majorVersion}.${metadata.coreApi.minorVersion}`
            }, 400));
        }
        return true;
    }
    /**
     * Factory for the file extension rule: Checks if the file extensions of the
     * files in the array are in the whitelists. Does NOT throw errors but
     * appends them to the error object.
     * @param filter The filter function must return true if the filename passed
     * to it should be checked
     * @param whitelist The file extensions that are allowed for files that
     * match the filter
     * @returns the rule
     */
    fileExtensionMustBeAllowed(filter, whitelist) {
        return async (filenames, pathPrefix, error) => {
            for (const filename of filenames) {
                const lowercaseName = filename.toLocaleLowerCase();
                // Skip files that aren't matched by the filter and directories
                if (filter(lowercaseName) &&
                    !PackageValidator.isAllowedFileExtension(lowercaseName, whitelist)) {
                    log.error(`file extension ${filename} is not in whitelist: ${whitelist.join(', ')}`);
                    error.addError(new H5pError_1.default('not-in-whitelist', {
                        filename,
                        'files-allowed': this.contentExtensionWhitelist.join(' ')
                    }));
                }
            }
            return filenames;
        };
    }
    /**
     * Factory for a rule that makes sure that a certain file must exist. Does
     * NOT throw errors but appends them to the error object.
     * @param filename The filename that must exist among the zip entries (path,
     * not case-sensitive)
     * @param errorId The error message that is used if the file does not exist
     * @param throwOnError (optional) If true, the rule will throw an error if
     * the file does not exist.
     * @param errorReplacements (optional) The replacement variables to pass to
     * the error.
     * @returns the rule
     */
    fileMustExist(filename, errorId, throwOnError = false, errorReplacements = {}) {
        return async (filenames, pathPrefix, error) => {
            log.debug(`checking if file ${filename} exists`);
            if (!filenames.find((e) => e.toLocaleLowerCase() === filename.toLocaleLowerCase())) {
                log.error(`file ${filename} does not exist`);
                error.addError(new H5pError_1.default(errorId, errorReplacements));
                if (throwOnError) {
                    throw error;
                }
            }
            return filenames;
        };
    }
    /**
     * Checks file sizes (single files and all files combined) Does NOT throw
     * errors but appends them to the error object.
     * @param zipEntries The entries inside the h5p file
     * @param error The error object to use
     * @returns The unchanged zip entries
     */
    fileSizeMustBeWithinLimits = async (zipEntries, pathPrefix, error) => {
        log.debug(`checking if file sizes exceed limit`);
        let totalFileSize = 0; // in bytes
        if (this.config.maxFileSize) {
            for (const entry of zipEntries) {
                totalFileSize += entry.uncompressedSize;
                if (entry.uncompressedSize > this.config.maxFileSize) {
                    log.error(`file ${entry.filename} exceeds limit`);
                    error.addError(new H5pError_1.default('file-size-too-large', {
                        file: entry.filename,
                        max: (0, StringFormatter_1.formatBytes)(this.config.maxFileSize),
                        used: (0, StringFormatter_1.formatBytes)(entry.uncompressedSize)
                    }));
                }
            }
        }
        if (this.config.maxTotalSize &&
            totalFileSize > this.config.maxTotalSize) {
            log.error(`total size is too large`);
            error.addError(new H5pError_1.default('total-size-too-large', {
                max: (0, StringFormatter_1.formatBytes)(this.config.maxTotalSize),
                used: (0, StringFormatter_1.formatBytes)(totalFileSize)
            }));
        }
        return zipEntries;
    };
    /**
     * Factory for a rule that filters out files from the validation.
     * @param filter The filter. Filenames matched by this filter will be
     * filtered out.
     * @returns the rule
     */
    filterOutEntries(filter) {
        /**
         * @param filenames The files in the package in temporary storage
         * @returns the filtered out filesnames
         */
        return async (filenames) => filenames.filter((e) => !filter(e));
    }
    /**
     * Initializes the JSON schema validators _h5pMetaDataValidator and
     * _libraryMetadataValidator. Can be called multiple times, as it only
     * creates new validators when it hasn't been called before.
     */
    async initializeJsonValidators() {
        if (this.h5pMetadataValidator && this.libraryMetadataValidator) {
            return;
        }
        log.debug(`initializing json validators`);
        const jsonValidator = new ajv_1.default();
        (0, ajv_keywords_1.default)(jsonValidator, 'regexp');
        const h5pJsonSchema = JSON.parse(await (0, promises_1.readFile)(path.join(__dirname, 'schemas/h5p-schema.json'), 'utf-8'));
        const libraryNameSchema = JSON.parse(await (0, promises_1.readFile)(path.join(__dirname, 'schemas/library-name-schema.json'), 'utf-8'));
        const librarySchema = JSON.parse(await (0, promises_1.readFile)(path.join(__dirname, 'schemas/library-schema.json'), 'utf-8'));
        jsonValidator.addSchema([
            h5pJsonSchema,
            libraryNameSchema,
            librarySchema
        ]);
        this.h5pMetadataValidator = jsonValidator.compile(h5pJsonSchema);
        this.libraryMetadataValidator = jsonValidator.compile(librarySchema);
        log.debug('Json validators initialized');
    }
    /**
     * Factory for a rule that makes sure a JSON file is parsable. Throws an
     * error if the JSON file can't be parsed.
     * @param filename The path to the file.
     * @param errorId An optional error message to use instead of the default
     * @param skipIfNonExistent if true, the rule does not produce an error if
     * the file doesn't exist.
     * @param throwIfError if true, the rule will throw an error if the JSON
     * file is not parsable, otherwise it will append the error message to the
     * error object
     * @param errorReplacements replacements to use when generating the an error
     * @return The rule
     */
    jsonMustBeParsable(filename, errorId, skipIfNonExistent = false, throwIfError = true, errorReplacements = {}) {
        return async (filenames, pathPrefix, error) => {
            log.debug(`checking if json of ${filename} is parsable`);
            const file = filenames.find((e) => e.toLocaleLowerCase() === filename.toLocaleLowerCase());
            if (!file) {
                if (skipIfNonExistent) {
                    return filenames;
                }
                log.error(`File ${filename} missing from H5P package. Make sure to use the fileMustExistRule before using jsonMustBeParsableRule!`);
                throw new Error(`File ${filename} missing from H5P package. Make sure to use the fileMustExistRule before using jsonMustBeParsableRule!`);
            }
            try {
                JSON.parse(await (0, promises_1.readFile)(path.join(pathPrefix, file), 'utf-8'));
            }
            catch (jsonParseError) {
                log.error(`json ${filename} is not parsable`);
                const err = new H5pError_1.default(errorId || jsonParseError.errorId, errorId ? errorReplacements : jsonParseError.replacements, 400, jsonParseError.debugMessage);
                if (throwIfError) {
                    throw error.addError(err);
                }
                else {
                    error.addError(err);
                }
            }
            return filenames;
        };
    }
    /**
     * Factory for a rule that makes sure a JSON file is parsable and conforms
     * to the specified JSON schema. Throws an error if the JSON file can't be
     * parsed or if it does not conform to the schema.
     * @param filename The path to the file.
     * @param schemaValidator The validator for the required schema.
     * @param errorIdAnyError The id of the message that is emitted, when there
     * is an error. (Allowed placeholders: %name, %reason)
     * @param errorIdJsonParse (optional) The message to output if the JSON file
     * is not parsable (will default to a generíc error message)
     * @param returnContent (optional) If true, the rule will return an object
     * with { filenames, jsonData } where jsonData contains the parsed JSON of
     * the file
     * @param errorReplacements (optional) The replacements to pass to error
     * objects created in the method.
     * @return The rule (return value: An array of filenames if returnContent ==
     * false, otherwise the JSON content is added to the return object)
     */
    jsonMustConformToSchema(filename, schemaValidator, errorIdAnyError, errorIdJsonParse, returnContent = false, errorReplacements = {}) {
        return async (filenames, pathPrefix, error) => {
            log.debug(`checking if json ${filename} conforms to schema`);
            const file = filenames.find((e) => e.toLocaleLowerCase() === filename.toLocaleLowerCase());
            if (!file) {
                log.error(`File ${filename} missing from H5P package. Make sure to use the fileMustExistRule before using jsonMustConformToSchemaRule!`);
                throw new Error(`File ${filename} missing from H5P package. Make sure to use the fileMustExistRule before using jsonMustConformToSchemaRule!`);
            }
            let jsonData;
            try {
                jsonData = JSON.parse(await (0, promises_1.readFile)(path.join(pathPrefix, file), 'utf-8'));
            }
            catch (jsonParseError) {
                log.error(`${errorIdJsonParse || jsonParseError.message}`);
                throw error.addError(new H5pError_1.default(errorIdJsonParse || jsonParseError.errorId, errorIdJsonParse
                    ? errorReplacements
                    : jsonParseError.replacements, 400));
            }
            if (!schemaValidator(jsonData)) {
                log.error(`json ${filename} does not conform to schema`);
                errorReplacements.reason = schemaValidator.errors
                    .map((e) => `${e.instancePath} ${e.message}`)
                    .join(' ')
                    .trim();
                throw error.addError(new H5pError_1.default(errorIdAnyError, errorReplacements));
            }
            if (!returnContent) {
                return filenames;
            }
            return { filenames, jsonData };
        };
    }
    /**
     * Validates the libraries inside the package.
     * @param filenames The entries inside the h5p file
     * @param error The error object to use
     * @returns The unchanged zip entries
     */
    librariesMustBeValid = (skipInstalledLibraries) => async (filenames, pathPrefix, error) => {
        // TODO: continue here
        log.debug(`validating libraries inside package`);
        const topLevelDirectories = await PackageValidator.getTopLevelDirectories(pathPrefix);
        await Promise.all(topLevelDirectories
            .filter((directory) => directory !== 'content')
            .map((directory) => this.validateLibrary(filenames, directory, pathPrefix, error, skipInstalledLibraries)));
        return filenames;
    };
    /**
     * Factory for a rule that checks if library's directory conforms to naming
     * standards
     * @param libraryName The name of the library (directory)
     * @returns the rule
     */
    libraryDirectoryMustHaveValidName(libraryName) {
        log.debug(`validating library's directory to naming standards`);
        return async (filenames, pathPrefix, error) => {
            if (!this.libraryDirectoryNameRegex.test(libraryName)) {
                throw error.addError(new H5pError_1.default('invalid-library-name', {
                    name: libraryName
                }));
            }
            return filenames;
        };
    }
    /**
     * Checks if the language files in the library have the correct naming
     * schema and are valid JSON.
     * @param filenames zip entries in the package
     * @param jsonData jsonData of the library.json file.
     * @param error The error object to use
     * @returns the unchanged data passed to the rule
     */
    libraryLanguageFilesMustBeValid = async ({ filenames, jsonData }, pathPrefix, error) => {
        log.debug(`checking if language files in library ${jsonData.machineName}-${jsonData.majorVersion}.${jsonData.minorVersion} have the correct naming schema and are valid JSON`);
        const uberName = `${jsonData.machineName}-${jsonData.majorVersion}.${jsonData.minorVersion}`;
        const languagePath = upath_1.default.join(uberName, 'language/');
        for (const languageFile of filenames.filter((f) => f.startsWith(languagePath))) {
            const languageFileName = path.basename(languageFile);
            if (!this.languageFileRegex.test(languageFileName)) {
                log.error(`${jsonData.machineName}-${jsonData.majorVersion}.${jsonData.minorVersion}: invalid language file`);
                error.addError(new H5pError_1.default('invalid-language-file', {
                    file: languageFileName,
                    library: uberName
                }));
            }
            try {
                await this.tryParseJson(path.join(pathPrefix, languageFile));
            }
            catch (ignored) {
                log.error(`${jsonData.machineName}-${jsonData.majorVersion}.${jsonData.minorVersion}: language json could not be parsed`);
                error.addError(new H5pError_1.default('invalid-language-file-json', {
                    file: languageFileName,
                    library: uberName
                }));
            }
        }
        return { filenames, jsonData };
    };
    /**
     * Factory for a check that makes sure that the directory name of the
     * library matches the name in the library.json metadata. Does not throw a
     * ValidationError.
     * @param directoryName the name of the directory in the package this
     * library is in
     * @returns the rule
     */
    libraryMustHaveMatchingDirectoryName(directoryName) {
        /**
         * @param filenames zip entries in the package
         * @param jsonData jsonData of the library.json file
         * @param error The error object to use
         * @returns {Promise<{filenames: yauzl.Entry[], jsonData: any}>} the unchanged data passed to the rule
         */
        log.debug(`checking if directory names ${directoryName} of libraries match library.json metadata`);
        return async ({ filenames, jsonData }, pathPrefix, error) => {
            // Library's directory name must be:
            // - <machineName>
            //     - or -
            // - <machineName>-<majorVersion>.<minorVersion> where machineName,
            //   majorVersion and minorVersion is read from library.json
            if (directoryName !== jsonData.machineName &&
                directoryName !==
                    `${jsonData.machineName}-${jsonData.majorVersion}.${jsonData.minorVersion}`) {
                log.error(`library directory does not match name ${directoryName}`);
                error.addError(new H5pError_1.default('library-directory-name-mismatch', {
                    directoryName,
                    machineName: jsonData.machineName,
                    majorVersion: jsonData.majorVersion,
                    minorVersion: jsonData.minorVersion
                }));
            }
            return { filenames, jsonData };
        };
    }
    skipInstalledLibraries = (skipInstalledLibraries) => async ({ filenames, jsonData }, pathPrefix, error) => {
        log.debug(`Checking if library can be skipped`);
        if (skipInstalledLibraries &&
            (await this.libraryManager.libraryExists(jsonData)) &&
            !(await this.libraryManager.isPatchedLibrary(jsonData))) {
            log.debug(`Skipping already installed library ${LibraryName_1.default.toUberName(jsonData)}`);
            return undefined;
        }
        return { jsonData, filenames };
    };
    /**
     * Checks if all JavaScript and CSS file references in the preloaded section
     * of the library metadata are present in the package.
     * @param filenames zip entries in the package
     * @param jsonData data of the library.json file.
     * @param error The error object to use
     * @returns {Promise<{filenames: string[], jsonData: any}>} the unchanged
     * data passed to the rule
     */
    libraryPreloadedFilesMustExist = async ({ filenames, jsonData }, pathPrefix, error) => {
        log.debug(`checking if all js and css file references in the preloaded section of the library metadata are present in package`);
        const uberName = `${jsonData.machineName}-${jsonData.majorVersion}.${jsonData.minorVersion}`;
        // check if all JavaScript files that must be preloaded are part of the
        // package
        if (jsonData.preloadedJs) {
            await Promise.all(jsonData.preloadedJs.map((file) => this.fileMustExist(upath_1.default.join(uberName, file.path), 'library-file-missing', false, { filename: file.path, library: uberName })(filenames, pathPrefix, error)));
        }
        // check if all CSS files that must be preloaded are part of the package
        if (jsonData.preloadedCss) {
            await Promise.all(jsonData.preloadedCss.map((file) => this.fileMustExist(upath_1.default.join(uberName, file.path), 'library-file-missing', false, { filename: file.path, library: uberName })(filenames, pathPrefix, error)));
        }
        return { filenames, jsonData };
    };
    /**
     * Checks if a library is compatible to the core version running. Does not
     * throw a ValidationError.
     * @param filenames zip entries in the package
     * @param jsonData jsonData of the library.json file.
     * @param error The error object to use
     * @returns the unchanged data passed to the rule
     */
    mustBeCompatibleToCoreVersion = async ({ filenames, jsonData }, pathPrefix, error) => {
        log.debug(`checking if library is compatible with the core version running`);
        this.checkCoreVersion(jsonData, `${jsonData.machineName}-${jsonData.majorVersion}.${jsonData.minorVersion}`, error);
        return { filenames, jsonData };
    };
    /**
     * A rule that always returns true.
     */
    async returnTrue() {
        return true;
    }
    /**
     * Tries to open the file in the ZIP archive in memory and parse it as JSON.
     * Will throw errors if the file cannot be read or is no valid JSON.
     * @param filename The entry to read
     * @returns The read JSON as an object
     */
    async tryParseJson(filename) {
        log.verbose(`parsing json ${filename}`);
        try {
            JSON.parse(await (0, promises_1.readFile)(filename, 'utf-8'));
        }
        catch (ignored) {
            log.error(`unable to parse JSON file ${filename}`);
            throw new H5pError_1.default('unable-to-parse-package', {
                fileName: filename
            });
        }
    }
    /**
     * Checks whether the library conforms to the standard and returns its data.
     * @param filenames All (relevant) zip entries of the package.
     * @param ubername The name of the library to check
     * @param error the error object
     * @returns the object from library.json with additional data from
     * semantics.json, the language files and the icon.
     */
    async validateLibrary(filenames, ubername, pathPrefix, error, skipInstalledLibraries) {
        try {
            log.debug(`validating library ${ubername}`);
            return await new ValidatorBuilder_1.ValidatorBuilder()
                .addRule(this.libraryDirectoryMustHaveValidName(ubername))
                .addRule(this.jsonMustBeParsable('semantics.json', 'invalid-semantics-json-file', true, false, { name: ubername }))
                .addRule(this.jsonMustConformToSchema(`${ubername}/library.json`, this.libraryMetadataValidator, 'invalid-schema-library-json-file', 'invalid-library-json-file', true, { name: ubername }))
                .addRule(this.skipInstalledLibraries(skipInstalledLibraries))
                .addRule(this.mustBeCompatibleToCoreVersion)
                .addRule(this.libraryMustHaveMatchingDirectoryName(ubername))
                .addRule(this.libraryPreloadedFilesMustExist)
                .addRule(this.libraryLanguageFilesMustBeValid)
                .validate(filenames, pathPrefix, error);
        }
        catch (e) {
            if (e instanceof AggregateH5pError_1.default) {
                // Don't rethrow a ValidationError (and thus abort validation)
                // as other libraries can still be validated, too. This is fine
                // as the error values are appended to the ValidationError and
                // the error will be thrown at some point anyway.
                return false;
            }
            throw e;
        }
    }
}
exports.default = PackageValidator;
//# sourceMappingURL=PackageValidator.js.map