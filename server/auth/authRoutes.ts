import type { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { authService, UserProfile } from './authService';

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 1 week

export function setupAuthMiddleware(app: Express) {
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: SESSION_TTL / 1000,
    tableName: 'sessions',
  });

  const isProd = process.env.NODE_ENV === 'production' || !!process.env.REPLIT_DEPLOYMENT;

  app.set('trust proxy', 1);
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'banana-ads-secret-key-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    name: 'banana.sid',
    cookie: {
      httpOnly: true,
      secure: isProd,
      maxAge: SESSION_TTL,
      sameSite: 'lax',
      path: '/',
    },
  }));
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  authService.getUserById(req.session.userId).then(user => {
    if (user?.isAdmin) {
      return next();
    }
    return res.status(403).json({ message: 'Forbidden - Admin access required' });
  }).catch(() => {
    return res.status(500).json({ message: 'Server error' });
  });
}

export function registerAuthRoutes(app: Express) {
  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    try {
      const { email, password, name, businessType, jobRole, phoneNumber } = req.body;

      if (!email || !password || !name || !businessType || !jobRole) {
        return res.status(400).json({ 
          message: 'Email, password, name, business type, and job role are required' 
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      const user = await authService.signup({
        email,
        password,
        name,
        businessType,
        jobRole,
        phoneNumber,
      });

      req.session.userId = user.id;
      
      res.status(201).json(user);
    } catch (error: any) {
      console.error('Signup error:', error);
      res.status(400).json({ message: error.message || 'Signup failed' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await authService.login({ email, password });

      req.session.userId = user.id;

      res.json(user);
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(401).json({ message: error.message || 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/me', async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const user = await authService.getUserById(req.session.userId);
      
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: 'User not found' });
      }

      if (user.isActive === false) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: 'Account deactivated' });
      }

      res.json(user);
    } catch (error: any) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user' });
    }
  });

  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await authService.getAllUsers();
      res.json(users);
    } catch (error: any) {
      console.error('Get users error:', error);
      res.status(500).json({ message: 'Failed to get users' });
    }
  });

  app.patch('/api/admin/users/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, businessType, jobRole, phoneNumber, isActive, isAdmin: makeAdmin } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (businessType !== undefined) updateData.businessType = businessType;
      if (jobRole !== undefined) updateData.jobRole = jobRole;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (makeAdmin !== undefined) updateData.isAdmin = makeAdmin;

      const user = await authService.updateUser(id, updateData);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error: any) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  app.post('/api/admin/users/:id/reset-password', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ message: 'New password is required' });
      }

      const success = await authService.resetPassword(id, newPassword);
      
      if (!success) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'Password reset successfully' });
    } catch (error: any) {
      console.error('Reset password error:', error);
      res.status(400).json({ message: error.message || 'Failed to reset password' });
    }
  });

  app.delete('/api/admin/users/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (id === req.session?.userId) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }

      const success = await authService.deleteUser(id);
      
      if (!success) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });
}
