/**
 * Scans a semantic structure and localizes the label, placeholder
 * and description fields. You can also localize all fields by
 * passing the respective option.
 */
export default class SemanticsLocalizer {
    private t;
    constructor(t: (key: string, language: string) => string);
    private localizableFields;
    /**
     * Localizes all localizable fields in the semantic structure.
     * @param semantics the semantics object
     * @param language the language to localize to
     * @param localizeAllFields true if not only label, placeholder and description should be localized but all fields
     * @returns a copy of the semantic structure with localized fields
     */
    localize(semantics: any, language: string, localizeAllFields?: boolean): any;
    private walkSemanticsRecursive;
}
