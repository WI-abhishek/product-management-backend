import 'dotenv/config';
import express from 'express';
import timeout from 'connect-timeout';
import limiter from 'express-rate-limit';
import expressSanitizer from 'express-sanitizer';
import helmet from 'helmet';
import { corsConfig } from '#configs/cors.config.js';
import authRoute from '../app/routes/auth.route.js';
import categoryRoute from '../app/routes/category.route.js';
import productRoute from '../app/routes/product.route.js';
import dashboardRoute from '../app/routes/dashboard.route.js';

export const expressConfig = function () {
    const app = express();

    app.use(corsConfig);

    app.use(helmet({
        crossOriginResourcePolicy: false,
    }));

    app.set("trust proxy", 1);
    app.use(express.urlencoded({ limit: "50mb", extended: true }));
    app.use(express.json({ limit: "50mb" }));
    app.use(expressSanitizer());
    app.use(limiter({
        windowMs: 1000,
        max: 100,
        message: {
            status: 0,
            message: "Too many requests, please try again later."
        }
    }));
    app.use(timeout(120000));

    function haltOnTimedOut(req, res, next) {
        if (!req.timedout) next();
    }
    app.use(haltOnTimedOut);

    // Routes
    authRoute(app, express);
    categoryRoute(app, express);
    productRoute(app, express);
    dashboardRoute(app, express);

    return app;
};
