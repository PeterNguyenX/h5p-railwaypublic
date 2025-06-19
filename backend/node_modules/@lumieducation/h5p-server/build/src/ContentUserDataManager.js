"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const Logger_1 = __importDefault(require("./helpers/Logger"));
const H5pError_1 = __importDefault(require("./helpers/H5pError"));
const log = new Logger_1.default('ContentUserDataManager');
/**
 * The ContentUserDataManager takes care of saving user data and states. It only
 * contains storage-agnostic functionality and depends on a
 * ContentUserDataStorage object to do the actual persistence.
 */
class ContentUserDataManager {
    contentUserDataStorage;
    permissionSystem;
    /**
     * @param contentUserDataStorage The storage object
     * @param permissionSystem grants or rejects permissions
     */
    constructor(contentUserDataStorage, permissionSystem) {
        this.contentUserDataStorage = contentUserDataStorage;
        this.permissionSystem = permissionSystem;
        log.info('initialize');
    }
    /**
     * Deletes a contentUserData object for given contentId and user id. Throws
     * errors if something goes wrong.
     * @param forUserId the user for which the contentUserData object should be
     * deleted
     * @param actingUser the user who is currently active
     */
    async deleteAllContentUserDataByUser(forUserId, actingUser) {
        if (!this.contentUserDataStorage) {
            return;
        }
        log.debug(`Deleting contentUserData for userId ${forUserId}`);
        if (!(await this.permissionSystem.checkForUserData(actingUser, types_1.UserDataPermission.DeleteState, undefined, forUserId))) {
            log.error(`User tried delete content states without proper permissions.`);
            throw new H5pError_1.default('h5p-server:user-state-missing-delete-permission', {}, 403);
        }
        return this.contentUserDataStorage.deleteAllContentUserDataByUser(actingUser);
    }
    /**
     * Deletes all user data of a content object, if its "invalidate" flag is
     * set. This method is normally called, if a content object was changed and
     * the user data has become invalid because of that.
     * @param contentId
     */
    async deleteInvalidatedContentUserDataByContentId(contentId) {
        if (!this.contentUserDataStorage) {
            return;
        }
        if (contentId) {
            log.debug(`Deleting invalidated contentUserData for contentId ${contentId}`);
            return this.contentUserDataStorage.deleteInvalidatedContentUserData(contentId);
        }
    }
    /**
     * Deletes all states of a content object. Normally called when the content
     * object is deleted.
     * @param contentId
     * @param actingUser
     */
    async deleteAllContentUserDataByContentId(contentId, actingUser) {
        if (!this.contentUserDataStorage) {
            return;
        }
        log.debug(`Deleting all content user data for contentId ${contentId}`);
        if (!(await this.permissionSystem.checkForUserData(actingUser, types_1.UserDataPermission.DeleteState, contentId, undefined))) {
            log.error(`User tried delete content user state without proper permissions.`);
            throw new H5pError_1.default('h5p-server:user-state-missing-delete-permission', {}, 403);
        }
        return this.contentUserDataStorage.deleteAllContentUserDataByContentId(contentId);
    }
    /**
     * Loads the contentUserData for given contentId, dataType and subContentId
     * @param contentId The id of the content to load user data from
     * @param dataType Used by the h5p.js client
     * @param subContentId The id provided by the h5p.js client call
     * @param actingUser The user who is accessing the h5p. Normally this is
     * also the user for who the state should be fetched.
     * @param contextId an arbitrary value that can be used to save multiple
     * states for one content - user tuple
     * @param asUserId If set, the state of this user will be fetched instead of
     * the one of `actingUser'
     * @returns the saved state as string or undefined when not found
     */
    async getContentUserData(contentId, dataType, subContentId, actingUser, contextId, asUserId) {
        if (!this.contentUserDataStorage) {
            return;
        }
        log.debug(`Loading content user data for user with id ${asUserId ?? actingUser.id}, contentId ${contentId}, subContentId ${subContentId}, dataType ${dataType}, contextId ${contextId}`);
        if (!(await this.permissionSystem.checkForUserData(actingUser, types_1.UserDataPermission.ViewState, contentId, asUserId ?? actingUser.id))) {
            log.error(`User tried view user content state without proper permissions.`);
            throw new H5pError_1.default('h5p-server:user-state-missing-view-permission', {}, 403);
        }
        return this.contentUserDataStorage.getContentUserData(contentId, dataType, subContentId, asUserId ?? actingUser.id, contextId);
    }
    /**
     * Loads the content user data for given contentId and user. The returned
     * data is an array of IContentUserData where the position in the array
     * corresponds with the subContentId or undefined if there is no content
     * user data.
     *
     * @param contentId The id of the content to load user data from
     * @param actingUser The user who is accessing the h5p. Normally this is
     * also the user for who the integration should be generated.
     * @param contextId an arbitrary value that can be used to save multiple
     * states for one content - user tuple
     * @param asUserId the user for which the integration should be generated,
     * if they are different from the user who is accessing the state
     * @returns an array of IContentUserData or undefined if no content user
     * data is found.
     */
    async generateContentUserDataIntegration(contentId, actingUser, contextId, asUserId) {
        if (!this.contentUserDataStorage) {
            return;
        }
        log.debug(`Generating contentUserDataIntegration for user with id ${actingUser.id}, contentId ${contentId} and contextId ${contextId}.`);
        if (!(await this.permissionSystem.checkForUserData(actingUser, types_1.UserDataPermission.ViewState, contentId, asUserId ?? actingUser.id))) {
            log.error(`User tried viewing user content state without proper permissions.`);
            throw new H5pError_1.default('h5p-server:user-state-missing-view-permission', {}, 403);
        }
        let states = await this.contentUserDataStorage.getContentUserDataByContentIdAndUser(contentId, asUserId ?? actingUser.id, contextId);
        if (!states) {
            return undefined;
        }
        states = states.filter((s) => s.preload === true);
        const sortedStates = states.sort((a, b) => Number(a.subContentId) - Number(b.subContentId));
        const mappedStates = sortedStates
            // filter removes states where preload is set to false
            .filter((state) => state.preload)
            // maps the state to an object where the key is the dataType and the userState is the value
            .map((state) => ({
            [state.dataType]: state.userState
        }));
        return mappedStates;
    }
    /**
     * Saves data when a user completes content.
     * @param contentId The content id to delete.
     * @param score the score the user reached as an integer
     * @param maxScore the maximum score of the content
     * @param openedTimestamp the time the user opened the content as UNIX time
     * @param finishedTimestamp the time the user finished the content as UNIX
     * time
     * @param completionTime the time the user needed to complete the content
     * (as integer)
     * @param actingUser The user who triggers this method via /setFinished
     */
    async setFinished(contentId, score, maxScore, openedTimestamp, finishedTimestamp, completionTime, actingUser) {
        if (!this.contentUserDataStorage) {
            return;
        }
        log.debug(`saving finished data for ${actingUser.id} and contentId ${contentId}`);
        if (!(await this.permissionSystem.checkForUserData(actingUser, types_1.UserDataPermission.EditFinished, contentId, actingUser.id))) {
            log.error(`User tried add finished data without proper permissions.`);
            throw new H5pError_1.default('h5p-server:finished-data-missing-edit-permission', {}, 403);
        }
        await this.contentUserDataStorage.createOrUpdateFinishedData({
            contentId,
            score,
            maxScore,
            openedTimestamp,
            finishedTimestamp,
            completionTime,
            userId: actingUser.id
        });
    }
    /**
     * Saves the contentUserData for given contentId, dataType and subContentId
     * @param contentId The id of the content to load user data from
     * @param dataType Used by the h5p.js client
     * @param subContentId The id provided by the h5p.js client call
     * @param userState The userState as string
     * @param actingUser The user who is currently active; normally this is also
     * the owner of the user data
     * @param contextId an arbitrary value that can be used to save multiple
     * states for one content - user tuple
     * @param asUserId if the acting user is different from the owner of the
     * user data, you can specify the owner here
     * @returns the saved state as string
     */
    async createOrUpdateContentUserData(contentId, dataType, subContentId, userState, invalidate, preload, actingUser, contextId, asUserId) {
        if (typeof invalidate !== 'boolean' || typeof preload !== 'boolean') {
            log.error(`invalid arguments passed for contentId ${contentId}`);
            throw new Error("createOrUpdateContentUserData received invalid arguments: invalidate or preload weren't boolean");
        }
        if (!this.contentUserDataStorage) {
            return;
        }
        log.debug(`Saving contentUserData for user with id ${asUserId ?? actingUser.id} and contentId ${contentId}`);
        if (!(await this.permissionSystem.checkForUserData(actingUser, types_1.UserDataPermission.EditState, contentId, asUserId ?? actingUser.id))) {
            log.error(`User tried add / edit user content state without proper permissions.`);
            throw new H5pError_1.default('h5p-server:user-state-missing-edit-permission', {}, 403);
        }
        if (this.contentUserDataStorage) {
            return this.contentUserDataStorage.createOrUpdateContentUserData({
                contentId,
                contextId,
                dataType,
                invalidate,
                preload,
                subContentId,
                userState,
                userId: asUserId ?? actingUser.id
            });
        }
    }
    /**
     * Deletes all finished data for a content object
     * @param contentId the id of the content object
     * @param actingUser the currently active user
     */
    async deleteFinishedDataByContentId(contentId, actingUser) {
        if (!this.contentUserDataStorage) {
            return;
        }
        if (!(await this.permissionSystem.checkForUserData(actingUser, types_1.UserDataPermission.DeleteFinished, contentId, undefined))) {
            log.error(`User tried add delete finished data for content without proper permissions.`);
            throw new H5pError_1.default('h5p-server:finished-data-missing-delete-permission', {}, 403);
        }
        await this.contentUserDataStorage.deleteFinishedDataByContentId(contentId);
    }
}
exports.default = ContentUserDataManager;
//# sourceMappingURL=ContentUserDataManager.js.map