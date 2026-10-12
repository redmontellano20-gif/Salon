import "dotenv/config";

import express from "express";
import type { Request, Response } from "express";

import cors from "cors";
import rateLimit from "express-rate-limit";

import pool from "./db.js";

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

// CORS

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://salon-sigma-ashy.vercel.app",
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(
    process.env.FRONTEND_URL.replace(/\/$/, "")
  );
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
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
  })
);

app.use(express.json({ limit: "1mb" }));

// HEALTH CHECK

app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Salon API is working!",
  });
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
  });
});

// PUBLIC SETTINGS

app.get("/api/settings", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT key, value FROM settings ORDER BY key"
    );

    const settings: Record<string, string> = {};

    for (const row of result.rows) {
      settings[row.key] = row.value ?? "";
    }

    res.setHeader(
      "Cache-Control",
      "public, max-age=0, s-maxage=30, stale-while-revalidate=60"
    );

    res.json(settings);
  } catch (error) {
    console.error("Settings error:", error);

    res.status(500).json({
      message: "Failed to load settings.",
    });
  }
});

// PUBLIC SERVICES

app.get("/api/services", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.title,
        c.note,
        c.sort_order,
        COALESCE(
          json_agg(
            json_build_object(
              'id', s.id,
              'name', s.name,
              'detail', s.detail,
              'price', s.price,
              'sort_order', s.sort_order,
              'is_active', s.is_active
            )
            ORDER BY s.sort_order, s.id
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM service_categories c
      LEFT JOIN services s
        ON s.category_id = c.id
        AND s.is_active = true
      GROUP BY
        c.id,
        c.title,
        c.note,
        c.sort_order
      ORDER BY c.sort_order, c.id
    `);

    res.setHeader(
      "Cache-Control",
      "public, max-age=0, s-maxage=30, stale-while-revalidate=60"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Services error:", error);

    res.status(500).json({
      message: "Failed to load services.",
    });
  }
});

// PUBLIC GALLERY

app.get("/api/gallery", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, url, alt, sort_order
      FROM gallery_images
      ORDER BY sort_order ASC, id ASC
    `);

    const gallery = result.rows.map((image) => ({
      id: image.id,
      url: image.url,
      src: image.url,
      alt: image.alt ?? "",
      sort_order: image.sort_order,
    }));

    res.setHeader(
      "Cache-Control",
      "public, max-age=0, s-maxage=30, stale-while-revalidate=60"
    );

    res.json(gallery);
  } catch (error) {
    console.error("Gallery error:", error);

    res.status(500).json({
      message: "Failed to load gallery.",
    });
  }
});

// BOOKING RATE LIMIT

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    message:
      "Too many booking requests. Please wait 15 minutes.",
  },
});

// PUBLIC BOOKING

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
      } = req.body ?? {};

      const cleanName = String(name ?? "").trim();
      const cleanEmail = String(email ?? "")
        .trim()
        .toLowerCase();
      const cleanPhone = String(phone ?? "").trim();
      const cleanService = String(service ?? "").trim();
      const cleanNotes = String(notes ?? "").trim();

      if (
        cleanName.length < 2 ||
        cleanName.length > 100
      ) {
        res.status(400).json({
          message: "Please enter a valid name.",
        });
        return;
      }

      if (
        cleanEmail.length > 200 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
      ) {
        res.status(400).json({
          message: "Please enter a valid email.",
        });
        return;
      }

      if (
        cleanPhone.length > 30 ||
        cleanService.length > 150 ||
        cleanNotes.length > 1000
      ) {
        res.status(400).json({
          message: "One or more fields are too long.",
        });
        return;
      }

      let bookingDate: string | null = null;

      if (preferred_date) {
        const date = String(preferred_date);

        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          Number.isNaN(Date.parse(date))
        ) {
          res.status(400).json({
            message: "Invalid booking date.",
          });
          return;
        }

        bookingDate = date;
      }

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
        VALUES ($1, $2, $3, $4, $5, $6, 'new')
        RETURNING *
        `,
        [
          cleanName,
          cleanEmail,
          cleanPhone,
          cleanService,
          bookingDate,
          cleanNotes,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Booking error:", error);

      res.status(500).json({
        message: "Failed to create booking.",
      });
    }
  }
);

// AUTH

app.use("/api/auth", authRoutes);

// ADMIN

app.use("/api/admin", adminRoutes);

// 404

app.use((req: Request, res: Response) => {
  res.status(404).json({
    message:
      `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// EXPORT FOR VERCEL

export default app;

// LOCAL DEVELOPMENT ONLY

if (process.env.VERCEL !== "1") {
  const PORT = Number(process.env.PORT) || 5000;

  app.listen(PORT, () => {
    console.log(`Salon API running on port ${PORT}`);
  });
}