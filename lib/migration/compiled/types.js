"use strict";
/**
 * TypeScript interfaces for image migration system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorType = void 0;
var ErrorType;
(function (ErrorType) {
    ErrorType["FILE_NOT_FOUND"] = "FILE_NOT_FOUND";
    ErrorType["NETWORK_ERROR"] = "NETWORK_ERROR";
    ErrorType["DUPLICATE_MEDIA"] = "DUPLICATE_MEDIA";
    ErrorType["INVALID_FORMAT"] = "INVALID_FORMAT";
    ErrorType["UPLOAD_FAILED"] = "UPLOAD_FAILED";
    ErrorType["UPDATE_FAILED"] = "UPDATE_FAILED";
    ErrorType["PERMISSION_ERROR"] = "PERMISSION_ERROR";
    ErrorType["SIZE_LIMIT_EXCEEDED"] = "SIZE_LIMIT_EXCEEDED";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
