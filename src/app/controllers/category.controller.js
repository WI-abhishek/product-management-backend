import { prisma } from "#configs";
import response from "#configs/response.json" with { type: "json" };

// ─── CREATE CATEGORY ─────────────────────────────────────────────────────────
export const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        const existingCategory = await prisma.category.findFirst({
            where: {
                name: { equals: name.trim(), mode: "insensitive" }
            }
        });

        if (existingCategory) {
            return res.status(409).json({
                status: 0,
                message: response["407"]
            });
        }

        const category = await prisma.category.create({
            data: {
                name: name.trim(),
                description: description || null
            }
        });

        return res.status(200).json({
            status: 1,
            message: response["400"],
            data: category
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"],
            error: error.message
        });
    }
};

// ─── UPDATE CATEGORY ─────────────────────────────────────────────────────────
export const updateCategory = async (req, res) => {
    try {
        const { categoryId, name, description } = req.body;

        const existingCategory = await prisma.category.findUnique({
            where: { categoryId }
        });

        if (!existingCategory) {
            return res.status(404).json({
                status: 0,
                message: response["405"]
            });
        }

        const duplicateName = await prisma.category.findFirst({
            where: {
                name: { equals: name.trim(), mode: "insensitive" },
                categoryId: { not: categoryId }
            }
        });

        if (duplicateName) {
            return res.status(409).json({
                status: 0,
                message: response["407"]
            });
        }

        const updatedCategory = await prisma.category.update({
            where: { categoryId },
            data: {
                name: name.trim(),
                description: description !== undefined ? (description || null) : existingCategory.description
            }
        });

        return res.status(200).json({
            status: 1,
            message: response["401"],
            data: updatedCategory
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"],
            error: error.message
        });
    }
};

// ─── GET CATEGORY BY ID ──────────────────────────────────────────────────────
export const getCategoryById = async (req, res) => {
    try {
        const categoryId = req.params?.categoryId;

        if (!categoryId) {
            return res.status(400).json({
                status: 0,
                message: response["406"]
            });
        }

        const category = await prisma.category.findUnique({
            where: { categoryId },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });

        if (!category) {
            return res.status(404).json({
                status: 0,
                message: response["405"]
            });
        }

        return res.status(200).json({
            status: 1,
            message: response["402"],
            data: category
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"],
            error: error.message
        });
    }
};

// ─── DELETE CATEGORY ─────────────────────────────────────────────────────────
export const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params?.categoryId;

        if (!categoryId) {
            return res.status(400).json({
                status: 0,
                message: response["406"]
            });
        }

        const category = await prisma.category.findUnique({
            where: { categoryId }
        });

        if (!category) {
            return res.status(404).json({
                status: 0,
                message: response["405"]
            });
        }

        const productCount = await prisma.product.count({
            where: { categoryId }
        });

        if (productCount > 0) {
            return res.status(400).json({
                status: 0,
                message: response["408"]
            });
        }

        await prisma.category.delete({
            where: { categoryId }
        });

        return res.status(200).json({
            status: 1,
            message: response["404"]
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"],
            error: error.message
        });
    }
};

// ─── GET CATEGORIES LIST (DATABASE-SIDE SEARCH, MULTI-COLUMN FILTER, SORT & PAGINATION) ───
export const categoriesList = async (req, res) => {
    try {
        const {
            page = 1,
            noOf = 10,
            search,
            filter,
            sortBy
        } = req.body || {};

        const andConditions = [];

        // 1. Global Search (applied at database level across name and description)
        if (search) {
            andConditions.push({
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } }
                ]
            });
        }

        // 2. Column-by-Column Multi-Filter (AND condition on database side)
        if (Array.isArray(filter)) {
            for (const { field, value } of filter) {
                if (value === undefined || value === null || value === "") continue;
                const cleanValue = String(value).trim();

                if (field === "name" || field === "description") {
                    andConditions.push({
                        [field]: { contains: cleanValue, mode: "insensitive" }
                    });
                }
            }
        }

        const where = andConditions.length > 0 ? { AND: andConditions } : {};

        // 3. Database Sorting
        let orderBy = { createdAt: "desc" };
        const allowedSortFields = ["name", "description", "createdAt", "updatedAt"];
        if (sortBy?.field && allowedSortFields.includes(sortBy.field)) {
            const direction = sortBy.type ? sortBy.type.toLowerCase() : "asc";
            orderBy = { [sortBy.field]: direction };
        }

        // 4. Database Pagination
        const skip = (page - 1) * noOf;

        const [totalCount, categories] = await Promise.all([
            prisma.category.count({ where }),
            prisma.category.findMany({
                where,
                skip,
                take: noOf,
                orderBy,
                include: {
                    _count: {
                        select: { products: true }
                    }
                }
            })
        ]);

        return res.status(200).json({
            status: 1,
            message: response["403"],
            data: {
                totalCount,
                totalPages: Math.ceil(totalCount / noOf),
                currentPage: page,
                pageSize: noOf,
                categories
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

// ─── GET CATEGORIES FOR DROPDOWN (VALUE & LABEL) ─────────────────────────────
export const getCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            select: {
                categoryId: true,
                name: true
            },
            orderBy: {
                name: "asc"
            }
        });

        const formattedCategories = categories.map((category) => ({
            value: category.categoryId,
            label: category.name
        }));

        return res.status(200).json({
            status: 1,
            message: response["403"],
            data: formattedCategories
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"],
            error: error.message
        });
    }
};
