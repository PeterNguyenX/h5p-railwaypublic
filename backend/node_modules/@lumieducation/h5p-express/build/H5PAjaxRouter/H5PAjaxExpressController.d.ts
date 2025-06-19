import * as express from 'express';
import { H5PEditor } from '@lumieducation/h5p-server';
import { IRequestWithUser, IActionRequest } from '../expressTypes';
/**
 * This class is part of the Express adapter for the H5PAjaxEndpoint class and
 * maps Express specific properties and methods to the generic H5PAjaxEndpoint
 * methods.
 */
export default class H5PAjaxExpressController {
    protected h5pEditor: H5PEditor;
    constructor(h5pEditor: H5PEditor);
    private ajaxEndpoint;
    /**
     * GET /ajax
     * Get various things through the Ajax endpoint.
     */
    getAjax: (req: IRequestWithUser, res: express.Response) => Promise<void>;
    /**
     * GET /content/<contentId>/<filename>
     */
    getContentFile: (req: IRequestWithUser, res: express.Response) => Promise<void>;
    /**
     * GET /params/<contentId>
     */
    getContentParameters: (req: IRequestWithUser, res: express.Response) => Promise<void>;
    /**
     * GET /download/<contentId>
     */
    getDownload: (req: IRequestWithUser, res: express.Response) => Promise<void>;
    /**
     * GET /libraries/<uberName>/<file>
     */
    getLibraryFile: (req: express.Request, res: express.Response) => Promise<void>;
    /**
     * GET /temp-files/<file>
     */
    getTemporaryContentFile: (req: IRequestWithUser, res: express.Response) => Promise<void>;
    /**
     * POST /ajax
     * Post various things through the Ajax endpoint
     * Don't be confused by the fact that many of the requests dealt with here are not
     * really POST requests, but look more like GET requests. This is simply how the H5P
     * client works and we can't change it.
     */
    postAjax: (req: IActionRequest & {
        t: any;
    }, res: express.Response) => Promise<void>;
    /**
     * Retrieves a range that was specified in the HTTP request headers. Returns
     * undefined if no range was specified.
     */
    private getRange;
    /**
     * Pipes the contents of the file to the request object and sets the
     * 206 status code and all necessary headers.
     * @param mimetype the mimetype of the file
     * @param readStream a readable stream of the file (at the start position)
     * @param response the Express response object (a writable stream)
     * @param totalLength the total file size of the file
     * @param start the start of the range
     * @param end the end of the range
     */
    private pipeStreamToPartialResponse;
    /**
     * Pipes the contents of the file to the request object and sets the
     * 200 status code and all necessary headers to indicate support for ranges.
     * @param mimetype the mimetype of the file
     * @param readStream a readable stream of the file (at the start position)
     * @param response the Express response object (a writable stream)
     * @param contentLength the total file size of the file
     */
    private pipeStreamToResponse;
}
