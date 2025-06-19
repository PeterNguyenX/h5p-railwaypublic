import { IH5PConfig } from './types';
/**
 * Performs checks if uploaded H5P packages or those from the H5P Hub are valid.
 * Call await validatePackage(...) to perform these checks.
 *
 * The validator currently does not check if all necessary library versions will be present after performing
 * an upgrade (done in ll. 968 - 1032 of h5p.classes.php). This is not done because it would require enumerating
 * all installed libraries and this is not possible in the extractor without introducing a dependency to the
 * core.
 *
 * REMARK: Note that the validator operates on zip files and thus has to use slashes (/) in paths regardless of the
 * operating system!
 */
export default class PackageValidator {
    private config;
    /**
     * @param configurationValues Object containing all required configuration parameters
     */
    constructor(config: IH5PConfig);
    private contentExtensionWhitelist;
    private h5pMetadataValidator;
    private libraryDirectoryNameRegex;
    private libraryExtensionWhitelist;
    private libraryMetadataValidator;
    /**
     * Returns a list of top-level directories in the zip file
     * @param zipEntries
     * @returns list of top-level directories
     */
    private static getTopLevelDirectories;
    /**
     * Checks if the passed filename has an extension that is in the passed list.
     * @param filename The filename to check
     * @param allowedExtensions A list of extensions to check against
     */
    private static isAllowedFileExtension;
    /**
     * Checks if a zip file path is a directory
     * @param p the path to check
     * @returns true if directory, false if not
     */
    private static isDirectory;
    /**
     * Opens the zip archive.
     * @param file Path to file to open
     * @returns Zip archive object or undefined if zip file cannot be opened.
     */
    private static openZipArchive;
    /**
     * Similar to path.join(...) but uses slashes (/) as separators regardless of OS.
     * We have to use slashes when dealing with zip files as the specification for zips require them. If the program
     * runs on Windows path.join(...) uses backslashes \ which don't work for zip files.
     * @param parts The parts of the path to join
     * @returns the full path
     */
    private static pathJoin;
    /**
     * Validates the H5P package located at the path passed to the method.
     * @param h5pFile Path to H5P file to validate
     * @param checkContent If true, the method will check if the content in the package conforms to the standard
     * @param checkLibraries If true, the method will check if the libraries in the package conform to the standard
     * @returns true if the package is valid. Will throw Errors with the error in Error.message if there is a validation error.
     */
    validatePackage(h5pFile: string, checkContent?: boolean, checkLibraries?: boolean): Promise<any>;
    /**
     * Checks if the core API version required in the metadata can be satisfied by the running instance.
     * @param {{coreApi: { majorVersion: number, minorVersion: number }}} metadata The object containing information about the required core version
     * @param libraryName The name of the library that is being checked.
     * @param error The error object.
     * @returns true if the core API required in the metadata can be satisfied by the running instance. Also true if the metadata doesn't require any core API version.
     */
    private checkCoreVersion;
    /**
     * Factory for the file extension rule: Checks if the file extensions of the files in the array are
     * in the whitelists.
     * Does NOT throw errors but appends them to the error object.
     * @param {(arg: string) => boolean} filter The filter function must return true if the filename passed to it should be checked
     * @param whitelist The file extensions that are allowed for files that match the filter
     * @returns the rule
     */
    private fileExtensionMustBeAllowed;
    /**
     * Factory for a rule that makes sure that a certain file must exist.
     * Does NOT throw errors but appends them to the error object.
     * @param filename The filename that must exist among the zip entries (path, not case-sensitive)
     * @param errorId The error message that is used if the file does not exist
     * @param throwOnError (optional) If true, the rule will throw an error if the file does not exist.
     * @param errorReplacements (optional) The replacement variables to pass to the error.
     * @returns the rule
     */
    private fileMustExist;
    /**
     * Checks file sizes (single files and all files combined)
     * Does NOT throw errors but appends them to the error object.
     * @param zipEntries The entries inside the h5p file
     * @param error The error object to use
     * @returns The unchanged zip entries
     */
    private fileSizeMustBeWithinLimits;
    /**
     * Factory for a rule that tries reading the files that are matched by the filter.
     * Does not throw errors.
     * @param {(path: string) => boolean} filter Returns true for files that should be readable.
     * @returns the rule
     */
    private filesMustBeReadable;
    /**
     * Factory for a rule that filters out files from the validation.
     * @param {(yauzlPromise.Entry) => boolean} filter The filter. Filenames matched by this filter will be filtered out.
     * @returns the rule
     */
    private filterOutEntries;
    /**
     * Initializes the JSON schema validators _h5pMetaDataValidator and _libraryMetadataValidator.
     * Can be called multiple times, as it only creates new validators when it hasn't been called before.
     */
    private initializeJsonValidators;
    /**
     * Factory for a rule that makes sure a JSON file is parsable.
     * Throws an error if the JSON file can't be parsed.
     * @param filename The path to the file.
     * @param errorId An optional error message to use instead of the default
     * @param skipIfNonExistent if true, the rule does not produce an error if the file doesn't exist.
     * @param throwIfError if true, the rule will throw an error if the JSON file is not parsable, otherwise it will append the error message to the error object
     * @param errorReplacements replacements to use when generating the an error
     * @return The rule
     */
    private jsonMustBeParsable;
    /**
     * Factory for a rule that makes sure a JSON file is parsable and conforms to the specified JSON schema.
     * Throws an error if the JSON file can't be parsed or if it does not conform to the schema.
     * @param filename The path to the file.
     * @param schemaValidator The validator for the required schema.
     * @param errorIdAnyError The id of the message that is emitted, when there is an error. (Allowed placeholders: %name, %reason)
     * @param errorIdJsonParse (optional) The message to output if the JSON file is not parsable (will default to a generíc error message)
     * @param returnContent (optional) If true, the rule will return an object with { zipEntries, jsonData } where jsonData contains the parsed JSON of the file
     * @param errorReplacements (optional) The replacements to pass to error objects created in the method.
     * @return The rule (return value: An array of ZipEntries if returnContent == false, otherwise the JSON content is added to the return object)
     */
    private jsonMustConformToSchema;
    /**
     * Validates the libraries inside the package.
     * @param zipEntries The entries inside the h5p file
     * @param { AggregateH5pError} error The error object to use
     * @returns The unchanged zip entries
     */
    private librariesMustBeValid;
    /**
     * Factory for a rule that checks if library's directory conforms to naming standards
     * @param libraryName The name of the library (directory)
     * @returns the rule
     */
    private libraryDirectoryMustHaveValidName;
    /**
     * Checks if the language files in the library have the correct naming schema and are valid JSON.
     * @param zipEntries zip entries in the package
     * @param jsonData jsonData of the library.json file.
     * @param error The error object to use
     * @returns {Promise<{zipEntries: yauzlPromise.Entry[], jsonData: any}>} the unchanged data passed to the rule
     */
    private libraryLanguageFilesMustBeValid;
    /**
     * Factory for a check that makes sure that the directory name of the library matches the name in
     * the library.json metadata.
     * Does not throw a ValidationError.
     * @param directoryName the name of the directory in the package this library is in
     * @returns the rule
     */
    private libraryMustHaveMatchingDirectoryName;
    /**
     * Checks if all JavaScript and CSS file references in the preloaded section of the library metadata are present in the package.
     * @param zipEntries zip entries in the package
     * @param jsonData data of the library.json file.
     * @param error The error object to use
     * @returns {Promise<{zipEntries: yauzlPromise.Entry[], jsonData: any}>} the unchanged data passed to the rule
     */
    private libraryPreloadedFilesMustExist;
    /**
     * Checks if a library is compatible to the core version running.
     * Does not throw a ValidationError.
     * @param zipEntries zip entries in the package
     * @param jsonData jsonData of the library.json file.
     * @param error The error object to use
     * @returns {Promise<{zipEntries: yauzlPromise.Entry[], jsonData: any}>} the unchanged data passed to the rule
     */
    private mustBeCompatibleToCoreVersion;
    /**
     * Checks if the package file ends with .h5p.
     * Throws an error.
     * @param h5pFile Path to the h5p file
     * @param error The error object to use
     * @returns Unchanged path to the h5p file
     */
    private mustHaveH5pExtension;
    /**
     * A rule that always returns true.
     */
    private returnTrue;
    /**
     * Tries to open the file in the ZIP archive in memory and parse it as JSON. Will throw errors
     * if the file cannot be read or is no valid JSON.
     * @param entry The entry to read
     * @returns The read JSON as an object
     */
    private tryParseJson;
    /**
     * Checks whether the library conforms to the standard and returns its data.
     * @param zipEntries All (relevant) zip entries of the package.
     * @param libraryName The name of the library to check
     * @param error the error object
     * @returns {Promise< {semantics: any, hasIcon: boolean, language: any}|boolean >} the object from library.json with additional data from semantics.json, the language files and the icon.
     */
    private validateLibrary;
    /**
     * Makes sure the archive can be unzipped.
     * Throws an error.
     * @param h5pFile Path to the h5p file
     * @param error The error object to use
     * @returns The entries inside the zip archive
     */
    private zipArchiveMustBeValid;
}
