import { prisma } from "#configs";
import response from "#configs/response.json" with { type: "json" };

export const getDashboardStats = async (req, res) => {
    try {
        const [
            totalProducts,
            totalCategories,
            statusGroups,
            lowStockCountResult,
            categories,
            lowStockProductsResult
        ] = await Promise.all([
            // 1. Total products count
            prisma.product.count(),

            // 2. Total categories count
            prisma.category.count(),

            // 3. Status breakdown (grouped in single query)
            prisma.product.groupBy({
                by: ["status"],
                _count: { status: true }
            }),

            // 4. Low stock count (where stockQuantity <= lowStockThreshold)
            prisma.$queryRaw`
                SELECT COUNT(*)::int as count 
                FROM "products" 
                WHERE "stockQuantity" <= "lowStockThreshold"
            `,

            // 5. Category distribution (top 4 categories by product count)
            prisma.category.findMany({
                select: {
                    categoryId: true,
                    name: true,
                    _count: {
                        select: { products: true }
                    }
                },
                orderBy: {
                    products: {
                        _count: "desc"
                    }
                },
                take: 4
            }),

            // 6. Low stock alerts (top 10 products needing replenishment)
            prisma.$queryRaw`
                SELECT 
                    p."productId", 
                    p."name", 
                    p."sku", 
                    p."imageUrl", 
                    p."stockQuantity", 
                    p."lowStockThreshold", 
                    p."status",
                    c."categoryId" as "categoryId", 
                    c."name" as "categoryName"
                FROM "products" p
                LEFT JOIN "categories" c ON p."categoryId" = c."categoryId"
                WHERE p."stockQuantity" <= p."lowStockThreshold"
                ORDER BY p."stockQuantity" ASC, p."createdAt" DESC
                LIMIT 10
            `
        ]);

        // Map status counts cleanly
        let activeProducts = 0;
        let inactiveProducts = 0;
        let outOfStockProducts = 0;
        let discontinuedProducts = 0;

        for (const group of statusGroups) {
            const count = group._count?.status || 0;
            switch (group.status) {
                case "ACTIVE":
                    activeProducts = count;
                    break;
                case "INACTIVE":
                    inactiveProducts = count;
                    break;
                case "OUT_OF_STOCK":
                    outOfStockProducts = count;
                    break;
                case "DISCONTINUED":
                    discontinuedProducts = count;
                    break;
            }
        }

        const lowStockCount = Number(lowStockCountResult?.[0]?.count || 0);

        // Map category distribution
        const categoryDistribution = categories.map((cat) => ({
            categoryId: cat.categoryId,
            categoryName: cat.name,
            productCount: cat._count?.products || 0
        }));

        // Format low stock alerts
        const lowStockAlerts = (lowStockProductsResult || []).map((prod) => ({
            productId: prod.productId,
            name: prod.name,
            sku: prod.sku,
            imageUrl: prod.imageUrl || "",
            stockQuantity: Number(prod.stockQuantity || 0),
            lowStockThreshold: Number(prod.lowStockThreshold || 0),
            status: prod.status,
            categoryId: prod.categoryId || "",
            categoryName: prod.categoryName || "-"
        }));

        return res.status(200).json({
            status: 1,
            message: response["308"],
            data: {
                counts: {
                    totalProducts,
                    activeProducts,
                    inactiveProducts,
                    outOfStockProducts,
                    discontinuedProducts,
                    totalCategories,
                    lowStockCount
                },
                categoryDistribution,
                lowStockAlerts
            }
        });
    } catch (error) {
        console.error("getDashboardStats error:", error);
        return res.status(500).json({
            status: 0,
            message: response["100"],
            error: error.message
        });
    }
};

