"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var MongoS3ContentStorage_1 = __importDefault(require("./MongoS3ContentStorage"));
var initS3_1 = __importDefault(require("./initS3"));
var initMongo_1 = __importDefault(require("./initMongo"));
var S3TemporaryFileStorage_1 = __importDefault(require("./S3TemporaryFileStorage"));
exports["default"] = {
    MongoS3ContentStorage: MongoS3ContentStorage_1["default"],
    initS3: initS3_1["default"],
    initMongo: initMongo_1["default"],
    S3TemporaryFileStorage: S3TemporaryFileStorage_1["default"]
};
//# sourceMappingURL=index.js.map