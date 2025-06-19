import { ILockProvider } from '../types';
export default class SimpleLockProvider implements ILockProvider {
    constructor();
    private lock;
    acquire<T>(key: string, callback: () => Promise<T>, options: {
        timeout: number;
        maxOccupationTime: number;
    }): Promise<T>;
}
