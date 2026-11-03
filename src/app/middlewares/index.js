import { isAuthorized, isAdminAuthorized } from "./authorization.middleware.js";
import { validationMiddleware } from "./validation.middleware.js";
import { upload, multerErrorHandler } from "./multer.middleware.js";

export const middleware = {
    isAuthorized,
    isAdminAuthorized,
    validationMiddleware,
    upload,
    multerErrorHandler
};

export {
    isAuthorized,
    isAdminAuthorized,
    validationMiddleware,
    upload,
    multerErrorHandler
};

