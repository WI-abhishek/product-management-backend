import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const dbConnection = async (retries = 3, delay = 2000) => {
    for (let i = 1; i <= retries; i++) {
        try {
            await prisma.$connect();
            console.log("PostgreSQL (Neon) connected successfully via Prisma.");
            return;
        } catch (error) {
            console.warn(`Connection attempt ${i} failed (Neon waking up...). Retrying in ${delay / 1000}s...`);
            if (i === retries) {
                console.error("PostgreSQL connection failed:", error.message);
                process.exit(1);
            }
            await new Promise((res) => setTimeout(res, delay));
        }
    }
};
