import { ContentId, IH5PConfig, ILibraryName, IUrlGenerator } from './types';
/**
 * This class generates URLs for files based on the URLs set in the configuration.
 */
export default class UrlGenerator implements IUrlGenerator {
    private config;
    constructor(config: IH5PConfig);
    coreFile: (file: string) => string;
    downloadPackage: (contentId: ContentId) => string;
    editorLibraryFile: (file: string) => string;
    editorLibraryFiles: () => string;
    libraryFile: (library: ILibraryName, file: string) => string;
    parameters: () => string;
    play: () => string;
    temporaryFiles: () => string;
    protected getBaseUrl: () => string;
}
