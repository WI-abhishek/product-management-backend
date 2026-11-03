import joi from "joi";
import { decode } from "html-entities";
import { undefinedAndNullCheck } from "#utils/helper.utils.js";

// ─── SANITIZE MIDDLEWARES ───────────────────────────────────────────────────

export const registerSanitize = (req, res, next) => {
    const fieldsToSanitize = ["userName", "email", "password"];
    for (const field of fieldsToSanitize) {
        if (undefinedAndNullCheck(req.body?.[field])) {
            req.body[field] = decode(req.sanitize(req.body[field] + ""));
        }
    }
    next();
};

export const loginSanitize = (req, res, next) => {
    const fieldsToSanitize = ["email", "password"];
    for (const field of fieldsToSanitize) {
        if (undefinedAndNullCheck(req.body?.[field])) {
            req.body[field] = decode(req.sanitize(req.body[field] + ""));
        }
    }
    next();
};

// ─── JOI VALIDATION SCHEMAS ──────────────────────────────────────────────────

export const authValidationSchema = {
    registerSchema: joi.object({
        userName: joi.string().trim().min(2).max(100).required().messages({
            "string.empty": "User name is required.",
            "any.required": "User name is required.",
            "string.min": "User name must be at least 2 characters.",
            "string.max": "User name must be at most 100 characters."
        }),
        email: joi.string().trim().email().required().messages({
            "string.empty": "Email is required.",
            "any.required": "Email is required.",
            "string.email": "Email must be a valid email address."
        }),
        password: joi.string().trim().min(6).max(50).required().messages({
            "string.empty": "Password is required.",
            "any.required": "Password is required.",
            "string.min": "Password must be at least 6 characters.",
            "string.max": "Password must be at most 50 characters."
        })
    }),

    loginSchema: joi.object({
        email: joi.string().trim().email().required().messages({
            "string.empty": "Email is required.",
            "any.required": "Email is required.",
            "string.email": "Email must be a valid email address."
        }),
        password: joi.string().trim().required().messages({
            "string.empty": "Password is required.",
            "any.required": "Password is required."
        })
    })
};

