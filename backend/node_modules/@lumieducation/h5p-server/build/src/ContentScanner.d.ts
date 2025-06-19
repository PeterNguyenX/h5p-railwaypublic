import LibraryManager from './LibraryManager';
import { ILibraryName, ISemanticsEntry } from './types';
/**
 * @param semantics The semantic information about the current content params
 * @param params The current params
 * @param jsonPath The current path of the object in the tree as a JSON path
 * (example: .media.type.path)
 * @param parentParams The parent element in the params tree. Can be used to
 * delete this entry.
 * @returns true if the children of this entry should not be scanned (= abort
 * scan for this subtree)
 */
export type ScanCallback = (semantics: ISemanticsEntry, params: any, jsonPath: string, parentParams: any) => boolean;
/**
 * Scans the content parameters (= content.json) of a piece of content and calls
 * a callback for each element in the semantic tree. This includes all nested
 * pieces of content.
 *
 * You must pass ins a callback that is called for every element in the params
 * tree. If this callback returns true, the scan will be aborted _for the
 * element and its children_, but not for the rest of the params.
 */
export declare class ContentScanner {
    private libraryManager;
    constructor(libraryManager: LibraryManager);
    /**
     * Scans the specified parameters and executes the callback for every
     * element in the tree. This includes nested content!
     * @param params the params to scan
     * @param mainLibraryName the library name
     * @param callback a function that is executed for every element in the
     * semantic structure. Return true in it to abort the scan for the element
     * itself and all of its children (the rest of the scan will continue).
     */
    scanContent(params: any, mainLibraryName: ILibraryName, callback: ScanCallback): Promise<void>;
    /**
     * Walks through an element in the semantic tree of a library.
     * @param elementSemantics the semantic information for the current element
     * @param elementParams the parameters for the current element (as in
     * content.json)
     * @param parentJsonPath the JSON path of the parent (example: .media.type)
     * @param parentParams the parent params in the params tree
     * @param callback a function that is executed for this element and for
     * every child
     * @param doNotAddNameToJsonPath if true, the name of the current element
     * will not appended to the JSON path This is the case when a group contains
     * only one element. Then the child's name is omitted in the parameters.
     */
    private walkEntryRecursive;
    /**
     * Walks through all semantic entries in a library semantics.
     * @param semantics the semantic structure of a library
     * @param params the parameter object for the content
     * @param parentJsonPath the path of the parent
     * @param callback the callback to execute for every element in the tree
     */
    private walkSemanticsRecursive;
}
