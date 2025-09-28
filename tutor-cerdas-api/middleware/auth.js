import { verifyUser } from '../supabase.js';

export function requireAuth(requiredRole = null) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }

      const token = authHeader.split(' ')[1];
      const user = await verifyUser(token);
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Check role requirement
      if (requiredRole && user.role !== requiredRole) {
        return res.status(403).json({ error: `Access denied. Required role: ${requiredRole}` });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('[Auth middleware]', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  };
}

// Middleware untuk admin only
export const requireAdmin = requireAuth('admin');

// Middleware untuk authenticated users
export const requireUser = requireAuth();