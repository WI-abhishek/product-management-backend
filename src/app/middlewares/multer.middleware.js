import multer from "multer";
import path from "path";
import fs from "fs";
import response from "#configs/response.json" with { type: "json" };

const UPLOAD_DIR = "uploads/";

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"
];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${file.fieldname}${ext}`);
    }
});

export const upload = multer({
    storage,
    limits: { fileSize: MAX_SIZE },
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"));
        }
        cb(null, true);
    }
});

export const multerErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(200).json({ status: 0, message: response["104"] });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(200).json({ status: 0, message: response["105"] });
        }
    }
    next(err);
};

