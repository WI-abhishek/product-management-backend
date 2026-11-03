import { DashboardController } from "#controllers";
import { configuration } from "#configs";
import { isAuthorized } from "#middlewares";

const dashboardRoute = function (app, express) {
    const router = express.Router();
    const routerPath = "/Dashboard/";

    router.get(
        routerPath + "Stats",
        [
            isAuthorized
        ],
        DashboardController.getDashboardStats
    );

    app.use(configuration.baseUrl, router);
};

export default dashboardRoute;

