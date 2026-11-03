import joi from "joi";
import { decode } from "html-entities";
import { undefinedAndNullCheck } from "#utils/helper.utils.js";

// ─── SANITIZE MIDDLEWARES ───────────────────────────────────────────────────

export const addCategorySanitize = (req, res, next) => {
    const fields = ["name", "description"];
    for (const field of fields) {
        if (undefinedAndNullCheck(req.body?.[field])) {
            req.body[field] = decode(req.sanitize(req.body[field] + ""));
        }
    }
    next();
};

export const updateCategorySanitize = (req, res, next) => {
    const fields = ["categoryId", "name", "description"];
    for (const field of fields) {
        if (undefinedAndNullCheck(req.body?.[field])) {
            req.body[field] = decode(req.sanitize(req.body[field] + ""));
        }
    }
    next();
};

export const selectCategoryByIdSanitize = (req, res, next) => {
    if (req.params?.categoryId && undefinedAndNullCheck(req.params.categoryId)) {
        req.params.categoryId = decode(req.sanitize(req.params.categoryId + ""));
    }
    next();
};

export const listCategorySanitize = (req, res, next) => {
    const target = req.body || {};

    if (undefinedAndNullCheck(target.search)) {
        target.search = decode(req.sanitize(target.search + ""));
    }

    if (Array.isArray(target.filter)) {
        for (const item of target.filter) {
            if (undefinedAndNullCheck(item?.field)) {
                item.field = decode(req.sanitize(item.field + ""));
            }
            if (undefinedAndNullCheck(item?.value)) {
                item.value = decode(req.sanitize(item.value + ""));
            }
        }
    }

    if (target.sortBy && typeof target.sortBy === "object") {
        if (undefinedAndNullCheck(target.sortBy.field)) {
            target.sortBy.field = decode(req.sanitize(target.sortBy.field + ""));
        }
        if (undefinedAndNullCheck(target.sortBy.type)) {
            target.sortBy.type = decode(req.sanitize(target.sortBy.type + ""));
        }
    }

    next();
};

// ─── JOI VALIDATION SCHEMAS ──────────────────────────────────────────────────

export const categoryValidationSchema = {
    createCategorySchema: joi.object({
        name: joi.string().trim().min(2).max(100).required().messages({
            "string.empty": "Category name is required.",
            "any.required": "Category name is required.",
            "string.min": "Category name must be at least 2 characters.",
            "string.max": "Category name must be at most 100 characters."
        }),
        description: joi.string().trim().max(1000).allow("", null).optional().messages({
            "string.max": "Description must be at most 1000 characters."
        })
    }),

    updateCategorySchema: joi.object({
        categoryId: joi.string().trim().required().messages({
            "string.empty": "Category ID is required.",
            "any.required": "Category ID is required."
        }),
        name: joi.string().trim().min(2).max(100).required().messages({
            "string.empty": "Category name is required.",
            "any.required": "Category name is required.",
            "string.min": "Category name must be at least 2 characters.",
            "string.max": "Category name must be at most 100 characters."
        }),
        description: joi.string().trim().max(1000).allow("", null).optional().messages({
            "string.max": "Description must be at most 1000 characters."
        })
    }),

    categoryIdParamSchema: joi.object({
        categoryId: joi.string().trim().required().messages({
            "string.empty": "Category ID is required.",
            "any.required": "Category ID is required."
        })
    }),

    categoryListSchema: joi.object({
        page: joi.number().integer().min(1).default(1),
        noOf: joi.number().integer().min(1).max(100).default(10),
        search: joi.string().trim().allow("", null).optional(),
        filter: joi.array().items(
            joi.object({
                field: joi.string().trim().required(),
                value: joi.any().required()
            })
        ).allow(null).optional(),
        sortBy: joi.object({
            field: joi.string().trim().required(),
            type: joi.string().trim().valid("asc", "desc", "ASC", "DESC").default("asc")
        }).allow(null).optional()
    })
};
