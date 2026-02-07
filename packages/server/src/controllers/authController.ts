import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, email, password } = req.body;
      const { refreshToken, ...result } = await authService.register(username, email, password);

      // M9: 注册也设置 refreshToken cookie，避免需要二次登录
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/v1/auth',
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const { refreshToken, ...result } = await authService.login(username, password);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/v1/auth',
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken || req.body.refreshToken;
      if (!token) {
        res.status(401).json({ success: false, error: 'No refresh token provided' });
        return;
      }

      const { accessToken, refreshToken: newRefreshToken } = await authService.refresh(token);

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/v1/auth',
      });

      res.json({ success: true, data: { accessToken } });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken;
      if (token) {
        await authService.logout(token);
      }

      res.clearCookie('refreshToken', { path: '/api/v1/auth' });
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.user!.userId);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },
};
