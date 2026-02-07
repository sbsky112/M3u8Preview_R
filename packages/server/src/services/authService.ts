import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { config } from '../config.js';
import { AppError } from '../middleware/errorHandler.js';
import type { TokenPayload, AuthResponse, User } from '@m3u8-preview/shared';

function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.accessExpiresIn } as jwt.SignOptions);
}

function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions);
}

function sanitizeUser(user: any): User {
  const { passwordHash, ...rest } = user;
  return {
    ...rest,
    createdAt: rest.createdAt.toISOString(),
    updatedAt: rest.updatedAt.toISOString(),
  };
}

export const authService = {
  async register(username: string, email: string, password: string): Promise<AuthResponse & { refreshToken: string }> {
    // Check if user exists
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing) {
      throw new AppError(existing.username === username ? '用户名已存在' : '邮箱已存在', 409);
    }

    const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);
    const user = await prisma.user.create({
      data: { username, email, passwordHash },
    });

    const tokenPayload: TokenPayload = { userId: user.id, role: user.role as any };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // M9: 注册也返回 refreshToken，与 login 一致
    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  },

  async login(username: string, password: string): Promise<AuthResponse & { refreshToken: string }> {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new AppError('用户名或密码错误', 401);
    }
    if (!user.isActive) {
      throw new AppError('账户已被禁用', 403);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError('用户名或密码错误', 401);
    }

    const tokenPayload: TokenPayload = { userId: user.id, role: user.role as any };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  },

  async refresh(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify the refresh token
    let payload: TokenPayload;
    try {
      payload = jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }

    // Check if token exists in DB
    const storedToken = await prisma.refreshToken.findUnique({ where: { token } });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      }
      throw new AppError('Refresh token expired', 401);
    }

    // Get fresh user data
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const newPayload: TokenPayload = { userId: user.id, role: user.role as any };
    const accessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(token: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { token } });
  },

  async getProfile(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return sanitizeUser(user);
  },
};
