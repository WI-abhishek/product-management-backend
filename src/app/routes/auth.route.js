import { AuthController } from "#controllers";
import { configuration } from "#configs";
import { isAuthorized, validationMiddleware } from "#middlewares";
import {
    registerSanitize,
    loginSanitize,
    authValidationSchema
} from "#sanitize";

const authRoute = function (app, express) {
    const router = express.Router();
    const routerPath = "/Auth/";

    router.post(
        routerPath + "Register",
        [
            registerSanitize,
            validationMiddleware(authValidationSchema.registerSchema, "body")
        ],
        AuthController.register
    );

    router.post(
        routerPath + "Login",
        [
            loginSanitize,
            validationMiddleware(authValidationSchema.loginSchema, "body")
        ],
        AuthController.login
    );

    router.post(
        routerPath + "RefreshToken",
        AuthController.refreshToken
    );

    router.get(
        routerPath + "GetProfile",
        [
            isAuthorized
        ],
        AuthController.getProfile
    );

    router.post(
        routerPath + "Logout",
        [
            isAuthorized
        ],
        AuthController.logout
    );

    app.use(configuration.baseUrl, router);
};

export default authRoute;
