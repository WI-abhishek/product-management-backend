import joi from "joi";
import { decode } from "html-entities";
import { undefinedAndNullCheck } from "#utils/helper.utils.js";

const productStatusEnum = ["ACTIVE", "INACTIVE", "OUT_OF_STOCK", "DISCONTINUED"];

// ─── SANITIZE MIDDLEWARES ───────────────────────────────────────────────────

export const addProductSanitize = (req, res, next) => {
    const fields = ["sku", "name", "description", "brand", "unit", "status", "categoryId"];
    for (const field of fields) {
        if (undefinedAndNullCheck(req.body?.[field])) {
            req.body[field] = decode(req.sanitize(req.body[field] + ""));
        }
    }
    next();
};

export const updateProductSanitize = (req, res, next) => {
    const fields = ["productId", "sku", "name", "description", "brand", "unit", "status", "categoryId"];
    for (const field of fields) {
        if (undefinedAndNullCheck(req.body?.[field])) {
            req.body[field] = decode(req.sanitize(req.body[field] + ""));
        }
    }
    next();
};

export const statusProductSanitize = (req, res, next) => {
    const fields = ["productId", "status"];
    for (const field of fields) {
        if (undefinedAndNullCheck(req.body?.[field])) {
            req.body[field] = decode(req.sanitize(req.body[field] + ""));
        }
    }
    next();
};

export const selectProductByIdSanitize = (req, res, next) => {
    if (req.params?.productId && undefinedAndNullCheck(req.params.productId)) {
        req.params.productId = decode(req.sanitize(req.params.productId + ""));
    }
    next();
};

export const listProductSanitize = (req, res, next) => {
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

export const productValidationSchema = {
    createProductSchema: joi.object({
        sku: joi.string().trim().max(50).required().messages({
            "string.empty": "Product SKU is required.",
            "any.required": "Product SKU is required.",
            "string.max": "SKU must be at most 50 characters."
        }),
        name: joi.string().trim().min(2).max(200).required().messages({
            "string.empty": "Product name is required.",
            "any.required": "Product name is required.",
            "string.min": "Product name must be at least 2 characters.",
            "string.max": "Product name must be at most 200 characters."
        }),
        description: joi.string().trim().max(5000).allow("", null).optional().messages({
            "string.max": "Description must be at most 5000 characters."
        }),
        brand: joi.string().trim().max(100).allow("", null).optional(),
        costPrice: joi.number().min(0).precision(2).required().messages({
            "number.base": "Cost price must be a valid number.",
            "number.min": "Cost price cannot be negative.",
            "any.required": "Cost price is required."
        }),
        sellingPrice: joi.number().min(0).precision(2).required().messages({
            "number.base": "Selling price must be a valid number.",
            "number.min": "Selling price cannot be negative.",
            "any.required": "Selling price is required."
        }),
        stockQuantity: joi.number().integer().min(0).default(0).messages({
            "number.base": "Stock quantity must be an integer.",
            "number.min": "Stock quantity cannot be negative."
        }),
        lowStockThreshold: joi.number().integer().min(0).default(10).messages({
            "number.base": "Low stock threshold must be an integer.",
            "number.min": "Low stock threshold cannot be negative."
        }),
        unit: joi.string().trim().max(20).default("pcs"),
        status: joi.string().trim().valid(...productStatusEnum).default("ACTIVE").messages({
            "any.only": "Invalid product status."
        }),
        categoryId: joi.string().trim().required().messages({
            "string.empty": "Category is required.",
            "any.required": "Category is required."
        })
    }),

    updateProductSchema: joi.object({
        productId: joi.string().trim().required().messages({
            "string.empty": "Product ID is required.",
            "any.required": "Product ID is required."
        }),
        sku: joi.string().trim().max(50).optional().messages({
            "string.max": "SKU must be at most 50 characters."
        }),
        name: joi.string().trim().min(2).max(200).optional().messages({
            "string.min": "Product name must be at least 2 characters.",
            "string.max": "Product name must be at most 200 characters."
        }),
        description: joi.string().trim().max(5000).allow("", null).optional(),
        brand: joi.string().trim().max(100).allow("", null).optional(),
        costPrice: joi.number().min(0).precision(2).optional().messages({
            "number.base": "Cost price must be a valid number.",
            "number.min": "Cost price cannot be negative."
        }),
        sellingPrice: joi.number().min(0).precision(2).optional().messages({
            "number.base": "Selling price must be a valid number.",
            "number.min": "Selling price cannot be negative."
        }),
        stockQuantity: joi.number().integer().min(0).optional().messages({
            "number.base": "Stock quantity must be an integer.",
            "number.min": "Stock quantity cannot be negative."
        }),
        lowStockThreshold: joi.number().integer().min(0).optional().messages({
            "number.base": "Low stock threshold must be an integer.",
            "number.min": "Low stock threshold cannot be negative."
        }),
        unit: joi.string().trim().max(20).optional(),
        status: joi.string().trim().valid(...productStatusEnum).optional().messages({
            "any.only": "Invalid product status."
        }),
        categoryId: joi.string().trim().optional(),
        imageUrl: joi.string().trim().allow("", null).optional()
    }),

    updateStatusSchema: joi.object({
        productId: joi.string().trim().required().messages({
            "string.empty": "Product ID is required.",
            "any.required": "Product ID is required."
        }),
        status: joi.string().trim().valid(...productStatusEnum).required().messages({
            "string.empty": "Status is required.",
            "any.required": "Status is required.",
            "any.only": "Invalid product status."
        })
    }),

    productIdParamSchema: joi.object({
        productId: joi.string().trim().required().messages({
            "string.empty": "Product ID is required.",
            "any.required": "Product ID is required."
        })
    }),

    productListSchema: joi.object({
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
