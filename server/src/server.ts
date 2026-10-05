import "dotenv/config";

import express from "express";
import type { Request, Response } from "express";

import cors from "cors";
import rateLimit from "express-rate-limit";

import pool from "./db.js";

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();

/* =========================================
   CORS
========================================= */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://salon-sigma-ashy.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // such as server-to-server requests and API testing.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      console.warn("Blocked by CORS:", origin);

      callback(new Error("Not allowed by CORS"));
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    credentials: true,
  })
);

/* =========================================
   JSON
========================================= */

app.use(express.json());

/* =========================================
   TEST
========================================= */

app.get(
  "/",
  (_req: Request, res: Response) => {
    res.json({
      message: "Salon API is working!",
    });
  }
);

/* =========================================
   PUBLIC SETTINGS
========================================= */

app.get(
  "/api/settings",
  async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT key, value
        FROM settings
        ORDER BY key
      `);

      const settings: Record<string, string> = {};

      for (const row of result.rows) {
        settings[row.key] = row.value ?? "";
      }

      res.json(settings);
    } catch (error) {
      console.error(
        "GET /api/settings error:",
        error
      );

      res.status(500).json({
        message: "Failed to load settings.",
      });
    }
  }
);

/* =========================================
   PUBLIC SERVICES
========================================= */

app.get(
  "/api/services",
  async (_req: Request, res: Response) => {
    try {
      const categories = await pool.query(`
        SELECT *
        FROM service_categories
        ORDER BY sort_order ASC, id ASC
      `);

      const services = await pool.query(`
        SELECT *
        FROM services
        WHERE is_active = true
        ORDER BY sort_order ASC, id ASC
      `);

      const data = categories.rows.map(
        (category) => ({
          ...category,

          items: services.rows.filter(
            (service) =>
              service.category_id === category.id
          ),
        })
      );

      res.json(data);
    } catch (error) {
      console.error(
        "GET /api/services error:",
        error
      );

      res.status(500).json({
        message: "Failed to load services.",
      });
    }
  }
);

/* =========================================
   PUBLIC GALLERY
========================================= */

app.get(
  "/api/gallery",
  async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT
          id,
          url,
          alt,
          sort_order
        FROM gallery_images
        ORDER BY sort_order ASC, id ASC
      `);

      const gallery = result.rows.map(
        (image) => ({
          id: image.id,

          url: image.url,

          src: image.url,

          alt: image.alt ?? "",

          sort_order: image.sort_order,
        })
      );

      res.json(gallery);
    } catch (error) {
      console.error(
        "GET /api/gallery error:",
        error
      );

      res.status(500).json({
        message: "Failed to load gallery.",
      });
    }
  }
);

/* =========================================
   BOOKING RATE LIMIT
========================================= */

/*
   Maximum:
   5 booking requests
   every 15 minutes
   from the same IP address.
*/

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 5,

  standardHeaders: "draft-7",

  legacyHeaders: false,

  message: {
    message:
      "Too many booking requests. Please wait 15 minutes and try again.",
  },
});

/* =========================================
   PUBLIC BOOKING
========================================= */

app.post(
  "/api/bookings",

  bookingLimiter,

  async (req: Request, res: Response) => {
    try {
      const {
        name,
        email,
        phone,
        service,
        preferred_date,
        notes,
      } = req.body;

      /* =====================================
         REQUIRED FIELDS
      ===================================== */

      if (!name || !email) {
        res.status(400).json({
          message: "Name and email are required.",
        });

        return;
      }

      /* =====================================
         CLEAN VALUES
      ===================================== */

      const cleanName = String(name).trim();

      const cleanEmail = String(email)
        .trim()
        .toLowerCase();

      const cleanPhone = String(
        phone || ""
      ).trim();

      const cleanService = String(
        service || ""
      ).trim();

      const cleanNotes = String(
        notes || ""
      ).trim();

      /* =====================================
         VALIDATE EMPTY VALUES
      ===================================== */

      if (cleanName.length < 2) {
        res.status(400).json({
          message: "Please enter a valid name.",
        });

        return;
      }

      /* =====================================
         EMAIL VALIDATION
      ===================================== */

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(cleanEmail)) {
        res.status(400).json({
          message:
            "Please enter a valid email address.",
        });

        return;
      }

      /* =====================================
         LENGTH LIMITS
      ===================================== */

      if (cleanName.length > 100) {
        res.status(400).json({
          message: "Name is too long.",
        });

        return;
      }

      if (cleanEmail.length > 200) {
        res.status(400).json({
          message: "Email is too long.",
        });

        return;
      }

      if (cleanPhone.length > 30) {
        res.status(400).json({
          message: "Phone number is too long.",
        });

        return;
      }

      if (cleanService.length > 150) {
        res.status(400).json({
          message: "Service is too long.",
        });

        return;
      }

      if (cleanNotes.length > 1000) {
        res.status(400).json({
          message:
            "Notes must be 1000 characters or less.",
        });

        return;
      }

      /* =====================================
         INSERT BOOKING
      ===================================== */

      const result = await pool.query(
        `
        INSERT INTO bookings (
          name,
          email,
          phone,
          service,
          preferred_date,
          notes,
          status
        )

        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          'new'
        )

        RETURNING *
        `,
        [
          cleanName,
          cleanEmail,
          cleanPhone,
          cleanService,

          preferred_date || null,

          cleanNotes,
        ]
      );

      /* =====================================
         SUCCESS
      ===================================== */

      res.status(201).json(
        result.rows[0]
      );
    } catch (error) {
      console.error(
        "POST /api/bookings error:",
        error
      );

      res.status(500).json({
        message: "Failed to create booking.",
      });
    }
  }
);

/* =========================================
   AUTH
========================================= */

app.use(
  "/api/auth",
  authRoutes
);

/* =========================================
   ADMIN
========================================= */

app.use(
  "/api/admin",
  adminRoutes
);

/* =========================================
   404
========================================= */

app.use(
  (req: Request, res: Response) => {
    res.status(404).json({
      message:
        `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);

/* =========================================
   START SERVER
========================================= */

const PORT =
  Number(process.env.PORT) || 5000;

app.listen(
  PORT,
  () => {
    console.log(
      `Salon API running on port ${PORT}`
    );
  }
);