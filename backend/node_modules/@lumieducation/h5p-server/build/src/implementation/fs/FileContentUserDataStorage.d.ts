import { ContentId, IContentUserData, IContentUserDataStorage, IFinishedUserData, IUser } from '../../types';
/**
 * Saves user data in JSON files on the disk. It creates one file per content
 * object. There's a separate file for user states and one for the finished data.
 * Each file contains a list of all states or finished data objects.
 */
export default class FileContentUserDataStorage implements IContentUserDataStorage {
    protected directory: string;
    constructor(directory: string);
    getContentUserData(contentId: ContentId, dataType: string, subContentId: string, userId: string, contextId?: string): Promise<IContentUserData>;
    getContentUserDataByUser(user: IUser): Promise<IContentUserData[]>;
    createOrUpdateContentUserData(userData: IContentUserData): Promise<void>;
    deleteInvalidatedContentUserData(contentId: string): Promise<void>;
    deleteAllContentUserDataByUser(user: IUser): Promise<void>;
    deleteAllContentUserDataByContentId(contentId: ContentId): Promise<void>;
    getContentUserDataByContentIdAndUser(contentId: ContentId, userId: string, contextId?: string): Promise<IContentUserData[]>;
    createOrUpdateFinishedData(finishedData: IFinishedUserData): Promise<void>;
    getFinishedDataByContentId(contentId: string): Promise<IFinishedUserData[]>;
    getFinishedDataByUser(user: IUser): Promise<IFinishedUserData[]>;
    deleteFinishedDataByContentId(contentId: string): Promise<void>;
    deleteFinishedDataByUser(user: IUser): Promise<void>;
    private getSafeUserDataFilePath;
    private getSafeFinishedFilePath;
}
