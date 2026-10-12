
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET must contain at least 32 characters."
    );
  }

  return secret;
};

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/* =========================================
   REGISTER ADMIN
========================================= */

export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();

    const password = String(req.body?.password ?? "");

    if (!isValidEmail(email) || email.length > 200) {
      res.status(400).json({
        message: "Please enter a valid email address.",
      });
      return;
    }

    if (password.length < 8 || password.length > 72) {
      res.status(400).json({
        message:
          "Password must be between 8 and 72 characters.",
      });
      return;
    }

    const existingUser = await pool.query(
      `
      SELECT id
      FROM admin_users
      WHERE LOWER(email) = $1
      LIMIT 1
      `,
      [email]
    );

    if (existingUser.rows.length > 0) {
      res.status(409).json({
        message: "Email already exists.",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `
      INSERT INTO admin_users (
        email,
        password_hash
      )
      VALUES ($1, $2)
      RETURNING id, email, created_at
      `,
      [email, passwordHash]
    );

    res.status(201).json({
      message: "Account created successfully.",
      user: result.rows[0],
    });
  } catch (error: unknown) {
    const databaseError = error as {
      code?: string;
    };

    if (databaseError.code === "23505") {
      res.status(409).json({
        message: "Email already exists.",
      });
      return;
    }

    console.error("Admin registration error:", error);

    res.status(500).json({
      message: "Failed to create admin account.",
    });
  }
};

/* =========================================
   LOGIN ADMIN
========================================= */

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const email = String(req.body?.email ?? "")
      .trim()
      .toLowerCase();

    const password = String(req.body?.password ?? "");

    if (!email || !password) {
      res.status(400).json({
        message: "Email and password are required.",
      });
      return;
    }

    if (!isValidEmail(email) || email.length > 200) {
      res.status(400).json({
        message: "Please enter a valid email address.",
      });
      return;
    }

    const result = await pool.query(
      `
      SELECT
        id,
        email,
        password_hash
      FROM admin_users
      WHERE LOWER(email) = $1
      LIMIT 1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        message: "Invalid email or password.",
      });
      return;
    }

    const user = result.rows[0];

    const passwordCorrect = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordCorrect) {
      res.status(401).json({
        message: "Invalid email or password.",
      });
      return;
    }

    const jwtSecret = getJwtSecret();

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      jwtSecret,
      {
        algorithm: "HS256",
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    res.status(500).json({
      message: "Unable to sign in. Please try again.",
    });
  }
};
