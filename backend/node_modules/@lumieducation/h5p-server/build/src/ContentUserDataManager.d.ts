import { ContentId, ISerializedContentUserData, IUser, IContentUserDataStorage, IContentUserData, IPermissionSystem } from './types';
/**
 * The ContentUserDataManager takes care of saving user data and states. It only
 * contains storage-agnostic functionality and depends on a
 * ContentUserDataStorage object to do the actual persistence.
 */
export default class ContentUserDataManager {
    private contentUserDataStorage;
    private permissionSystem;
    /**
     * @param contentUserDataStorage The storage object
     * @param permissionSystem grants or rejects permissions
     */
    constructor(contentUserDataStorage: IContentUserDataStorage, permissionSystem: IPermissionSystem);
    /**
     * Deletes a contentUserData object for given contentId and user id. Throws
     * errors if something goes wrong.
     * @param forUserId the user for which the contentUserData object should be
     * deleted
     * @param actingUser the user who is currently active
     */
    deleteAllContentUserDataByUser(forUserId: string, actingUser: IUser): Promise<void>;
    /**
     * Deletes all user data of a content object, if its "invalidate" flag is
     * set. This method is normally called, if a content object was changed and
     * the user data has become invalid because of that.
     * @param contentId
     */
    deleteInvalidatedContentUserDataByContentId(contentId: ContentId): Promise<void>;
    /**
     * Deletes all states of a content object. Normally called when the content
     * object is deleted.
     * @param contentId
     * @param actingUser
     */
    deleteAllContentUserDataByContentId(contentId: ContentId, actingUser: IUser): Promise<void>;
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
    getContentUserData(contentId: ContentId, dataType: string, subContentId: string, actingUser: IUser, contextId?: string, asUserId?: string): Promise<IContentUserData>;
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
    generateContentUserDataIntegration(contentId: ContentId, actingUser: IUser, contextId?: string, asUserId?: string): Promise<ISerializedContentUserData[] | undefined>;
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
    setFinished(contentId: ContentId, score: number, maxScore: number, openedTimestamp: number, finishedTimestamp: number, completionTime: number, actingUser: IUser): Promise<void>;
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
    createOrUpdateContentUserData(contentId: ContentId, dataType: string, subContentId: string, userState: string, invalidate: boolean, preload: boolean, actingUser: IUser, contextId?: string, asUserId?: string): Promise<void>;
    /**
     * Deletes all finished data for a content object
     * @param contentId the id of the content object
     * @param actingUser the currently active user
     */
    deleteFinishedDataByContentId(contentId: string, actingUser: IUser): Promise<void>;
}
