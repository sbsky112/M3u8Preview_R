import { Request, Response, NextFunction } from 'express';

type AsyncRequestHandler = (req: Request<any, any, any, any>, res: Response, next: NextFunction) => Promise<void>;

/**
 * 包装异步路由处理函数，自动将 rejected Promise 转发到 Express 错误处理中间件。
 * 消除 controller 中的 try/catch 样板代码。
 */
export const asyncHandler = (fn: AsyncRequestHandler) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
