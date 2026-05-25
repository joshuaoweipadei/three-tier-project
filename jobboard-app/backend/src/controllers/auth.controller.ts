import { Request, Response, NextFunction } from "express";
import type { AuthRequest, JwtPayload, ApiResponse, IUser } from "../types";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { AppError } from "../middleware/error-handler";

// Register

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, password, role, company } = req.body;

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      throw new AppError("An account with this email already exists.", 409);
    }

    // Employers must provide a company name
    if (role === "employer" && !company?.trim()) {
      throw new AppError("Company name is required for employer accounts.", 422);
    }

    // Prevent self-registration as admin
    if (role === "admin") {
      throw new AppError("Admin accounts cannot be self-registered.", 403);
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role ?? "candidate",
      company: company?.trim(),
    });

    const payload = buildUserPayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: {
        user,
        accessToken,
      },
    } satisfies ApiResponse<{ user: IUser; accessToken: string }>);
  } catch (err) {
    next(err);
  }
}

// Login

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;

    // Explicitly select password — it's excluded by default (select: false)
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      isActive: true,
    }).select("+password");

    // Use a generic message — never reveal whether email exists
    if (!user) {
      throw new AppError("Invalid email or password.", 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError("Invalid email or password.", 401);
    }

    const payload = buildUserPayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    setRefreshTokenCookie(res, refreshToken);

    // Strip password before sending (toJSON handles this but be explicit)
    const userObj = user.toJSON();

    res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      data: {
        user: userObj,
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Refresh Token

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      throw new AppError("No refresh token provided.", 401);
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JwtPayload;
    } catch {
      throw new AppError("Refresh token expired. Please log in again.", 401);
    }

    // Verify user still exists and is active
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw new AppError("Account not found or deactivated.", 401);
    }

    const payload = buildUserPayload(user);
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    // Rotate the refresh token — old one is replaced
    setRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({
      success: true,
      message: "Token refreshed.",
      data: { accessToken: newAccessToken },
    });
  } catch (err) {
    next(err);
  }
}

// Logout

export async function logout(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Clear the httpOnly cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (err) {
    next(err);
  }
}

// Get current user (me)

export async function getMe(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      throw new AppError("User not found.", 404);
    }

    res.status(200).json({
      success: true,
      message: "User retrieved.",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

// Helpers

function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: "15m",
  });
}

function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "7d",
  });
}

function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie("refreshToken", token, {
    httpOnly: true,       // JS cannot read this cookie — XSS protection
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: "strict",   // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: "/api/auth",    // Cookie only sent to auth routes
  });
}

function buildUserPayload(user: IUser): JwtPayload {
  return {
    id: user._id.toString(),
    role: user.role,
    email: user.email,
  };
}