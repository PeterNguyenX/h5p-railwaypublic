"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.throwErrorsNowRule = exports.ValidatorBuilder = void 0;
var AggregateH5pError_1 = __importDefault(require("./AggregateH5pError"));
/**
 * A ValidatorBuilder can be used to chain validation rules by calling addRule(...) multiple times
 * and by starting the validation by calling validate(...). The ValidatorBuilder then calls
 * each rule in the order they were added.
 *
 * Each validation rule is a function that requires two parameters:
 *   - a content object
 *   - an error object
 *
 * The content object contains the content that should be validated. Typically this content object
 * is also returned by the validation rule as it is passed on as the first paramter to the next rule.
 * In some cases rules can return a different (or mutated) content object if transformations are
 * necessary.
 *
 * The error object is of type ValidationError and is used to report back errors to the caller of
 * validate. (Every call to validate should be wrapped in a try-catch block). To cover cases
 * in which the validation process doesn't have to be interrupted if there is a validation error
 * the rule can call error.addError(...) to append another error message to the error object.
 * The error object has to be thrown later, e.g. by adding the throwErrorsNowRule to the builder.
 * If validation needs to be stopped right away, the rule function should throw the error object
 * passed to it (it should not create a new error object because there might be other messages
 * in the error object already).
 */
var ValidatorBuilder = /** @class */ (function () {
    function ValidatorBuilder() {
        this.rules = [];
    }
    /**
     * Adds a rule to the validator. Chain this method together to create complex validators.
     * @param {(content: any, error: AggregateH5pError) => any} rule rule to add
     * @returns
     */
    ValidatorBuilder.prototype.addRule = function (rule) {
        this.rules.push(rule);
        return this;
    };
    /**
     * Adds a rule to the validator if the condition is met.
     * Chain this method together to create complex validators.
     * @param {(content: any, error: AggregateH5pError) => any} rule rule to add
     * @param condition the condition (rule is added if it is true)
     * @returns
     */
    ValidatorBuilder.prototype.addRuleWhen = function (rule, condition) {
        if (condition) {
            return this.addRule(rule);
        }
        return this;
    };
    /**
     * Executes the validation.
     * @param data The data to validate. This parameters is passed to the first rule as the first parameter.
     * @param error an optional error object. A new one is created if none is passed in here.
     * @returns Returns the object that is returned by the last rule if everything is valid or throws a ValidationError if not
     */
    ValidatorBuilder.prototype.validate = function (data, error) {
        if (error === void 0) { error = new AggregateH5pError_1["default"]('package-validation-failed', {}, 400, undefined, 'VALIDATION_FAILED'); }
        return __awaiter(this, void 0, void 0, function () {
            var returnValue, _i, _a, rule;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        returnValue = data;
                        _i = 0, _a = this.rules;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        rule = _a[_i];
                        return [4 /*yield*/, rule(returnValue, error)];
                    case 2:
                        // promises need to be called iteratively here as validation has to occur step by step
                        returnValue = _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, returnValue];
                }
            });
        });
    };
    return ValidatorBuilder;
}());
exports.ValidatorBuilder = ValidatorBuilder;
/**
 * This rule throws the ValidationError object passed to it if there are any messages in it.
 * @param data The data (ignored by this rule)
 * @param error The error to throw if there are any
 * @returns the unchanged data object
 */
function throwErrorsNowRule(data, error) {
    if (error.hasErrors()) {
        throw error;
    }
    return data;
}
exports.throwErrorsNowRule = throwErrorsNowRule;
//# sourceMappingURL=ValidatorBuilder.js.map