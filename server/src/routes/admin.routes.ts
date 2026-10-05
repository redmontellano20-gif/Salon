import { Router } from "express";
import type {
  Request,
  Response,
  NextFunction,
} from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import pool from "../db.js";

const router = Router();

/* =========================================
   TYPES
========================================= */

interface AdminPayload {
  id: number;
  email: string;
}

/* =========================================
   SUPABASE
========================================= */

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(
        supabaseUrl,
        supabaseServiceKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )
    : null;

/* =========================================
   MULTER
========================================= */

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 8 * 1024 * 1024,
  },

  fileFilter: (
    _req,
    file,
    callback
  ) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
    ];

    if (!allowed.includes(file.mimetype)) {
      return callback(
        new Error(
          "Only JPG, PNG, WebP, GIF and AVIF images are allowed"
        )
      );
    }

    callback(null, true);
  },
});

/* =========================================
   ADMIN AUTH MIDDLEWARE
========================================= */

function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization =
    req.headers.authorization;

  if (
    !authorization?.startsWith(
      "Bearer "
    )
  ) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const token =
    authorization.substring(7);

  const secret =
    process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({
      message:
        "JWT_SECRET is not configured",
    });
  }

  try {
    jwt.verify(
      token,
      secret
    ) as AdminPayload;

    next();
  } catch {
    return res.status(401).json({
      message:
        "Invalid or expired token",
    });
  }
}

router.use(requireAdmin);

/* =========================================
   CHECK ADMIN LOGIN
========================================= */

router.get(
  "/me",
  async (
    _req: Request,
    res: Response
  ) => {
    return res.json({
      authenticated: true,
    });
  }
);

/* =========================================
   DASHBOARD STATS
========================================= */

router.get(
  "/stats",
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const [
        totalBookings,
        newBookings,
        services,
        gallery,
      ] = await Promise.all([
        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM bookings
        `),

        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM bookings
          WHERE status = 'new'
        `),

        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM services
        `),

        pool.query(`
          SELECT COUNT(*)::int AS count
          FROM gallery_images
        `),
      ]);

      return res.json({
        totalBookings:
          totalBookings.rows[0].count,

        newBookings:
          newBookings.rows[0].count,

        services:
          services.rows[0].count,

        gallery:
          gallery.rows[0].count,
      });
    } catch (error) {
      console.error(
        "Stats error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load dashboard stats",
      });
    }
  }
);

/* =========================================
   BOOKINGS - GET
========================================= */

router.get(
  "/bookings",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const status =
        typeof req.query.status ===
        "string"
          ? req.query.status
          : "";

      if (status) {
        const result =
          await pool.query(
            `
              SELECT *
              FROM bookings
              WHERE status = $1
              ORDER BY created_at DESC
            `,
            [status]
          );

        return res.json(
          result.rows
        );
      }

      const result =
        await pool.query(`
          SELECT *
          FROM bookings
          ORDER BY created_at DESC
        `);

      return res.json(
        result.rows
      );
    } catch (error) {
      console.error(
        "Bookings error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load bookings",
      });
    }
  }
);

/* =========================================
   BOOKINGS - UPDATE STATUS
========================================= */

router.patch(
  "/bookings/:id/status",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id = Number(
        req.params.id
      );

      const { status } =
        req.body;

      if (
        !Number.isInteger(id)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid booking ID",
          });
      }

      if (
        ![
          "new",
          "confirmed",
          "archived",
        ].includes(status)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid booking status",
          });
      }

      const result =
        await pool.query(
          `
            UPDATE bookings
            SET status = $1
            WHERE id = $2
            RETURNING *
          `,
          [status, id]
        );

      if (
        result.rows.length === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "Booking not found",
          });
      }

      return res.json(
        result.rows[0]
      );
    } catch (error) {
      console.error(
        "Update booking error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to update booking",
        });
    }
  }
);

/* =========================================
   BOOKINGS - DELETE
========================================= */

router.delete(
  "/bookings/:id",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id = Number(
        req.params.id
      );

      if (
        !Number.isInteger(id)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid booking ID",
          });
      }

      const result =
        await pool.query(
          `
            DELETE FROM bookings
            WHERE id = $1
            RETURNING id
          `,
          [id]
        );

      if (
        result.rows.length === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "Booking not found",
          });
      }

      return res.json({
        ok: true,
      });
    } catch (error) {
      console.error(
        "Delete booking error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to delete booking",
        });
    }
  }
);

/* =========================================
   SERVICES - TREE
========================================= */

router.get(
  "/services/tree",
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const categoriesResult =
        await pool.query(`
          SELECT
            id,
            title,
            note,
            sort_order
          FROM service_categories
          ORDER BY sort_order ASC, id ASC
        `);

      const servicesResult =
        await pool.query(`
          SELECT
            id,
            category_id,
            name,
            detail,
            price,
            sort_order,
            is_active
          FROM services
          ORDER BY sort_order ASC, id ASC
        `);

      const groups =
        categoriesResult.rows.map(
          (category) => ({
            id: category.id,
            title:
              category.title,
            note:
              category.note ??
              "",
            sort_order:
              category.sort_order,

            items:
              servicesResult.rows
                .filter(
                  (service) =>
                    service.category_id ===
                    category.id
                )
                .map(
                  (service) => ({
                    id: service.id,
                    name:
                      service.name,

                    detail:
                      service.detail ??
                      "",

                    price: String(
                      service.price ??
                        ""
                    ),

                    sort_order:
                      service.sort_order,

                    is_active:
                      service.is_active,
                  })
                ),
          })
        );

      return res.json(
        groups
      );
    } catch (error) {
      console.error(
        "Admin services error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to load services",
        });
    }
  }
);

/* =========================================
   CATEGORIES - CREATE
========================================= */

router.post(
  "/categories",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const title =
        typeof req.body.title ===
        "string"
          ? req.body.title.trim()
          : "";

      const note =
        typeof req.body.note ===
        "string"
          ? req.body.note.trim()
          : "";

      if (!title) {
        return res
          .status(400)
          .json({
            message:
              "Category title is required",
          });
      }

      const orderResult =
        await pool.query(`
          SELECT
            COALESCE(MAX(sort_order), 0) + 1
            AS next_order
          FROM service_categories
        `);

      const nextOrder =
        Number(
          orderResult.rows[0]
            .next_order
        ) || 1;

      const result =
        await pool.query(
          `
            INSERT INTO service_categories
              (title, note, sort_order)
            VALUES
              ($1, $2, $3)
            RETURNING *
          `,
          [
            title,
            note,
            nextOrder,
          ]
        );

      return res
        .status(201)
        .json(
          result.rows[0]
        );
    } catch (error) {
      console.error(
        "Create category error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to create category",
        });
    }
  }
);

/* =========================================
   CATEGORIES - UPDATE
========================================= */

router.patch(
  "/categories/:id",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id = Number(
        req.params.id
      );

      if (
        !Number.isInteger(id)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid category ID",
          });
      }

      const current =
        await pool.query(
          `
            SELECT *
            FROM service_categories
            WHERE id = $1
          `,
          [id]
        );

      if (
        current.rows.length === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "Category not found",
          });
      }

      const oldCategory =
        current.rows[0];

      const title =
        typeof req.body.title ===
        "string"
          ? req.body.title.trim()
          : oldCategory.title;

      const note =
        typeof req.body.note ===
        "string"
          ? req.body.note.trim()
          : oldCategory.note;

      if (!title) {
        return res
          .status(400)
          .json({
            message:
              "Category title is required",
          });
      }

      const result =
        await pool.query(
          `
            UPDATE service_categories
            SET
              title = $1,
              note = $2
            WHERE id = $3
            RETURNING *
          `,
          [
            title,
            note,
            id,
          ]
        );

      return res.json(
        result.rows[0]
      );
    } catch (error) {
      console.error(
        "Update category error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to update category",
        });
    }
  }
);

/* =========================================
   CATEGORIES - DELETE
========================================= */

router.delete(
  "/categories/:id",
  async (
    req: Request,
    res: Response
  ) => {
    const client =
      await pool.connect();

    try {
      const id = Number(
        req.params.id
      );

      if (
        !Number.isInteger(id)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid category ID",
          });
      }

      await client.query(
        "BEGIN"
      );

      const category =
        await client.query(
          `
            SELECT id
            FROM service_categories
            WHERE id = $1
          `,
          [id]
        );

      if (
        category.rows.length ===
        0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res
          .status(404)
          .json({
            message:
              "Category not found",
          });
      }

      await client.query(
        `
          DELETE FROM services
          WHERE category_id = $1
        `,
        [id]
      );

      await client.query(
        `
          DELETE FROM service_categories
          WHERE id = $1
        `,
        [id]
      );

      await client.query(
        "COMMIT"
      );

      return res.json({
        ok: true,
      });
    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      console.error(
        "Delete category error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to delete category",
        });
    } finally {
      client.release();
    }
  }
);

/* =========================================
   SERVICES - CREATE
========================================= */

router.post(
  "/services",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const categoryId =
        Number(
          req.body.category_id
        );

      const name =
        typeof req.body.name ===
        "string"
          ? req.body.name.trim()
          : "";

      const detail =
        typeof req.body.detail ===
        "string"
          ? req.body.detail.trim()
          : "";

      const price = Number(
        req.body.price
      );

      if (
        !Number.isInteger(
          categoryId
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid category",
          });
      }

      if (!name) {
        return res
          .status(400)
          .json({
            message:
              "Service name is required",
          });
      }

      if (
        !Number.isFinite(
          price
        ) ||
        price < 0
      ) {
        return res
          .status(400)
          .json({
            message:
              "Enter a valid price",
          });
      }

      const categoryResult =
        await pool.query(
          `
            SELECT id
            FROM service_categories
            WHERE id = $1
          `,
          [categoryId]
        );

      if (
        categoryResult.rows
          .length === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "Category not found",
          });
      }

      const orderResult =
        await pool.query(
          `
            SELECT
              COALESCE(MAX(sort_order), 0) + 1
              AS next_order
            FROM services
            WHERE category_id = $1
          `,
          [categoryId]
        );

      const nextOrder =
        Number(
          orderResult.rows[0]
            .next_order
        ) || 1;

      const result =
        await pool.query(
          `
            INSERT INTO services
              (
                category_id,
                name,
                detail,
                price,
                sort_order,
                is_active
              )
            VALUES
              ($1, $2, $3, $4, $5, true)
            RETURNING *
          `,
          [
            categoryId,
            name,
            detail,
            price,
            nextOrder,
          ]
        );

      return res
        .status(201)
        .json(
          result.rows[0]
        );
    } catch (error) {
      console.error(
        "Create service error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to create service",
        });
    }
  }
);

/* =========================================
   SERVICES - UPDATE
========================================= */

router.patch(
  "/services/:id",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id = Number(
        req.params.id
      );

      if (
        !Number.isInteger(id)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid service ID",
          });
      }

      const current =
        await pool.query(
          `
            SELECT *
            FROM services
            WHERE id = $1
          `,
          [id]
        );

      if (
        current.rows.length === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "Service not found",
          });
      }

      const oldService =
        current.rows[0];

      const name =
        typeof req.body.name ===
        "string"
          ? req.body.name.trim()
          : oldService.name;

      const detail =
        typeof req.body.detail ===
        "string"
          ? req.body.detail.trim()
          : oldService.detail;

      const price =
        req.body.price !==
        undefined
          ? Number(
              req.body.price
            )
          : Number(
              oldService.price
            );

      const isActive =
        typeof req.body
          .is_active ===
        "boolean"
          ? req.body.is_active
          : oldService.is_active;

      if (!name) {
        return res
          .status(400)
          .json({
            message:
              "Service name is required",
          });
      }

      if (
        !Number.isFinite(
          price
        ) ||
        price < 0
      ) {
        return res
          .status(400)
          .json({
            message:
              "Enter a valid price",
          });
      }

      const result =
        await pool.query(
          `
            UPDATE services
            SET
              name = $1,
              detail = $2,
              price = $3,
              is_active = $4
            WHERE id = $5
            RETURNING *
          `,
          [
            name,
            detail,
            price,
            isActive,
            id,
          ]
        );

      return res.json(
        result.rows[0]
      );
    } catch (error) {
      console.error(
        "Update service error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to update service",
        });
    }
  }
);

/* =========================================
   SERVICES - DELETE
========================================= */

router.delete(
  "/services/:id",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id = Number(
        req.params.id
      );

      if (
        !Number.isInteger(id)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid service ID",
          });
      }

      const result =
        await pool.query(
          `
            DELETE FROM services
            WHERE id = $1
            RETURNING id
          `,
          [id]
        );

      if (
        result.rows.length === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "Service not found",
          });
      }

      return res.json({
        ok: true,
      });
    } catch (error) {
      console.error(
        "Delete service error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to delete service",
        });
    }
  }
);

/* =========================================
   SETTINGS - GET
========================================= */

router.get(
  "/settings",
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const result =
        await pool.query(`
          SELECT key, value
          FROM settings
          ORDER BY key ASC
        `);

      const settings: Record<
        string,
        string
      > = {};

      for (
        const row of result.rows
      ) {
        settings[row.key] =
          row.value ?? "";
      }

      return res.json(
        settings
      );
    } catch (error) {
      console.error(
        "Admin settings error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to load settings",
        });
    }
  }
);

/* =========================================
   SETTINGS - SAVE
========================================= */

router.put(
  "/settings",
  async (
    req: Request,
    res: Response
  ) => {
    const client =
      await pool.connect();

    try {
      const settings =
        req.body;

      if (
        !settings ||
        typeof settings !==
          "object" ||
        Array.isArray(settings)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid settings data",
          });
      }

      await client.query(
        "BEGIN"
      );

      for (
        const [
          key,
          value,
        ] of Object.entries(
          settings
        )
      ) {
        await client.query(
          `
            INSERT INTO settings
              (key, value)
            VALUES
              ($1, $2)
            ON CONFLICT (key)
            DO UPDATE SET
              value = EXCLUDED.value
          `,
          [
            key,
            String(value ?? ""),
          ]
        );
      }

      await client.query(
        "COMMIT"
      );

      const result =
        await client.query(`
          SELECT key, value
          FROM settings
          ORDER BY key ASC
        `);

      const updated: Record<
        string,
        string
      > = {};

      for (
        const row of result.rows
      ) {
        updated[row.key] =
          row.value ?? "";
      }

      return res.json(
        updated
      );
    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      console.error(
        "Save settings error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to save settings",
        });
    } finally {
      client.release();
    }
  }
);

/* =========================================
   GALLERY - GET ALL
========================================= */

router.get(
  "/gallery",
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const result =
        await pool.query(`
          SELECT
            id,
            url,
            alt,
            sort_order,
            created_at
          FROM gallery_images
          ORDER BY sort_order ASC, id ASC
        `);

      return res.json(
        result.rows
      );
    } catch (error) {
      console.error(
        "Admin gallery error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to load gallery",
        });
    }
  }
);

/* =========================================
   GALLERY - UPLOAD IMAGE
========================================= */

router.post(
  "/gallery",
  upload.single("image"),
  async (
    req: Request,
    res: Response
  ) => {
    try {
      if (!supabase) {
        return res
          .status(500)
          .json({
            message:
              "Supabase is not configured. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
          });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({
            message:
              "Please select an image",
          });
      }

      const alt =
        typeof req.body.alt ===
        "string"
          ? req.body.alt.trim()
          : "";

      const extension =
        req.file.originalname
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "jpg";

      const safeExtension =
        extension.replace(
          /[^a-z0-9]/g,
          ""
        ) || "jpg";

      const fileName =
        `${Date.now()}-${Math.random()
          .toString(36)
          .substring(
            2,
            10
          )}.${safeExtension}`;

      const filePath =
        `uploads/${fileName}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from("gallery")
        .upload(
          filePath,
          req.file.buffer,
          {
            contentType:
              req.file
                .mimetype,

            upsert: false,
          }
        );

      if (uploadError) {
        console.error(
          "Supabase upload error:",
          uploadError
        );

        return res
          .status(500)
          .json({
            message:
              uploadError.message,
          });
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("gallery")
        .getPublicUrl(
          filePath
        );

      const publicUrl =
        publicUrlData.publicUrl;

      const orderResult =
        await pool.query(`
          SELECT
            COALESCE(MAX(sort_order), 0) + 1
            AS next_order
          FROM gallery_images
        `);

      const nextOrder =
        Number(
          orderResult.rows[0]
            .next_order
        ) || 1;

      try {
        const result =
          await pool.query(
            `
              INSERT INTO gallery_images
                (
                  url,
                  alt,
                  sort_order
                )
              VALUES
                ($1, $2, $3)
              RETURNING *
            `,
            [
              publicUrl,
              alt,
              nextOrder,
            ]
          );

        return res
          .status(201)
          .json(
            result.rows[0]
          );
      } catch (
        databaseError
      ) {
        await supabase.storage
          .from("gallery")
          .remove([
            filePath,
          ]);

        throw databaseError;
      }
    } catch (error) {
      console.error(
        "Gallery upload error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to upload image",
        });
    }
  }
);

/* =========================================
   GALLERY - UPDATE
========================================= */

router.patch(
  "/gallery/:id",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id = Number(
        req.params.id
      );

      if (
        !Number.isInteger(id)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid gallery ID",
          });
      }

      const current =
        await pool.query(
          `
            SELECT *
            FROM gallery_images
            WHERE id = $1
          `,
          [id]
        );

      if (
        current.rows.length === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "Gallery image not found",
          });
      }

      const oldImage =
        current.rows[0];

      const alt =
        typeof req.body.alt ===
        "string"
          ? req.body.alt.trim()
          : oldImage.alt;

      const sortOrder =
        Number.isInteger(
          req.body.sort_order
        )
          ? req.body.sort_order
          : oldImage.sort_order;

      const result =
        await pool.query(
          `
            UPDATE gallery_images
            SET
              alt = $1,
              sort_order = $2
            WHERE id = $3
            RETURNING *
          `,
          [
            alt,
            sortOrder,
            id,
          ]
        );

      return res.json(
        result.rows[0]
      );
    } catch (error) {
      console.error(
        "Gallery update error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to update gallery image",
        });
    }
  }
);

/* =========================================
   GALLERY - DELETE
========================================= */

router.delete(
  "/gallery/:id",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id = Number(
        req.params.id
      );

      if (
        !Number.isInteger(id)
      ) {
        return res
          .status(400)
          .json({
            message:
              "Invalid gallery ID",
          });
      }

      const imageResult =
        await pool.query(
          `
            SELECT *
            FROM gallery_images
            WHERE id = $1
          `,
          [id]
        );

      if (
        imageResult.rows
          .length === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "Gallery image not found",
          });
      }

      const image =
        imageResult.rows[0];

      if (
        supabase &&
        image.url
      ) {
        try {
          const marker =
            "/storage/v1/object/public/gallery/";

          const position =
            image.url.indexOf(
              marker
            );

          if (
            position !== -1
          ) {
            const filePath =
              decodeURIComponent(
                image.url.substring(
                  position +
                    marker.length
                )
              );

            const {
              error:
                storageError,
            } =
              await supabase.storage
                .from(
                  "gallery"
                )
                .remove([
                  filePath,
                ]);

            if (
              storageError
            ) {
              console.error(
                "Supabase delete warning:",
                storageError
              );
            }
          }
        } catch (
          storageError
        ) {
          console.error(
            "Storage delete warning:",
            storageError
          );
        }
      }

      const result =
        await pool.query(
          `
            DELETE FROM gallery_images
            WHERE id = $1
            RETURNING id
          `,
          [id]
        );

      return res.json({
        ok: true,
        id: result.rows[0].id,
      });
    } catch (error) {
      console.error(
        "Gallery delete error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Failed to delete gallery image",
        });
    }
  }
);

/* =========================================
   HELPER - SETTINGS IMAGE UPLOAD
========================================= */

async function uploadSettingsImage(
  req: Request,
  res: Response,

  settingKey:
    | "hero_image"
    | "about_image"
    | "about_small_image",

  folder:
    | "hero"
    | "about"
    | "about-small",

  label: string
) {
  try {
    if (!supabase) {
      return res
        .status(500)
        .json({
          message:
            "Supabase is not configured. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
        });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({
          message:
            "Please select an image.",
        });
    }

    const extension =
      req.file.originalname
        .split(".")
        .pop()
        ?.toLowerCase() ||
      "jpg";

    const safeExtension =
      extension.replace(
        /[^a-z0-9]/g,
        ""
      ) || "jpg";

    const fileName =
      `${folder}-${Date.now()}-${Math.random()
        .toString(36)
        .substring(
          2,
          10
        )}.${safeExtension}`;

    const filePath =
      `${folder}/${fileName}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("gallery")
      .upload(
        filePath,
        req.file.buffer,
        {
          contentType:
            req.file.mimetype,

          upsert: false,
        }
      );

    if (uploadError) {
      console.error(
        `${label} upload error:`,
        uploadError
      );

      return res
        .status(500)
        .json({
          message:
            uploadError.message ||
            `Failed to upload ${label.toLowerCase()} image.`,
        });
    }

    const {
      data: publicUrlData,
    } = supabase.storage
      .from("gallery")
      .getPublicUrl(
        filePath
      );

    const publicUrl =
      publicUrlData.publicUrl;

    if (!publicUrl) {
      await supabase.storage
        .from("gallery")
        .remove([
          filePath,
        ]);

      return res
        .status(500)
        .json({
          message:
            "Couldn't create the public image URL.",
        });
    }

    const oldResult =
      await pool.query(
        `
          SELECT value
          FROM settings
          WHERE key = $1
        `,
        [settingKey]
      );

    const oldUrl =
      oldResult.rows[0]
        ?.value ?? "";

    try {
      await pool.query(
        `
          INSERT INTO settings
            (key, value)
          VALUES
            ($1, $2)
          ON CONFLICT (key)
          DO UPDATE SET
            value = EXCLUDED.value
        `,
        [
          settingKey,
          publicUrl,
        ]
      );
    } catch (
      databaseError
    ) {
      await supabase.storage
        .from("gallery")
        .remove([
          filePath,
        ]);

      throw databaseError;
    }

    /*
     * Delete the previous image from
     * Supabase Storage after the new
     * image was saved successfully.
     */
    if (
      oldUrl &&
      oldUrl !== publicUrl
    ) {
      try {
        const marker =
          "/storage/v1/object/public/gallery/";

        const position =
          oldUrl.indexOf(
            marker
          );

        if (
          position !== -1
        ) {
          const oldPath =
            decodeURIComponent(
              oldUrl.substring(
                position +
                  marker.length
              )
            );

          if (
            oldPath.startsWith(
              `${folder}/`
            )
          ) {
            const {
              error:
                deleteError,
            } =
              await supabase.storage
                .from(
                  "gallery"
                )
                .remove([
                  oldPath,
                ]);

            if (
              deleteError
            ) {
              console.error(
                `Old ${label} delete warning:`,
                deleteError
              );
            }
          }
        }
      } catch (
        storageError
      ) {
        console.error(
          `Old ${label} cleanup warning:`,
          storageError
        );
      }
    }

    /*
     * Return every setting so the
     * frontend updates immediately.
     */
    const result =
      await pool.query(`
        SELECT key, value
        FROM settings
        ORDER BY key ASC
      `);

    const settings: Record<
      string,
      string
    > = {};

    for (
      const row of result.rows
    ) {
      settings[row.key] =
        row.value ?? "";
    }

    return res
      .status(200)
      .json({
        url: publicUrl,
        settings,
      });
  } catch (error) {
    console.error(
      `${label} image upload error:`,
      error
    );

    return res
      .status(500)
      .json({
        message:
          `Failed to upload ${label.toLowerCase()} image.`,
      });
  }
}

/* =========================================
   SETTINGS - HERO IMAGE UPLOAD
========================================= */

router.post(
  "/settings/hero-image",
  upload.single("image"),
  async (
    req: Request,
    res: Response
  ) => {
    return uploadSettingsImage(
      req,
      res,
      "hero_image",
      "hero",
      "Hero"
    );
  }
);

/* =========================================
   SETTINGS - ABOUT IMAGE UPLOAD
========================================= */

router.post(
  "/settings/about-image",
  upload.single("image"),
  async (
    req: Request,
    res: Response
  ) => {
    return uploadSettingsImage(
      req,
      res,
      "about_image",
      "about",
      "About"
    );
  }
);

/* =========================================
   SETTINGS - SMALL ABOUT IMAGE UPLOAD
========================================= */

router.post(
  "/settings/about-small-image",
  upload.single("image"),
  async (
    req: Request,
    res: Response
  ) => {
    return uploadSettingsImage(
      req,
      res,
      "about_small_image",
      "about-small",
      "Small About"
    );
  }
);

/* =========================================
   MULTER ERROR HANDLER
========================================= */

router.use(
  (
    error: any,
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res
          .status(400)
          .json({
            message:
              "Image must be 8 MB or smaller",
          });
      }

      return res
        .status(400)
        .json({
          message:
            error.message ||
            "Upload failed",
        });
    }

    if (error) {
      console.error(
        "Upload middleware error:",
        error
      );

      return res
        .status(400)
        .json({
          message:
            error.message ||
            "Upload failed",
        });
    }

    next();
  }
);

export default router;