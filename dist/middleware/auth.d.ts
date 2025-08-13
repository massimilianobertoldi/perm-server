import type { Request, Response, NextFunction } from 'express';
export type AuthUser = {
    id: number;
    role: 'ADMIN' | 'STUDENT';
};
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}
export declare function requireAuth(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function requireRole(role: AuthUser['role']): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.d.ts.map