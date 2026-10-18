import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import  pool  from "../db/pool";
import { AppError } from "../utiles/error.utiles";
import { env } from "../config/session";
import { asyncHandler } from "../middleware/asyncHandler"

interface User {
  id: number;
  name: string;
  email: String;
  password_hash: string;
  role: "user" | "admin";
  created_at: Date;
  updated_at: Date;
}


export const login = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    if (!email || email.trim().length === 0)
      throw new AppError("INVALID_CREDENTIALS");

    if (!password || password.trim().length === 0)
      throw new AppError("INVALID_CREDENTIALS");

    if (password.length < 6)
      throw new AppError("PASSWORD_ERROR");

    const normalizeEmail = String(email).trim().toLowerCase();

    const result = await pool.query<User>(
      `
            SELECT *
            FROM users
            WHERE email = $1
            `,
      [normalizeEmail],
    );

    const uesr = result.rows[0];

    if (!uesr) throw new AppError("INVALID_CREDENTIALS");

    const passwordMatch = await bcrypt.compare(password, uesr.password_hash);

    if (!passwordMatch) throw new AppError("INVALID_CREDENTIALS");

    req.session.userId = String(uesr.id);
    req.session.userRole = uesr.role;

    res.status(200).json({
      success: true,
      message: "Login successfully",
      data: {
        uesr: {
          name: uesr.name,
          email: uesr.email,
          role: uesr.role,
        },
      },
    });
  } catch (error) {
    console.error(error);
    throw new AppError("INTERNAL_SERVER_ERROR");
  }
});

export const logout = asyncHandler (async (req: Request, res: Response, next: NextFunction) => {
  req.session.destroy((err) => {
    if (err) return next(new AppError("LOGOUT_ERROR"));

    res.clearCookie("connect.sid", {
      httpOnly: true,
      secure: env.nodeENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  });
});

export const getMe = asyncHandler (async (req: Request, res: Response) => {
  try {
    const userID = req.session.userId;

    if (!userID) throw new AppError("USER_ID_ERROR");

    const result = await pool.query(
      `SELECT 
                id,
                email,
                role,
                created_at
            FROM users
            WHERE id = $1
            `,
      [userID],
    );

    const user = result.rows[0];
    console.log("user", user);

    if (!user) throw new AppError("USER_NOT_FOUND");

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error(error);
    throw new AppError("INTERNAL_SERVER_ERROR");
  }
})

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  if (req.session.userRole !== "admin")
    throw new AppError("ADMIN_ERROR");

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const offset = (page - 1) * limit;

  const [usersResult, countResult] = await Promise.all([
    pool.query<Omit<User, "password_hash">>(
      `SELECT id, email, role, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    ),
    pool.query<{ count: string }>(`SELECT COUNT(*) FROM users`),
  ]);

const total = Number(countResult.rows[0]?.count ?? 0);

  res.status(200).json({
    success: true,
    data: {
      users: usersResult.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
});