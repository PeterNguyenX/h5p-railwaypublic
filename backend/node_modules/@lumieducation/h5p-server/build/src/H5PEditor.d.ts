import { Writable, Readable } from 'stream';
import ContentUserDataManager from './ContentUserDataManager';
import ContentManager from './ContentManager';
import ContentTypeCache from './ContentTypeCache';
import ContentTypeInformationRepository from './ContentTypeInformationRepository';
import LibraryManager from './LibraryManager';
import PackageImporter from './PackageImporter';
import TemporaryFileManager from './TemporaryFileManager';
import { ContentId, ContentParameters, IContentMetadata, IContentStorage, IContentUserDataStorage, IEditorModel, IH5PConfig, IH5PEditorOptions, IHubInfo, IKeyValueStorage, ILibraryDetailedDataForClient, ILibraryInstallResult, ILibraryName, ILibraryOverviewForClient, ILibraryStorage, ISemanticsEntry, ITemporaryFileStorage, ITranslationFunction, IUrlGenerator, IUser } from './types';
import ContentHub from './ContentHub';
export default class H5PEditor {
    protected cache: IKeyValueStorage;
    config: IH5PConfig;
    libraryStorage: ILibraryStorage;
    contentStorage: IContentStorage;
    temporaryStorage: ITemporaryFileStorage;
    private urlGenerator;
    private options?;
    contentUserDataStorage?: IContentUserDataStorage;
    /**
     * @param cache the cache is used to store key - value pairs that must be
     * accessed often; values stored in it must be accessible by ALL instances
     * of the editor (across machines)
     * @param config the configuration values for the editor; note that the
     * editor can also change these values and save them!
     * @param libraryStorage the storage object for libraries
     * @param contentStorage the storage object for content
     * @param temporaryStorage the storage object for temporary files
     * @param translationCallback a function that is called to retrieve
     * translations of keys in a certain language; the keys use the i18next
     * format (e.g. namespace:key). See the ITranslationFunction documentation
     * for more details.
     * @param urlGenerator creates url strings for files, can be used to
     * customize the paths in an implementation application
     * @param options more options to customize the behavior of the editor; see
     * IH5PEditorOptions documentation for more details
     */
    constructor(cache: IKeyValueStorage, config: IH5PConfig, libraryStorage: ILibraryStorage, contentStorage: IContentStorage, temporaryStorage: ITemporaryFileStorage, translationCallback?: ITranslationFunction, urlGenerator?: IUrlGenerator, options?: IH5PEditorOptions, contentUserDataStorage?: IContentUserDataStorage);
    contentHub: ContentHub;
    contentManager: ContentManager;
    contentTypeCache: ContentTypeCache;
    contentTypeRepository: ContentTypeInformationRepository;
    contentUserDataManager: ContentUserDataManager;
    libraryManager: LibraryManager;
    packageImporter: PackageImporter;
    temporaryFileManager: TemporaryFileManager;
    private contentMetadataValidator;
    private contentStorer;
    private copyrightSemantics;
    private dependencyGetter;
    private globalCustomScripts;
    private globalCustomStyles;
    private metadataSemantics;
    private packageExporter;
    private renderer;
    private semanticsLocalizer;
    private fileSanitizers;
    private malwareScanners;
    /**
     * Generates cache buster strings that are used by the JavaScript client in
     * the browser when generating URLs of core JavaScript files (only rarely
     * used).
     *
     * If you want to customize cache busting, you can override this generator.
     * The default generator creates strings like '?version=1.24.0', which are
     * simply added to the URL.
     */
    cacheBusterGenerator: () => string;
    /**
     * Deletes a piece of content and all files dependent on it.
     * @param contentId the piece of content to delete
     * @param user the user who wants to delete it
     */
    deleteContent(contentId: ContentId, user: IUser): Promise<void>;
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
     * @param outputWritable The writable that the package is written to (e.g.
     * the response stream fo Express)
     */
    exportContent(contentId: ContentId, outputWritable: Writable, user: IUser): Promise<void>;
    /**
     * Returns all the data needed to editor or display content
     * @param contentId the content id
     * @param user (optional) the user who wants to access the content; if undefined, access will be granted
     * @returns all relevant information for the content (you can send it back to the GET request for content)
     */
    getContent(contentId: ContentId, user?: IUser): Promise<{
        h5p: IContentMetadata;
        library: string;
        params: {
            metadata: IContentMetadata;
            params: ContentParameters;
        };
    }>;
    /**
     * Returns a readable for a file that was uploaded for a content object.
     * The requested content file can be a temporary file uploaded for unsaved content or a
     * file in permanent content storage.
     * @param contentId the content id (undefined if retrieved for unsaved content)
     * @param filename the file to get (without 'content/' prefix!)
     * @param user the user who wants to retrieve the file
     * @param rangeStart (optional) the position in bytes at which the stream should start
     * @param rangeEnd (optional) the position in bytes at which the stream should end
     * @returns a readable of the content file
     */
    getContentFileStream(contentId: ContentId, filename: string, user: IUser, rangeStart?: number, rangeEnd?: number): Promise<Readable>;
    /**
     * Returns the content type cache for a specific user. This includes all
     * available content types for the user (some might be restricted) and what
     * the user can do with them (update, install from Hub).
     */
    getContentTypeCache(user: IUser, language?: string): Promise<IHubInfo>;
    /**
     * Returns detailed information about an installed library.
     */
    getLibraryData(machineName: string, majorVersion: string, minorVersion: string, language?: string): Promise<ILibraryDetailedDataForClient>;
    /**
     * Returns a readable stream of a library file's contents.
     * Throws an exception if the file does not exist.
     * @param library library
     * @param filename the relative path inside the library
     * @returns a readable stream of the file's contents
     */
    getLibraryFileStream(library: ILibraryName, filename: string): Promise<Readable>;
    /**
     * Gets a rough overview of information about the requested libraries.
     * @param ubernames
     * @param language (optional) if set, the system will try to localize the
     * title of the library (the namespace 'library-metadata' must be loaded in
     * the i18n system)
     */
    getLibraryOverview(ubernames: string[], language?: string): Promise<ILibraryOverviewForClient[]>;
    /**
     * Installs a content type from the H5P Hub.
     * @param machineName The name of the content type to install (e.g. H5P.Test) Note that this is not a full ubername!
     * @returns a list of installed libraries if successful. Will throw errors if something goes wrong.
     */
    installLibraryFromHub(machineName: string, user: IUser): Promise<ILibraryInstallResult[]>;
    /**
     * Retrieves the installed languages for libraries
     * @param libraryUbernames A list of libraries for which the language files
     * should be retrieved. In this list the names of the libraries don't use
     * hyphens to separate machine name and version.
     * @param language the language code to get the files for
     * @returns The strings of the language files
     */
    listLibraryLanguageFiles(libraryUbernames: string[], language: string): Promise<{
        [key: string]: string;
    }>;
    /**
     * Renders the content. This means that a frame in which the editor is
     * displayed is generated and returned. You can override the default frame
     * by calling setRenderer(...).
     * @param contentId
     * @param language the language to use; defaults to English
     * @param user the user who uses the editor
     * @returns the rendered frame that you can include in your website.
     * Normally a string, but can be anything you want it to be if you override
     * the renderer.
     */
    render(contentId: ContentId, language: string, user: IUser): Promise<string | any>;
    /**
     * Stores an uploaded file in temporary storage.
     * @param contentId the id of the piece of content the file is attached to;
     * Set to null/undefined if the content hasn't been saved before.
     * @param field the semantic structure of the field the file is attached to.
     * @param file information about the uploaded file; either data or
     * tempFilePath must be used!
     * @returns information about the uploaded file
     */
    saveContentFile(contentId: ContentId, field: ISemanticsEntry, file: {
        data?: Buffer;
        mimetype: string;
        name: string;
        size: number;
        tempFilePath?: string;
    }, user: IUser): Promise<{
        height?: number;
        mime: string;
        path: string;
        width?: number;
    }>;
    /**
     * Stores new content or updates existing content.
     * Copies over files from temporary storage if necessary.
     * @param contentId the contentId of existing content (undefined or previously unsaved content)
     * @param parameters the content parameters (=content.json)
     * @param metadata the content metadata (~h5p.json)
     * @param mainLibraryUbername the ubername with whitespace as separator (no hyphen!)
     * @param user the user who wants to save the piece of content
     * @returns the existing contentId or the newly assigned one
     */
    saveOrUpdateContent(contentId: ContentId, parameters: ContentParameters, metadata: IContentMetadata, mainLibraryUbername: string, user: IUser): Promise<ContentId>;
    /**
     * Stores new content or updates existing content.
     * Copies over files from temporary storage if necessary.
     * @param contentId the contentId of existing content (undefined or previously unsaved content)
     * @param parameters the content parameters (=content.json)
     * @param metadata the content metadata (~h5p.json)
     * @param mainLibraryUbername the ubername with whitespace as separator (no hyphen!)
     * @param user the user who wants to save the piece of content
     * @returns the existing contentId or the newly assigned one and the metatdata
     */
    saveOrUpdateContentReturnMetaData(contentId: ContentId, parameters: ContentParameters, metadata: IContentMetadata, mainLibraryUbername: string, user: IUser): Promise<{
        id: string;
        metadata: IContentMetadata;
    }>;
    /**
     * By setting custom copyright semantics, you can customize what licenses
     * are displayed when editing metadata of files.
     *
     * NOTE: It is unclear if copyrightSemantics is deprecated in the H5P
     * client. Use setMetadataSemantics instead, which certainly works.
     *
     * NOTE: The semantic structure is localized before delivered to the H5P
     * client. If you change it, you must either make sure there is a appropriate
     * language file loaded in your translation library (and set one in the
     * first place).
     * @param copyrightSemantics a semantic structure similar to the one used in
     * semantics.json of regular H5P libraries. See https://h5p.org/semantics
     * for more documentation. However, you can only add one entry (which can
     * be nested). See the file assets/defaultCopyrightSemantics.json for the
     * default version which you can build on.
     * @returns the H5PEditor object that you can use to chain method calls
     */
    setCopyrightSemantics(copyrightSemantics: ISemanticsEntry): H5PEditor;
    /**
     * By setting custom metadata semantics, you can customize what licenses are
     * displayed when editing metadata of content object and files.
     *
     * NOTE: It is only trivial to change the license offered as a a selection
     * to the editors. All other semantic entries CANNOT be changed, as the
     * form displayed in the editor is hard-coded in h5peditor-metadata.js in
     * the client. You'll have to replace this file with a custom implementation
     * if you want to change more metadata.
     *
     * NOTE: The semantic structure is localized before delivered to the H5P
     * client. If you change it, you must either make sure there is a appropriate
     * language file loaded in your translation library (and set one in the
     * first place).
     * @param metadataSemantics a semantic structure similar to the one used in
     * semantics.json of regular H5P libraries. See https://h5p.org/semantics
     * for more documentation. See the file assets/defaultMetadataSemantics.json
     * for the default version which you can build on
     * @returns the H5PEditor object that you can use to chain method calls
     */
    setMetadataSemantics(metadataSemantics: ISemanticsEntry[]): H5PEditor;
    /**
     * By setting a custom renderer you can change the way the editor produces
     * HTML output
     * @param renderer
     * @returns the H5PEditor object that you can use to chain method calls
     */
    setRenderer(renderer: (model: IEditorModel) => string | any): H5PEditor;
    /**
     * Adds the contents of a package to the system: Installs required libraries
     * (if the user has the permissions for this), adds files to temporary
     * storage and returns the actual content information for the editor to
     * process. Throws errors if something goes wrong.
     * @param dataOrPath the raw data of the h5p package as a buffer or the path
     * of the file in the local filesystem
     * @param user the user who is uploading the package; optional if
     * onlyInstallLibraries is set to true
     * @param options (optional) further options:
     * @param onlyInstallLibraries true if content should be disregarded
     * @returns the content information extracted from the package. The metadata
     * and parameters property will be undefined if onlyInstallLibraries was set
     * to true.
     */
    uploadPackage(dataOrPath: Buffer | string, user?: IUser, options?: {
        onlyInstallLibraries?: boolean;
    }): Promise<{
        installedLibraries: ILibraryInstallResult[];
        metadata?: IContentMetadata;
        parameters?: any;
    }>;
    /**
     * Downloads a .h5p file from the content hub. Then "uploads" the file as if
     * the user uploaded the file manually.
     * @param contentHubId the content hub id; this is a id of the external
     * service and not related to local contentId
     * @param user the user who is using the content hub; relevant for temporary
     * file access rights
     * @returns the content information extracted from the package.
     */
    getContentHubContent(contentHubId: string, user: IUser): Promise<{
        installedLibraries: ILibraryInstallResult[];
        metadata?: IContentMetadata;
        parameters?: any;
    }>;
    /**
     * If a file is a video, an audio file or an image, the filename is suffixed
     * with the corresponding directory (videos, audios, images).
     * @param filename the filename including the file extension
     * @returns the path including the directory; the same if the filename is not a video, audio file or image
     */
    private addDirectoryByMimetype;
    /**
     * Recursively crawls through the parameters and finds usages of libraries.
     * @param parameters the parameters to scan
     * @param collect a collecting object used by the recursion. Do not use
     * @returns a list of libraries that are referenced in the parameters
     */
    private findLibrariesInParameters;
    private generateContentMetadata;
    private generateEditorIntegration;
    private generateIntegration;
    /**
     * Returns a list of addons that should be used for the library
     * @param machineName the library identified by its machine name
     * @returns a list of addons
     */
    private getAddonsForLibrary;
    /**
     * Returns a functions that replaces the h5p editor language file with the
     * one for the language desired. Checks if the H5P editor core supports
     * a language and falls back to English if it doesn't. Also removes region
     * suffixes like the US in 'en-US' if it can't find a language file with
     * the suffix.
     * @param language
     */
    private getLanguageReplacer;
    private listAssets;
    private listCoreScripts;
    private listCoreStyles;
    private resolveDependencies;
    private validateLanguageCode;
}
