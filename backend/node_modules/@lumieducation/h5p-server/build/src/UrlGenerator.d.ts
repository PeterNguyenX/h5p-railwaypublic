import { ContentId, IFullLibraryName, IH5PConfig, IUrlGenerator, IUser } from './types';
/**
 * This class generates URLs for files based on the URLs set in the
 * configuration.
 *
 * It includes a basic cache buster that adds a parameter with the full version
 * to core and library files (e.g. ?version=1.2.3). You can also implement other
 * means of busting caches by implementing IUrlGenerator yourself. It would for
 * example be possible to adding a generic cache buster string instead of adding
 * the version. If you decide to do this, you must be aware of the fact that the
 * JavaScript client generates URLs dynamically in two cases (at the time of
 * writing), both in h5peditor.js:contentUpgrade. This function uses
 * H5PIntegration.pluginCacheBuster, which can be customized by overriding
 * H5PEditor.cacheBusterGenerator.
 *
 * UrlGenerator requires these values to be set in config:
 * - baseUrl
 * - contentFilesUrlPlayerOverride (includes placeholder! See documentation of
 *   config for details!)
 * - contentUserDataUrl
 * - coreUrl
 * - downloadUrl
 * - editorLibraryUrl
 * - h5pVersion
 * - librariesUrl
 * - paramsUrl
 * - playUrl
 * - setFinishedUrl
 * - temporaryFilesUrl
 *
 * The UrlGenerator can also be used to inject CSRF tokens into URLs for POST
 * requests that are sent by the H5P editor core (Joubel's code) over which you
 * don't have any control. You can then check the CSRF tokens in your middleware
 * to authenticate requests.
 */
export default class UrlGenerator implements IUrlGenerator {
    private config;
    private csrfProtection?;
    /**
     * @param config the config
     * @param csrfProtection (optional) If used, you must pass in a function
     * that returns a CSRF query parameter for the user for who a URL is
     * generated; the query parameter will be appended to URLs like this:
     * "baseUrl/ajax/?name=value&action=..." You must specify which routes you
     * want to be protected. If you don't pass in a csrfProtection object, no
     * CSRF tokens will be added to URLs.
     */
    constructor(config: IH5PConfig, csrfProtection?: {
        protectAjax: boolean;
        protectContentUserData: boolean;
        protectSetFinished: boolean;
        queryParamGenerator: (user: IUser) => {
            name: string;
            value: string;
        };
    });
    ajaxEndpoint: (user: IUser) => string;
    baseUrl: () => string;
    contentFilesUrl(contentId: ContentId): string | undefined;
    contentUserData: (user: IUser, contextId?: string, asUserId?: string, options?: {
        readonly?: boolean;
    }) => string;
    /**
     * Also adds a cache buster based on IH5PConfig.h5pVersion.
     * @param file
     */
    coreFile: (file: string) => string;
    coreFiles: () => string;
    downloadPackage: (contentId: ContentId) => string;
    /**
     * Also adds a cache buster based on IH5PConfig.h5pVersion.
     * @param file
     */
    editorLibraryFile: (file: string) => string;
    editorLibraryFiles: () => string;
    libraryFile: (library: IFullLibraryName, file: string) => string;
    parameters: () => string;
    play: () => string;
    setFinished: (user: IUser) => string;
    temporaryFiles: () => string;
    uniqueContentUrl(contentId: ContentId): string;
}
