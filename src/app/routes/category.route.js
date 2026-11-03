import { CategoryController } from "#controllers";
import { configuration } from "#configs";
import { isAuthorized, isAdminAuthorized, validationMiddleware } from "#middlewares";
import {
    addCategorySanitize,
    updateCategorySanitize,
    selectCategoryByIdSanitize,
    listCategorySanitize,
    categoryValidationSchema
} from "#sanitize";

const categoryRoute = function (app, express) {
    const router = express.Router();
    const routerPath = "/Category/";

    router.post(
        routerPath + "Add",
        [
            isAuthorized,
            addCategorySanitize,
            validationMiddleware(categoryValidationSchema.createCategorySchema, "body")
        ],
        CategoryController.createCategory
    );

    router.put(
        routerPath + "Update",
        [
            isAuthorized,
            updateCategorySanitize,
            validationMiddleware(categoryValidationSchema.updateCategorySchema, "body")
        ],
        CategoryController.updateCategory
    );

    router.get(
        routerPath + "SelectById/:categoryId",
        [
            isAuthorized,
            selectCategoryByIdSanitize,
            validationMiddleware(categoryValidationSchema.categoryIdParamSchema, "params")
        ],
        CategoryController.getCategoryById
    );

    router.delete(
        routerPath + "Delete/:categoryId",
        [
            isAdminAuthorized,
            selectCategoryByIdSanitize,
            validationMiddleware(categoryValidationSchema.categoryIdParamSchema, "params")
        ],
        CategoryController.deleteCategory
    );

    router.post(
        routerPath + "List",
        [
            isAuthorized,
            listCategorySanitize,
            validationMiddleware(categoryValidationSchema.categoryListSchema, "body")
        ],
        CategoryController.categoriesList
    );

    router.get(
        routerPath + "GetCategories",
        [
            isAuthorized
        ],
        CategoryController.getCategories
    );

    app.use(configuration.baseUrl, router);
};

export default categoryRoute;
