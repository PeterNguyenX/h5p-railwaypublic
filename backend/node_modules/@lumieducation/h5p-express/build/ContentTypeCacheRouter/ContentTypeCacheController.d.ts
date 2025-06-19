import * as express from 'express';
import { ContentTypeCache } from '@lumieducation/h5p-server';
export default class ContentTypeCacheController {
    protected contentTypeCache: ContentTypeCache;
    constructor(contentTypeCache: ContentTypeCache);
    /**
     * Returns the last update of the content type cache.
     */
    getLibrariesContentTypeCacheUpdate: (req: express.Request, res: express.Response<{
        lastUpdate: Date | null;
    }>) => Promise<void>;
    /**
     * Manually updates the content type cache by contacting the H5P Hub and
     * fetching the metadata about the available content types.
     *
     * Used HTTP status codes:
     * - 200 if successful
     * - 502 if the H5P Hub is unreachable
     * - 500 if there was an internal error
     */
    postLibrariesContentTypeCacheUpdate: (req: express.Request, res: express.Response<{
        lastUpdate: Date;
    }>) => Promise<void>;
}
