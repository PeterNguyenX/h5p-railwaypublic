"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ContentTypeCacheController {
    contentTypeCache;
    constructor(contentTypeCache) {
        this.contentTypeCache = contentTypeCache;
    }
    /**
     * Returns the last update of the content type cache.
     */
    getLibrariesContentTypeCacheUpdate = async (req, res) => {
        const lastUpdate = await this.contentTypeCache.getLastUpdate();
        res.status(200).json({
            lastUpdate: lastUpdate === undefined ? null : lastUpdate
        });
    };
    /**
     * Manually updates the content type cache by contacting the H5P Hub and
     * fetching the metadata about the available content types.
     *
     * Used HTTP status codes:
     * - 200 if successful
     * - 502 if the H5P Hub is unreachable
     * - 500 if there was an internal error
     */
    postLibrariesContentTypeCacheUpdate = async (req, res) => {
        await this.contentTypeCache.forceUpdate();
        const lastUpdate = await this.contentTypeCache.getLastUpdate();
        res.status(200).json({ lastUpdate });
    };
}
exports.default = ContentTypeCacheController;
//# sourceMappingURL=ContentTypeCacheController.js.map