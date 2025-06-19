import * as express from 'express';
import { ContentUserDataManager, IAjaxResponse, IPostContentUserData, IH5PConfig } from '@lumieducation/h5p-server';
import { IRequestWithUser } from '../expressTypes';
interface IPostContentUserDataRequest extends IPostContentUserData, IRequestWithUser {
}
export default class ContentUserDataController {
    protected contentUserDataManager: ContentUserDataManager;
    protected config: IH5PConfig;
    constructor(contentUserDataManager: ContentUserDataManager, config: IH5PConfig);
    /**
     * Returns the userState for given contentId, dataType and subContentId
     */
    getContentUserData: (req: IRequestWithUser, res: express.Response<IAjaxResponse<string>>) => Promise<void>;
    /**
     * Saves a userState for given contentId, dataType and subContentId
     */
    postContentUserData: (req: IPostContentUserDataRequest, res: express.Response) => Promise<void>;
}
export {};
