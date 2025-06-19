"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const h5p_server_1 = require("@lumieducation/h5p-server");
class FinishedDataController {
    contentUserDataManager;
    config;
    constructor(contentUserDataManager, config) {
        this.contentUserDataManager = contentUserDataManager;
        this.config = config;
    }
    /**
     * Saves the setFinished state for a given user
     */
    postSetFinished = async (req, res) => {
        if (!this.config.setFinishedEnabled) {
            res.status(403).end();
            return;
        }
        const { user, body } = req;
        const { contentId, score, maxScore, opened, finished, time } = body;
        await this.contentUserDataManager.setFinished(contentId, score, maxScore, opened, finished, time, user);
        res.status(200).json(new h5p_server_1.AjaxSuccessResponse(undefined));
    };
}
exports.default = FinishedDataController;
//# sourceMappingURL=FinishedDataController.js.map