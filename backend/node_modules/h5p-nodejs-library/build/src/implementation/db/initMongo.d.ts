declare const _default: (url?: string, db?: string, user?: string, password?: string) => Promise<import("mongodb").Db>;
/**
 * Creates a MongoDB client.
 * You must either pass the configuration values through the parameters or set
 * them as environment variables.
 * @param url (optional) the connection URL for MongoDB (e.g. mongodb://localhost:27105)
 * Can also be set through the environment variable MONGODB_URL.
 * @param db (optional) the DB
 * Can also be set through the environment variable MONGODB_DB.
 * @param user (optional) a MongoDB user that can read and write the database
 * Can also be set through the environment variable MONGODB_USER.
 * @param password (optional) the password for the MongoDB user
 * Can also be set through the environment variable MONGODB_PASSWORD.
 * @returns the MongoDB client
 */
export default _default;
