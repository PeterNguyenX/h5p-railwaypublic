import LibraryManager from './LibraryManager';
import { ILibraryName } from './types';
/**
 * Validates the params received by the editor or when uploading content against
 * the schema specified in the semantic structure of the H5P libraries used for
 * the content.
 *
 * IMPORTANT: This class is very incomplete and mostly only a stub!
 */
export default class SemanticsEnforcer {
    constructor(libraryManager: LibraryManager);
    private contentScanner;
    /**
     * Makes sure the params follow the semantic structure of the library.
     * IMPORTANT: This method changes the contents of mainParams!
     * @param mainParams the params; THIS PARAMETER IS MANIPULATED BY THIS
     * METHOD!
     * @param mainLibraryName
     */
    enforceSemanticStructure(mainParams: any, mainLibraryName: ILibraryName): Promise<void>;
    /**
     * See h5p.classes.php:3994 for how the PHP implementation does this.
     * @param semantics
     * @param params
     * @param parentParams
     * @param jsonPath
     */
    private enforceLibrarySemantics;
    /**
     * Checks if a text entry conforms to the semantics and enforces the
     * semantics if necessary. Implements all checks of the PHP version, but
     * does not include error reporting at the moment.
     */
    private enforceTextSemantics;
}
