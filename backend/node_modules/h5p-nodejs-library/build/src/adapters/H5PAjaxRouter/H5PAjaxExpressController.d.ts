/// <reference types="node" />
import * as express from 'express';
import { H5PEditor } from '../..';
import { IRequestWithUser, IRequestWithTranslator } from '../expressTypes';
interface IActionRequest extends IRequestWithUser, IRequestWithTranslator {
    files: {
        file: {
            data: Buffer;
            mimetype: string;
            name: string;
            size: number;
        };
        h5p: {
            data: any;
        };
    };
}
/**
 * The methods in this class can be used to answer AJAX requests that are received by Express routers.
 * You can use all methods independently at your convenience.
 * Note that even though the names getAjax and postAjax imply that only these methods deal with AJAX
 * requests, ALL methods except getDownload deal with AJAX requests. This confusion is caused by the
 * HTTP interface the H5P client uses and we can't change it.
 */
export default class H5PAjaxExpressController {
    protected h5pEditor: H5PEditor;
    constructor(h5pEditor: H5PEditor);
    /**
     * Get various things through the Ajax endpoint.
     */
    getAjax: (req: IRequestWithUser, res: express.Response) => Promise<void>;
    getContentFile: (req: IRequestWithUser, res: express.Response) => Promise<void>;
    getContentParameters: (req: IRequestWithUser, res: express.Response) => Promise<void>;
    getDownload: (req: IRequestWithUser, res: express.Response) => Promise<void>;
    getLibraryFile: (req: express.Request, res: express.Response) => Promise<void>;
    getTemporaryContentFile: (req: IRequestWithUser, res: express.Response) => Promise<void>;
    /**
     * Post various things through the Ajax endpoint
     * Don't be confused by the fact that many of the requests dealt with here are not
     * really POST requests, but look more like GET requests. This is simply how the H5P
     * client works and we can't change it.
     */
    postAjax: (req: IActionRequest, res: express.Response) => Promise<void>;
    /**
     * Unified handling of range requests for getContentFile and
     * getTemporaryContentFile.
     * @param contentId (optional) the contentId, can be undefined if a
     * temporary file is requested
     */
    private abstractGetContentFile;
    private pipeStreamToPartialResponse;
    private pipeStreamToResponse;
}
export {};
