"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const h5p_server_1 = require("@lumieducation/h5p-server");
class ContentUserDataController {
    contentUserDataManager;
    config;
    constructor(contentUserDataManager, config) {
        this.contentUserDataManager = contentUserDataManager;
        this.config = config;
    }
    /**
     * Returns the userState for given contentId, dataType and subContentId
     */
    getContentUserData = async (req, res) => {
        if (!this.config.contentUserStateSaveInterval) {
            res.status(403).end();
            return;
        }
        const { contentId, dataType, subContentId } = req.params;
        const contextId = typeof req.query.contextId === 'string'
            ? req.query.contextId
            : undefined;
        const asUserId = typeof req.query.asUserId === 'string'
            ? req.query.asUserId
            : undefined;
        const result = await this.contentUserDataManager.getContentUserData(contentId, dataType, subContentId, req.user, contextId, asUserId);
        if (!result || !result.userState) {
            res.status(200).json(new h5p_server_1.AjaxSuccessResponse(false));
        }
        else {
            res.status(200).json(new h5p_server_1.AjaxSuccessResponse(result.userState));
        }
    };
    /**
     * Saves a userState for given contentId, dataType and subContentId
     */
    postContentUserData = async (req, res) => {
        if (!this.config.contentUserStateSaveInterval) {
            res.status(403).end();
            return;
        }
        const { contentId, dataType, subContentId } = req.params;
        const contextId = typeof req.query.contextId === 'string'
            ? req.query.contextId
            : undefined;
        const asUserId = typeof req.query.asUserId === 'string'
            ? req.query.asUserId
            : undefined;
        const ignorePost = typeof req.query.ignorePost === 'string'
            ? req.query.ignorePost
            : undefined;
        // The ignorePost query parameter allows us to cancel requests that
        // would fail later, when the ContentUserDataManager would deny write
        // requests to user states. It is necessary, as the H5P JavaScript core
        // client doesn't support displaying a state while saving is disabled.
        // We implement this feature by setting a very long autosave frequency,
        // rejecting write requests in the permission system and using the
        // ignorePost query parameter.
        if (ignorePost == 'yes') {
            res.status(200).json(new h5p_server_1.AjaxSuccessResponse(undefined, 'The user state was not saved, as the query parameter ignorePost was set.'));
            return;
        }
        const { user, body } = req;
        await this.contentUserDataManager.createOrUpdateContentUserData(contentId, dataType, subContentId, body.data, body.invalidate === 1 || body.invalidate === '1', body.preload === 1 || body.preload === '1', user, contextId, asUserId);
        res.status(200).json(new h5p_server_1.AjaxSuccessResponse(undefined)).end();
    };
}
exports.default = ContentUserDataController;
//# sourceMappingURL=ContentUserDataController.js.map