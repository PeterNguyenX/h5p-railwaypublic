import MongoS3ContentStorage from './MongoS3ContentStorage';
import S3TemporaryFileStorage from './S3TemporaryFileStorage';
declare const _default: {
    MongoS3ContentStorage: typeof MongoS3ContentStorage;
    initS3: (options?: import("aws-sdk/clients/s3").ClientConfiguration) => import("aws-sdk/clients/s3");
    initMongo: (url?: string, db?: string, user?: string, password?: string) => Promise<import("mongodb").Db>;
    S3TemporaryFileStorage: typeof S3TemporaryFileStorage;
};
export default _default;
