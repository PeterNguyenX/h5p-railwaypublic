import { Readable } from 'stream';
import LibraryName from './LibraryName';
import { IFileStats, IFullLibraryName, IInstalledLibrary, ILanguageFileEntry, ILibraryFileUrlResolver, ILibraryInstallResult, ILibraryMetadata, ILibraryName, ILibraryStorage, ILockProvider, ISemanticsEntry, ITranslationFunction } from './types';
/**
 * This class manages library installations, enumerating installed libraries etc.
 * It is storage agnostic and can be re-used in all implementations/plugins.
 */
export default class LibraryManager {
    libraryStorage: ILibraryStorage;
    private fileUrlResolver;
    private alterLibrarySemantics?;
    private alterLibraryLanguageFile?;
    private config?;
    /**
     *
     * @param libraryStorage the library repository that persists library
     * somewhere.
     * @param fileUrlResolver gets URLs at which a file in a library can be
     * downloaded. Must be passed through from the implementation.
     * @param alterLibrarySemantics a hook that allows implementations to change
     * the semantics of certain libraries; should be used together with
     * alterLibraryLanguageFile if you plan to use any other language than
     * English! See the documentation of IH5PEditorOptions for more details.
     * @param alterLibraryLanguageFile a hook that allows implementations to
     * change the language files of certain libraries; should be used together
     * with alterLibrarySemantics if you plan to use any other language than
     * English! See the documentation of IH5PEditorOptions for more details.
     * @param translationFunction (optional) The translation function to use if
     * you want to localize library metadata (titles). If undefined, no
     * localization will be performed.
     * @param lock (optional) an implementation of a locking mechanism that
     * prevents race conditions. If this is left undefined a simple
     * single-process lock mechanism will be used. If the library is used within
     * a multi-process or cluster setup, it is necessary to pass in a
     * distributed locking implementation.
     */
    constructor(libraryStorage: ILibraryStorage, fileUrlResolver?: ILibraryFileUrlResolver, // default is there to avoid having to pass empty function in tests
    alterLibrarySemantics?: (library: ILibraryName, semantics: ISemanticsEntry[]) => ISemanticsEntry[], alterLibraryLanguageFile?: (library: ILibraryName, languageFile: ILanguageFileEntry[], language: string) => ILanguageFileEntry[], translationFunction?: ITranslationFunction, lockProvider?: ILockProvider, config?: {
        installLibraryLockMaxOccupationTime: number;
        installLibraryLockTimeout: number;
    });
    private translator;
    private lock;
    /**
     * Returns a readable stream of a library file's contents.
     * Throws an exception if the file does not exist.
     * @param library library
     * @param filename the relative path inside the library
     * @returns a readable stream of the file's contents
     */
    getFileStats(library: ILibraryName, file: string): Promise<IFileStats>;
    /**
     * Returns a readable stream of a library file's contents.
     * Throws an exception if the file does not exist.
     * @param library library
     * @param filename the relative path inside the library
     * @returns a readable stream of the file's contents
     */
    getFileStream(library: ILibraryName, file: string): Promise<Readable>;
    /**
     * Gets the language file for the specified language.
     * @param library
     * @param language the language code
     * @returns a string with the contents language file; null if the library
     * isn't localized to the language
     */
    getLanguage(library: ILibraryName, language: string): Promise<string>;
    /**
     * Returns the information about the library that is contained in
     * library.json.
     * @param library The library to get (machineName, majorVersion and
     * minorVersion is enough)
     * @param language (optional) the language to use for the title, will always
     * fall back to English if it is not possible to localize
     * @returns the decoded JSON data or undefined if library is not installed
     */
    getLibrary(library: ILibraryName, language?: string): Promise<IInstalledLibrary>;
    /**
     * Returns a (relative) URL for a library file that can be used to hard-code
     * URLs of specific files if necessary. Avoid using this method when
     * possible! This method does NOT check if the file exists!
     * @param library the library for which the URL should be retrieved
     * @param file the filename inside the library (path)
     * @returns the URL of the file
     */
    getLibraryFileUrl(library: ILibraryName, file: string): string;
    /**
     * Checks which libraries in the list are not installed.
     * @param libraries the list of libraries to check
     * @returns the list of not installed libraries
     */
    getNotInstalledLibraries(libraries: ILibraryName[]): Promise<ILibraryName[]>;
    /**
     * Returns the content of semantics.json for the specified library.
     * @param library
     * @returns the content of semantics.json
     */
    getSemantics(library: ILibraryName): Promise<ISemanticsEntry[]>;
    /**
     * Returns a URL of the upgrades script in the library
     * @param library the library whose upgrade script should be accessed
     * @returns the URL of upgrades.js. Null if there is no upgrades file.
     * (The null value can be passed back to the client.)
     */
    getUpgradesScriptPath(library: ILibraryName): Promise<string>;
    /**
     * Installs or updates a library from a temporary directory. It does not
     * delete the library files in the temporary directory. The method does NOT
     * validate the library! It must be validated before calling this method!
     * Throws an error if something went wrong and deletes the files already
     * installed.
     * @param directory The path to the temporary directory that contains the
     * library files (the root directory that includes library.json)
     * @returns a structure telling if a library was newly installed, updated or
     * nothing happened (e.g. because there already is a newer patch version
     * installed).
     */
    installFromDirectory(directory: string, restricted?: boolean): Promise<ILibraryInstallResult>;
    /**
     * Is the library a patched version of an existing library?
     * @param library The library the check
     * @returns the full library name of the already installed version if there
     * is a patched version of an existing library, undefined otherwise
     */
    isPatchedLibrary(library: IFullLibraryName): Promise<IFullLibraryName>;
    /**
     * Checks if a library was installed.
     * @param library the library to check
     * @returns true if the library has been installed
     */
    libraryExists(library: LibraryName): Promise<boolean>;
    /**
     * Check if the library contains a file
     * @param library The library to check
     * @param filename
     * @return {Promise<boolean>} true if file exists in library, false
     * otherwise
     */
    libraryFileExists(library: ILibraryName, filename: string): Promise<boolean>;
    /**
     * Checks if the given library has a higher version than the highest
     * installed version.
     * @param library Library to compare against the highest locally installed
     * version.
     * @returns true if the passed library contains a version that is higher
     * than the highest installed version, false otherwise
     */
    libraryHasUpgrade(library: IFullLibraryName): Promise<boolean>;
    listAddons(): Promise<ILibraryMetadata[]>;
    /**
     * Gets a list of files that exist in the library.
     * @param library the library for which the files should be listed
     * @return the files in the library including language files
     */
    listFiles(library: ILibraryName): Promise<string[]>;
    /**
     * Get a list of the currently installed libraries.
     * @param machineName (optional) only return results for the machine name
     * @returns An object which has properties with the existing library machine
     * names. The properties' values are arrays of Library objects, which
     * represent the different versions installed of this library.
     */
    listInstalledLibraries(machineName?: string): Promise<{
        [machineName: string]: IInstalledLibrary[];
    }>;
    /**
     * Gets a list of translations that exist for this library.
     * @param library
     * @returns the language codes for translations of this library
     */
    listLanguages(library: ILibraryName): Promise<string[]>;
    /**
     * Checks (as far as possible) if all necessary files are present for the
     * library to run properly.
     * @param library The library to check
     * @returns true if the library is ok. Throws errors if not.
     */
    private checkConsistency;
    /**
     * Checks if all files in the list are present in the library.
     * @param library The library to check
     * @param requiredFiles The files (relative paths in the library) that must
     * be present
     * @returns true if all dependencies are present. Throws an error if any are
     * missing.
     */
    private checkFiles;
    /**
     * Copies all library file s from a directory (excludes library.json) to the
     * storage. Throws errors if something went wrong.
     * @param fromDirectory The directory to copy from
     * @param libraryInfo the library object
     * @returns
     */
    private copyLibraryFiles;
    /**
     * Installs a library and rolls back changes if the library installation
     * failed. Throws errors if something went wrong.
     * @param fromDirectory the local directory to install from
     * @param libraryInfo the library object
     * @param libraryMetadata the library metadata
     * @param restricted true if the library can only be installed with a
     * special permission
     * @returns the library object (containing - among others - the id of the
     * newly installed library)
     */
    private installLibrary;
    /**
     * Updates the library to a new version. REMOVES THE LIBRARY IF THERE IS AN
     * ERROR!!!
     * @param filesDirectory the path of the directory containing the library
     * files to update to
     * @param library the library object
     * @param newLibraryMetadata the library metadata (library.json)
     */
    private updateLibrary;
    private getLanguageWithoutFallback;
}
