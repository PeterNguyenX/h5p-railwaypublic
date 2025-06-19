declare const _default: (filename: string, sanitize: (filename: string) => string, checkIfFileExists: (filename: string) => Promise<boolean>) => Promise<string>;
/**
 * Generates a unique filename. Removes short-ids that were added to filenames
 * @param contentId the content object for which the file is about to be saved
 * @param filename the filename on which to base the unique filename on
 * @returns a unique filename (within the content object)
 */
export default _default;
