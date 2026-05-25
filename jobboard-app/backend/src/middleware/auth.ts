import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, JwtPayload, UserRole } from "../types";

// Verify JWT and attach user to request
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  // Accept token from Authorization header OR httpOnly cookie
  const authHeader = req.headers.authorization;
  const token =
    (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null) ??
    req.cookies?.accessToken;

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication required. Please log in.",
    });
    return;
  }

  try {
    const secret = process.env.JWT_ACCESS_SECRET!;
    const decoded = jwt.verify(token, secret) as JwtPayload;

    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: "Invalid token. Please log in again.",
    });
  }
};

// Role-based access control
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. This action requires one of: ${roles.join(", ")}`,
      });
      return;
    }

    next();
  };
};