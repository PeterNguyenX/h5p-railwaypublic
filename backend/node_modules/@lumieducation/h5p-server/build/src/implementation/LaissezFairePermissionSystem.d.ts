import { IPermissionSystem, IUser, ContentPermission, GeneralPermission, TemporaryFilePermission, UserDataPermission } from '../types';
/**
 * A permission system that allows everything to every user.
 */
export declare class LaissezFairePermissionSystem implements IPermissionSystem {
    checkForUserData(_actingUser: IUser, _permission: UserDataPermission, _contentId: string, _affectedUserId?: string): Promise<boolean>;
    checkForGeneralAction(_actingUser: IUser, _permission: GeneralPermission): Promise<boolean>;
    checkForContent(_user: IUser, _permission: ContentPermission, _contentId?: string): Promise<boolean>;
    checkForTemporaryFile(_user: IUser, _permission: TemporaryFilePermission, _filename?: string): Promise<boolean>;
}
