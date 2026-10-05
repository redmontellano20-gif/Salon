import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";

/* =========================================================
   REGISTER ADMIN
========================================================= */

export const register = async (req: Request, res: Response) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    if (password.length > 72) {
      return res.status(400).json({
        message: "Password must not exceed 72 characters",
      });
    }

    const existingUser = await pool.query(
      `
      SELECT id
      FROM admin_users
      WHERE LOWER(email) = $1
      `,
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "Email already exists",
      });
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

    console.log("Admin account created:", email);

    return res.status(201).json({
      message: "Account created successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/* =========================================================
   LOGIN ADMIN
========================================================= */

export const login = async (req: Request, res: Response) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const password = String(req.body.password || "");

    /* =========================
       VALIDATION
    ========================= */

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    /* =========================
       FIND ADMIN
    ========================= */

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
      console.log("Login failed: admin not found:", email);

      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    console.log("Admin found:", user.email);
    console.log(
      "Password hash length:",
      String(user.password_hash).length
    );

    /* =========================
       CHECK PASSWORD
    ========================= */

    const passwordCorrect = await bcrypt.compare(
      password,
      user.password_hash
    );

    console.log("Password match:", passwordCorrect);

    if (!passwordCorrect) {
      console.log("Login failed: incorrect password");

      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    /* =========================
       JWT SECRET
    ========================= */

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error(
        "JWT_SECRET is missing from server/.env"
      );

      return res.status(500).json({
        message: "Server configuration error",
      });
    }

    /* =========================
       CREATE TOKEN
    ========================= */

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    console.log("Admin login successful:", user.email);

    /* =========================
       RESPONSE
    ========================= */

    return res.status(200).json({
      message: "Login successful",

      token,

      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};