import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

/**
 * Extended Express Request Interface to attach authenticated Supabase user profile
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role: 'GRAND_MASTER' | 'OPERATOR';
    category_id?: string | null;
    full_name?: string;
    [key: string]: any;
  };
}

/**
 * Express Middleware verifying Supabase Auth Bearer Token in HTTP Authorization Header
 * Header format: "Authorization: Bearer <access_token>"
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak: Header Authorization Bearer token tidak ditemukan.',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak: Token autentikasi tidak valid.',
      });
    }

    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak: Token Supabase tidak valid atau telah kadaluarsa.',
        error: error?.message,
      });
    }

    // Retrieve full profile from database 'profiles' table
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, full_name, role, category_id')
      .eq('id', user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email,
      role: (profile?.role as 'GRAND_MASTER' | 'OPERATOR') || 'OPERATOR',
      category_id: profile?.category_id || null,
      full_name: profile?.full_name || profile?.username || user.email || 'Operator AGP',
    };

    next();
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: 'Kesalahan internal server pada proses verifikasi token autentikasi.',
      error: err.message,
    });
  }
}

/**
 * Express Middleware to restrict route access by user role (e.g. 'GRAND_MASTER' or 'OPERATOR')
 */
export function requireRole(allowedRoles: ('GRAND_MASTER' | 'OPERATOR') | ('GRAND_MASTER' | 'OPERATOR')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Akses dilarang: Pengguna belum terautentikasi.',
      });
    }

    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!rolesArray.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses dilarang: Hak akses '${req.user.role}' tidak diizinkan mengakses fungsi ini.`,
      });
    }

    next();
  };
}
