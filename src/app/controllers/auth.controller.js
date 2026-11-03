import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "#configs";
import response from "#configs/response.json" with { type: "json" };
import { generateAccessToken, generateRefreshToken } from "#utils/token.utils.js";

// ─── REGISTER (ADMIN USER) ───────────────────────────────────────────────────
export const register = async (req, res) => {
    try {
        const { userName, email, password } = req.body;

        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (existingUser) {
            return res.status(409).json({
                status: 0,
                message: response["250"]
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                userName,
                email: email.toLowerCase(),
                password: hashedPassword,
                role: "ADMIN"
            }
        });

        const tokenPayload = { userId: newUser.userId, role: newUser.role };
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        await prisma.user.update({
            where: { userId: newUser.userId },
            data: { refreshToken }
        });

        return res.status(200).json({
            status: 1,
            message: response["200"],
            data: {
                userId: newUser.userId,
                userName: newUser.userName,
                email: newUser.email,
                role: newUser.role,
                accessToken,
                refreshToken
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

// ─── LOGIN ───────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            return res.status(401).json({
                status: 0,
                message: response["221"]
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                status: 0,
                message: response["221"]
            });
        }

        const tokenPayload = { userId: user.userId, role: user.role };
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        await prisma.user.update({
            where: { userId: user.userId },
            data: { refreshToken }
        });

        return res.status(200).json({
            status: 1,
            message: response["220"],
            data: {
                userId: user.userId,
                userName: user.userName,
                email: user.email,
                role: user.role,
                accessToken,
                refreshToken
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

// ─── REFRESH TOKEN (EXTRACTED FROM HEADERS) ──────────────────────────────────
export const refreshToken = async (req, res) => {
    try {
        const headerToken = req.headers["x-refresh-token"] ||
            (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);

        if (!headerToken) {
            return res.status(400).json({
                status: 0,
                message: "Refresh token is missing from headers (use 'x-refresh-token' or 'Authorization: Bearer <token>')."
            });
        }

        jwt.verify(headerToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    status: 0,
                    message: response["225"],
                    error: err.name
                });
            }

            const user = await prisma.user.findUnique({
                where: { userId: decoded.userId }
            });

            if (!user || user.refreshToken !== headerToken) {
                return res.status(401).json({
                    status: 0,
                    message: response["225"]
                });
            }

            const newAccessToken = generateAccessToken({
                userId: user.userId,
                role: user.role
            });

            return res.status(200).json({
                status: 1,
                message: response["223"],
                data: {
                    accessToken: newAccessToken
                }
            });
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"],
            error: error.message
        });
    }
};

// ─── GET CURRENT USER PROFILE ────────────────────────────────────────────────
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await prisma.user.findUnique({
            where: { userId },
            select: {
                userId: true,
                userName: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            return res.status(404).json({
                status: 0,
                message: response["204"]
            });
        }

        return res.status(200).json({
            status: 1,
            message: response["202"],
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"],
            error: error.message
        });
    }
};

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
export const logout = async (req, res) => {
    try {
        const userId = req.user.userId;

        await prisma.user.update({
            where: { userId },
            data: { refreshToken: null }
        });

        return res.status(200).json({
            status: 1,
            message: response["224"]
        });
    } catch (error) {
        return res.status(500).json({
            status: 0,
            message: response["100"],
            error: error.message
        });
    }
};
