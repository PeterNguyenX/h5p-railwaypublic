import { ITranslationFunction } from '../types';
/**
 * Performs localizations with a custom fallback strategy: It tries all the
 * namespaces specified in the tryLocalize(...) call or in the constructor (in
 * the order of the list). If no localization was found, it will fallback to the
 * source string passed to tryLocalize.
 */
export default class TranslatorWithFallback {
    private translationCallback;
    private namespaces;
    /**
     *
     */
    constructor(translationCallback: ITranslationFunction, namespaces?: string[]);
    /**
     * Tries localizing the key. If it fails (indicated by the fact that the key
     * is part of the localized string), it will return the original source
     * string. Tries through all the namespaces specified before falling back.
     * @param key the key to look up the translation in the i18n data
     * @param sourceString the original English string received from the Hub
     * @param language the desired language
     * @param namespaces (optional) the namespaces to try. Will default to the
     * namespaces passed into the constructor if unspecified.
     * @returns the localized string or the original English source string
     */
    tryLocalize(key: string, sourceString: string, language: string, namespaces?: string[]): string;
}
