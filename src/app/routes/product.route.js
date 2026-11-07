import { ProductController } from "#controllers";
import { configuration } from "#configs";
import {
    isAuthorized,
    isAdminAuthorized,
    upload,
    multerErrorHandler,
    validationMiddleware
} from "#middlewares";
import {
    addProductSanitize,
    updateProductSanitize,
    statusProductSanitize,
    selectProductByIdSanitize,
    listProductSanitize,
    checkoutProductSanitize,
    productValidationSchema
} from "#sanitize";

const productRoute = function (app, express) {
    const router = express.Router();
    const routerPath = "/Product/";

    router.post(
        routerPath + "Add",
        [
            isAuthorized,
            upload.single("image"),
            multerErrorHandler,
            addProductSanitize,
            validationMiddleware(productValidationSchema.createProductSchema, "body")
        ],
        ProductController.createProduct
    );

    router.put(
        routerPath + "Update",
        [
            isAuthorized,
            upload.single("image"),
            multerErrorHandler,
            updateProductSanitize,
            validationMiddleware(productValidationSchema.updateProductSchema, "body")
        ],
        ProductController.updateProduct
    );

    router.put(
        routerPath + "Status",
        [
            isAuthorized,
            statusProductSanitize,
            validationMiddleware(productValidationSchema.updateStatusSchema, "body")
        ],
        ProductController.updateProductStatus
    );

    router.get(
        routerPath + "SelectById/:productId",
        [
            isAuthorized,
            selectProductByIdSanitize,
            validationMiddleware(productValidationSchema.productIdParamSchema, "params")
        ],
        ProductController.getProductById
    );

    router.delete(
        routerPath + "Delete/:productId",
        [
            isAdminAuthorized,
            selectProductByIdSanitize,
            validationMiddleware(productValidationSchema.productIdParamSchema, "params")
        ],
        ProductController.deleteProduct
    );

    router.post(
        routerPath + "List",
        [
            isAuthorized,
            listProductSanitize,
            validationMiddleware(productValidationSchema.productListSchema, "body")
        ],
        ProductController.productList
    );

    router.post(
        routerPath + "Checkout",
        [
            isAuthorized,
            checkoutProductSanitize,
            validationMiddleware(productValidationSchema.checkoutSchema, "body")
        ],
        ProductController.checkout
    );

    app.use(configuration.baseUrl, router);
};

export default productRoute;
