import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {User} from '../models/user';

export interface AuthRequest extends Request {
  user?: any;
  token?: string;
}

export const isAuthenticated = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Check for token in cookie
    const token = req.cookies.jwt;
    
    if (!token) {
      return res.redirect('/auth/login');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.clearCookie('jwt');
      return res.redirect('/auth/login');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.clearCookie('jwt');
    res.redirect('/auth/login');
  }
};