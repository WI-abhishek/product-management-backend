import { prisma, cloudinaryConfig } from "#configs";
import response from "#configs/response.json" with { type: "json" };
import { removeUploadedFile, generateProductHash } from "#utils";

// ─── 1. ADD PRODUCT (OPTIONAL SINGLE IMAGE UPLOAD VIA CLOUDINARY) ────────────
export const createProduct = async (req, res) => {
    try {
        const {
            sku,
            name,
            description,
            brand,
            costPrice,
            sellingPrice,
            stockQuantity = 0,
            lowStockThreshold = 10,
            unit = "pcs",
            status = "ACTIVE",
            categoryId
        } = req.body;

        const userId = req.user.userId;

        const category = await prisma.category.findUnique({
            where: { categoryId }
        });

        if (!category) {
            await removeUploadedFile(req);
            return res.status(404).json({
                status: 0,
                message: response["405"]
            });
        }

        const existingSku = await prisma.product.findUnique({
            where: { sku }
        });

        if (existingSku) {
            await removeUploadedFile(req);
            return res.status(409).json({
                status: 0,
                message: response["309"]
            });
        }

        let imageUrl = null;
        let imagePublicId = null;
        if (req.file?.path) {
            try {
                const uploadResult = await cloudinaryConfig.uploader.upload(req.file.path, {
                    folder: "product-management"
                });
                imageUrl = uploadResult.secure_url;
                imagePublicId = uploadResult.public_id;
            } finally {
                await removeUploadedFile(req);
            }
        }

        const product = await prisma.product.create({
            data: {
                sku,
                name,
                description: description || null,
                brand: brand || null,
                costPrice,
                sellingPrice,
                stockQuantity,
                lowStockThreshold,
                unit,
                status,
                imageUrl,
                imagePublicId,
                categoryId,
                userId
            },
            include: {
                category: {
                    select: {
                        categoryId: true,
                        name: true
                    }
                }
            }
        });

        return res.status(200).json({
            status: 1,
            message: response["300"],
            data: product
        });
    } catch (error) {
        await removeUploadedFile(req);
        return res.status(500).json({
            status: 0,
            message: response["100"],
            error: error.message
        });
    }
};

// ─── 2. UPDATE PRODUCT (OPTIONAL SINGLE IMAGE REPLACEMENT VIA CLOUDINARY) ───
export const updateProduct = async (req, res) => {
    try {
        const {
            productId,
            sku,
            name,
            description,
            brand,
            costPrice,
            sellingPrice,
            stockQuantity,
            lowStockThreshold,
            unit,
            status,
            categoryId
        } = req.body;

        const existingProduct = await prisma.product.findUnique({
            where: { productId }
        });

        if (!existingProduct) {
            await removeUploadedFile(req);
            return res.status(404).json({
                status: 0,
                message: response["305"]
            });
        }

        if (categoryId && categoryId !== existingProduct.categoryId) {
            const category = await prisma.category.findUnique({
                where: { categoryId }
            });
            if (!category) {
                await removeUploadedFile(req);
                return res.status(404).json({
                    status: 0,
                    message: response["405"]
                });
            }
        }

        if (sku && sku !== existingProduct.sku) {
            const duplicateSku = await prisma.product.findFirst({
                where: {
                    sku,
                    productId: { not: productId }
                }
            });
            if (duplicateSku) {
                await removeUploadedFile(req);
                return res.status(409).json({
                    status: 0,
                    message: response["309"]
                });
            }
        }

        let imageUrl = undefined;
        let imagePublicId = undefined;

        if (req.file?.path) {
            try {
                // Delete previous image from Cloudinary if exists
                if (existingProduct.imagePublicId) {
                    await cloudinaryConfig.uploader.destroy(existingProduct.imagePublicId).catch(() => { });
                }

                // Upload new image
                const uploadResult = await cloudinaryConfig.uploader.upload(req.file.path, {
                    folder: "product-management"
                });
                imageUrl = uploadResult.secure_url;
                imagePublicId = uploadResult.public_id;
            } finally {
                await removeUploadedFile(req);
            }
        } else if (req.body.imageUrl === "" || req.body.imageUrl === null) {
            // User requested to remove the existing image
            if (existingProduct.imagePublicId) {
                await cloudinaryConfig.uploader.destroy(existingProduct.imagePublicId).catch(() => { });
            }
            imageUrl = null;
            imagePublicId = null;
        }

        const updatedProduct = await prisma.product.update({
            where: { productId },
            data: {
                sku,
                name,
                description,
                brand,
                costPrice,
                sellingPrice,
                stockQuantity,
                lowStockThreshold,
                unit,
                status,
                imageUrl,
                imagePublicId,
                categoryId
            },
            include: {
                category: {
                    select: {
                        categoryId: true,
                        name: true
                    }
                }
            }
        });

        return res.status(200).json({
            status: 1,
            message: response["301"],
            data: updatedProduct
        });
    } catch (error) {
        await removeUploadedFile(req);
        return res.status(500).json({
            status: 0,
            message: response["100"],
            error: error.message
        });
    }
};

// ─── 3. GET PRODUCT BY ID ───────────────────────────────────────────────────
export const getProductById = async (req, res) => {
    try {
        const productId = req.params?.productId;

        if (!productId) {
            return res.status(400).json({
                status: 0,
                message: response["306"]
            });
        }

        const product = await prisma.product.findUnique({
            where: { productId },
            include: {
                category: {
                    select: {
                        categoryId: true,
                        name: true,
                        description: true
                    }
                },
                user: {
                    select: {
                        userId: true,
                        userName: true,
                        email: true
                    }
                }
            }
        });

        if (!product) {
            return res.status(404).json({
                status: 0,
                message: response["305"]
            });
        }

        return res.status(200).json({
            status: 1,
            message: response["302"],
            data: {
                ...product,
                productHash: generateProductHash(product)
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"],
            error: error.message
        });
    }
};

// ─── 4. UPDATE PRODUCT STATUS (QUICK TOGGLE) ────────────────────────────────
export const updateProductStatus = async (req, res) => {
    try {
        const { productId, status } = req.body;

        const existingProduct = await prisma.product.findUnique({
            where: { productId }
        });

        if (!existingProduct) {
            return res.status(404).json({
                status: 0,
                message: response["305"]
            });
        }

        const updatedProduct = await prisma.product.update({
            where: { productId },
            data: { status },
            include: {
                category: {
                    select: {
                        categoryId: true,
                        name: true
                    }
                }
            }
        });

        return res.status(200).json({
            status: 1,
            message: response["307"],
            data: updatedProduct
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"],
            error: error.message
        });
    }
};

// ─── 5. DELETE PRODUCT ──────────────────────────────────────────────────────
export const deleteProduct = async (req, res) => {
    try {
        const productId = req.params?.productId;

        if (!productId) {
            return res.status(400).json({
                status: 0,
                message: response["306"]
            });
        }

        const product = await prisma.product.findUnique({
            where: { productId }
        });

        if (!product) {
            return res.status(404).json({
                status: 0,
                message: response["305"]
            });
        }

        // Delete image from Cloudinary if exists
        if (product.imagePublicId) {
            await cloudinaryConfig.uploader.destroy(product.imagePublicId).catch(() => { });
        }

        await prisma.product.delete({
            where: { productId }
        });

        return res.status(200).json({
            status: 1,
            message: response["304"]
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"],
            error: error.message
        });
    }
};

// ─── 6. GET PRODUCTS LIST (DATABASE-SIDE SEARCH, MULTI-COLUMN FILTER, SORT & PAGINATION) ───
export const productList = async (req, res) => {
    try {
        const {
            page = 1,
            noOf = 10,
            search,
            filter,
            sortBy
        } = req.body || {};

        const andConditions = [];

        // Global Search across visible table fields at the database level
        if (search) {
            const orConditions = [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
                { brand: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { unit: { contains: search, mode: "insensitive" } },
                { category: { name: { contains: search, mode: "insensitive" } } }
            ];

            const upper = search.toUpperCase();
            if (["ACTIVE", "INACTIVE", "OUT_OF_STOCK", "DISCONTINUED"].includes(upper)) {
                orConditions.push({ status: upper });
            }

            andConditions.push({ OR: orConditions });
        }

        // Multi-Column Filter Array (AND logic on database side)
        if (Array.isArray(filter)) {
            for (const { field, value } of filter) {
                if (value === undefined || value === null || value === "") continue;
                const cleanValue = String(value).trim();

                if (field === "name" || field === "sku" || field === "brand" || field === "unit" || field === "description") {
                    andConditions.push({
                        [field]: { contains: cleanValue, mode: "insensitive" }
                    });
                } else if (field === "status") {
                    andConditions.push({
                        status: cleanValue.toUpperCase()
                    });
                } else if (field === "categoryId") {
                    andConditions.push({
                        categoryId: cleanValue
                    });
                } else if (field === "categoryName" || field === "category") {
                    andConditions.push({
                        category: { name: { contains: cleanValue, mode: "insensitive" } }
                    });
                } else if (field === "sellingPrice") {
                    const pattern = `%${cleanValue}%`;
                    const matchingProducts = await prisma.$queryRaw`
                        SELECT "productId" 
                        FROM "products" 
                        WHERE "sellingPrice"::text LIKE ${pattern}
                    `;
                    const matchingIds = matchingProducts.map((p) => p.productId);
                    andConditions.push({ productId: { in: matchingIds } });
                } else if (field === "costPrice") {
                    const pattern = `%${cleanValue}%`;
                    const matchingProducts = await prisma.$queryRaw`
                        SELECT "productId" 
                        FROM "products" 
                        WHERE "costPrice"::text LIKE ${pattern}
                    `;
                    const matchingIds = matchingProducts.map((p) => p.productId);
                    andConditions.push({ productId: { in: matchingIds } });
                } else if (field === "stockQuantity") {
                    const pattern = `%${cleanValue}%`;
                    const matchingProducts = await prisma.$queryRaw`
                        SELECT "productId" 
                        FROM "products" 
                        WHERE "stockQuantity"::text LIKE ${pattern}
                    `;
                    const matchingIds = matchingProducts.map((p) => p.productId);
                    andConditions.push({ productId: { in: matchingIds } });
                } else if (field === "stockStatus") {
                    const upperVal = cleanValue.toUpperCase();
                    if (upperVal === "OUT_OF_STOCK") {
                        andConditions.push({ stockQuantity: 0 });
                    } else if (upperVal === "IN_STOCK") {
                        andConditions.push({ stockQuantity: { gt: 0 } });
                    } else if (upperVal === "LOW_STOCK") {
                        andConditions.push({
                            stockQuantity: { gt: 0, lte: 10 }
                        });
                    }
                } else if (field === "minPrice") {
                    const num = Number(cleanValue);
                    if (!isNaN(num)) andConditions.push({ sellingPrice: { gte: num } });
                } else if (field === "maxPrice") {
                    const num = Number(cleanValue);
                    if (!isNaN(num)) andConditions.push({ sellingPrice: { lte: num } });
                }
            }
        }

        const where = andConditions.length > 0 ? { AND: andConditions } : {};

        // Database Sorting
        let orderBy = { createdAt: "desc" };
        const allowedSortFields = ["name", "sku", "brand", "sellingPrice", "costPrice", "stockQuantity", "lowStockThreshold", "status", "createdAt", "updatedAt"];
        if (sortBy?.field) {
            const direction = sortBy.type ? sortBy.type.toLowerCase() : "asc";
            if (sortBy.field === "category" || sortBy.field === "categoryName") {
                orderBy = { category: { name: direction } };
            } else if (allowedSortFields.includes(sortBy.field)) {
                orderBy = { [sortBy.field]: direction };
            }
        }

        // Database Pagination
        const skip = (page - 1) * noOf;

        const [totalCount, products] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                skip,
                take: noOf,
                orderBy,
                include: {
                    category: {
                        select: {
                            categoryId: true,
                            name: true
                        }
                    },
                    user: {
                        select: {
                            userId: true,
                            userName: true
                        }
                    }
                }
            })
        ]);

        const productsWithHash = products.map((p) => ({
            ...p,
            productHash: generateProductHash(p)
        }));

        return res.status(200).json({
            status: 1,
            message: response["303"],
            data: {
                totalCount,
                totalPages: Math.ceil(totalCount / noOf),
                currentPage: page,
                pageSize: noOf,
                products: productsWithHash
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"],
            error: error.message
        });
    }
};

// ─── 7. CHECKOUT / VERIFY CART (OPTIMISTIC CONCURRENCY / CONTENT HASH INTEGRITY) ───
export const checkout = async (req, res) => {
    try {
        const { items } = req.body;
        const productIds = items.map((item) => item.productId);

        const dbProducts = await prisma.product.findMany({
            where: {
                productId: { in: productIds }
            }
        });

        const productMap = new Map(dbProducts.map((p) => [p.productId, p]));
        const errors = [];
        const validUpdates = [];

        for (const item of items) {
            const dbProduct = productMap.get(item.productId);
            const clientName = item.productName;

            if (!dbProduct) {
                errors.push({
                    productId: item.productId,
                    productName: clientName,
                    reason: `Product "${clientName}" no longer exists in the store.`
                });
                continue;
            }

            if (dbProduct.status !== "ACTIVE") {
                errors.push({
                    productId: item.productId,
                    productName: clientName,
                    reason: `Product "${clientName}" is currently ${dbProduct.status.toLowerCase()} and cannot be purchased.`
                });
                continue;
            }

            // Check stock availability
            if (dbProduct.stockQuantity < item.quantity) {
                errors.push({
                    productId: item.productId,
                    productName: clientName,
                    reason: dbProduct.stockQuantity === 0
                        ? `Product "${clientName}" is out of stock.`
                        : `Insufficient stock for "${clientName}".`
                });
                continue;
            }

            // Verify canonical content hash (strict content integrity check)
            const currentHash = generateProductHash(dbProduct);
            if (currentHash !== item.cartHash) {
                errors.push({
                    productId: item.productId,
                    productName: clientName,
                    reason: `Product details for "${clientName}" have changed since you added it to your cart.`
                });
                continue;
            }

            validUpdates.push({
                productId: item.productId,
                quantity: item.quantity
            });
        }

        // If any product is invalid or details changed, block checkout completely and list all affected products
        if (errors.length > 0) {
            let overallMessage = "";
            if (errors.length === 1) {
                overallMessage = errors[0].reason;
            } else {
                const affectedNames = errors.map((e) => `"${e.productName}"`).join(", ");
                overallMessage = `Product details or stock have changed for: ${affectedNames}. Please review your cart.`;
            }

            return res.status(409).json({
                status: 0,
                message: overallMessage,
                errors
            });
        }

        // Decrement stock
        await prisma.$transaction(
            validUpdates.map((item) =>
                prisma.product.update({
                    where: { productId: item.productId },
                    data: {
                        stockQuantity: {
                            decrement: item.quantity
                        }
                    }
                })
            )
        );

        return res.status(200).json({
            status: 1,
            message: response["310"],
            data: {
                totalItems: validUpdates.reduce((sum, i) => sum + i.quantity, 0),
                checkoutTime: new Date().toISOString()
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"],
            error: error.message
        });
    }
};
