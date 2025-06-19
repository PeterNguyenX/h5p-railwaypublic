import * as express from 'express';
import { ContentUserDataManager, IH5PConfig, IPostContentUserData } from '@lumieducation/h5p-server';
import { IRequestWithUser } from '../expressTypes';
interface IPostContentUserDataRequest extends IPostContentUserData, IRequestWithUser {
}
export default class FinishedDataController {
    protected contentUserDataManager: ContentUserDataManager;
    protected config: IH5PConfig;
    constructor(contentUserDataManager: ContentUserDataManager, config: IH5PConfig);
    /**
     * Saves the setFinished state for a given user
     */
    postSetFinished: (req: IPostContentUserDataRequest, res: express.Response) => Promise<void>;
}
export {};
