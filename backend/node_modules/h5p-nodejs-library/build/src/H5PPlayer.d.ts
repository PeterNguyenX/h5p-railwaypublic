import { ContentId, ContentParameters, IContentMetadata, IContentStorage, IH5PConfig, IIntegration, ILibraryStorage, IPlayerModel, IUrlGenerator, IUser } from './types';
export default class H5PPlayer {
    private libraryStorage;
    private contentStorage;
    private config;
    private integrationObjectDefaults?;
    private globalCustomScripts;
    private urlGenerator;
    /**
     *
     * @param libraryStorage the storage for libraries (can be read only)
     * @param contentStorage the storage for content (can be read only)
     * @param config the configuration object
     * @param integrationObjectDefaults (optional) the default values to use for the integration object
     * @param globalCustomScripts (optional) references to these scripts will be added when rendering content
     */
    constructor(libraryStorage: ILibraryStorage, contentStorage: IContentStorage, config: IH5PConfig, integrationObjectDefaults?: IIntegration, globalCustomScripts?: string[], urlGenerator?: IUrlGenerator);
    private clientTranslation;
    private libraryManager;
    private renderer;
    /**
     * Creates a frame for displaying H5P content. You can customize this frame by calling setRenderer(...).
     * It normally is enough to call this method with the content id. Only call it with parameters and metadata
     * if don't want to use the IContentStorage object passed into the constructor.
     * @param contentId the content id
     * @param parameters (optional) the parameters of a piece of content (=content.json)
     * @param metadata (optional) the metadata of a piece of content (=h5p.json)
     * @returns a HTML string that you can insert into your page
     */
    render(contentId: ContentId, parameters?: ContentParameters, metadata?: IContentMetadata, user?: IUser): Promise<string | any>;
    /**
     * Overrides the default renderer.
     * @param renderer
     */
    setRenderer(renderer: (model: IPlayerModel) => string | any): H5PPlayer;
    /**
     *
     * @param dependencies
     * @param libraries
     * @param assets
     * @param loaded
     * @returns aggregated asset lists
     */
    private aggregateAssetsRecursive;
    /**
     * Scans the parameters for occurances of the regex pattern in any string
     * property.
     * @param parameters the parameters (= content.json)
     * @param regex the regex to look for
     * @returns true if the regex occurs in a string inside the parametres
     */
    private checkIfRegexIsInParameters;
    private generateIntegration;
    /**
     * Finds out which adds should be added to the library due to the settings
     * in the global configuration or in the library metadata.
     * @param machineName the machine name of the library to which addons should
     * be added
     * @param installedAddons a list of installed addons on the system
     * @returns the list of addons to install
     */
    private getAddonsByLibrary;
    /**
     * Determines which addons should be used for the parameters. It will scan
     * the parameters for patterns specified by installed addons.
     * @param parameters the parameters to scan
     * @param installedAddons a list of addons installed on the system
     * @returns a list of addons that should be used
     */
    private getAddonsByParameters;
    private getDownloadPath;
    private getMetadata;
    /**
     *
     * @param dependencies
     * @param loaded can be left out in initial call
     */
    private getMetadataRecursive;
    private listCoreScripts;
    private listCoreStyles;
}
