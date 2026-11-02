/* =========================================================
   ADMIN-ROUTES.JS
   Extra API routes used by the admin dashboard (Admin.jsx).
   Goes in the backend folder, next to server.js and db.js.

   Routes (all start with /api/admin):
     GET    /users                      list of every user
     GET    /contributions              "Celebrate by sharing" submissions
     DELETE /food/:id                   remove any listing
     PATCH  /food/:id/dismiss-report    clear the "reported" flag

   Every route first checks that the admin_id sent by the app belongs
   to a user whose type is 'admin' in the users table.
   (Same idea as the rest of this API, which trusts the user id the
   app sends. A real product would use login tokens instead.)
   ========================================================= */

import express from "express";
import pool from "./db.js";

const router = express.Router();

/* ---------- only real admins may use these routes ---------- */

router.use(async (req, res, next) => {
  try {
    const adminId = Number(req.query.admin_id || (req.body && req.body.admin_id));

    if (!adminId) {
      return res.status(401).json({ message: "Admin login required." });
    }

    const result = await pool.query(
      "SELECT id FROM users WHERE id = $1 AND type = 'admin'",
      [adminId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: "Admins only." });
    }

    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(500).json({ message: "Could not check admin access." });
  }
});

/* ---------- GET /api/admin/users ---------- */

router.get("/users", async (req, res) => {
  try {
    // The password column is left out on purpose.
    const result = await pool.query(
      "SELECT id, name, email, type, created_at FROM users ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Admin users error:", error);
    res.status(500).json({ message: "Could not load users." });
  }
});

/* ---------- GET /api/admin/contributions ---------- */

router.get("/contributions", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id, name, email, occasion,
        to_char(contribution_date, 'YYYY-MM-DD') AS contribution_date,
        share, servings, message, created_at
      FROM contributions
      ORDER BY id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Admin contributions error:", error);
    res.status(500).json({ message: "Could not load celebration plans." });
  }
});

/* ---------- DELETE /api/admin/food/:id ---------- */

router.delete("/food/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const found = await pool.query(
      "SELECT name, owner_id FROM food_listings WHERE id = $1",
      [id]
    );

    if (found.rows.length === 0) {
      return res.status(404).json({ message: "Food listing not found." });
    }

    // food_requests rows for this listing are removed automatically (ON DELETE CASCADE).
    await pool.query("DELETE FROM food_listings WHERE id = $1", [id]);

    // Tell the donor what happened.
    const { name, owner_id } = found.rows[0];
    if (owner_id) {
      await pool.query(
        "INSERT INTO notifications (user_id, text) VALUES ($1, $2)",
        [owner_id, `An admin removed your listing "${name}".`]
      );
    }

    res.json({ success: true, message: "Listing deleted." });
  } catch (error) {
    console.error("Admin delete error:", error);
    res.status(500).json({ message: "Could not delete the listing." });
  }
});

/* ---------- PATCH /api/admin/food/:id/dismiss-report ---------- */

router.patch("/food/:id/dismiss-report", async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE food_listings SET reported = FALSE WHERE id = $1 RETURNING id",
      [Number(req.params.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Food listing not found." });
    }

    res.json({ success: true, message: "Report dismissed." });
  } catch (error) {
    console.error("Admin dismiss error:", error);
    res.status(500).json({ message: "Could not dismiss the report." });
  }
});

export default router;
