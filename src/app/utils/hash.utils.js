import crypto from "crypto";

export const generateProductHash = (product) => {
    if (!product) return "";
    const productId = String(product.productId || "");
    const name = String(product.name || "").trim();
    const brand = String(product.brand || "").trim();
    const sellingPrice = Number(product.sellingPrice || 0).toFixed(2);
    const status = String(product.status || "");

    const canonicalString = `${productId}|${name}|${brand}|${sellingPrice}|${status}`;
    return crypto.createHash("sha256").update(canonicalString).digest("hex");
};

