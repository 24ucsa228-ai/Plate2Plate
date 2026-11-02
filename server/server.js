import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import pool from "./db.js";
import adminRoutes from "./admin-routes.js";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/api/admin", adminRoutes);


/* ---------- schema: creates missing tables and columns on every start ---------- */
async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'donor',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS food_listings (
      id SERIAL PRIMARY KEY,
      owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      diet TEXT,
      quantity TEXT NOT NULL,
      servings INTEGER,
      location TEXT NOT NULL,
      pickup_start TIMESTAMPTZ,
      pickup_end TIMESTAMPTZ,
      cooked_at TIMESTAMPTZ,
      safe_until TIMESTAMPTZ,
      condition TEXT,
      source TEXT,
      image TEXT,
      description TEXT,
      phone TEXT,
      status TEXT NOT NULL DEFAULT 'AVAILABLE',
      requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      requested_servings INTEGER,
      rating INTEGER,
      reported BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS food_requests (
      id SERIAL PRIMARY KEY,
      food_id INTEGER REFERENCES food_listings(id) ON DELETE CASCADE,
      requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      food_name TEXT,
      requested_servings INTEGER,
      status TEXT NOT NULL DEFAULT 'REQUESTED',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS contributions (
      id SERIAL PRIMARY KEY,
      name TEXT,
      email TEXT,
      occasion TEXT,
      contribution_date DATE,
      share TEXT,
      servings INTEGER,
      message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // If your tables already existed with fewer columns, add whatever is missing.
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'donor';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    ALTER TABLE food_listings ADD COLUMN IF NOT EXISTS requested_by INTEGER;
    ALTER TABLE food_listings ADD COLUMN IF NOT EXISTS requested_servings INTEGER;
    ALTER TABLE food_listings ADD COLUMN IF NOT EXISTS rating INTEGER;
    ALTER TABLE food_listings ADD COLUMN IF NOT EXISTS reported BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE food_listings ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE food_listings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    ALTER TABLE food_requests ADD COLUMN IF NOT EXISTS food_name TEXT;
    ALTER TABLE food_requests ADD COLUMN IF NOT EXISTS requested_servings INTEGER;
    ALTER TABLE food_requests ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'REQUESTED';
    ALTER TABLE food_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    ALTER TABLE contributions ADD COLUMN IF NOT EXISTS contribution_date DATE;
    ALTER TABLE contributions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await pool.query(
    "CREATE INDEX IF NOT EXISTS idx_food_requested_by ON food_listings(requested_by)"
  );
  await pool.query(
    "CREATE INDEX IF NOT EXISTS idx_food_owner ON food_listings(owner_id)"
  );
  await pool.query(
    "CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC)"
  );
}

// Works with either the pool or a transaction client.
async function notify(db, userId, text) {
  if (!userId) return;
  await db.query(
    "INSERT INTO notifications (user_id, text) VALUES ($1, $2)",
    [userId, text]
  );
}

const seedRows = [
  {
    name: "Steamed Rice",
    category: "Prepared Meals",
    diet: "Veg",
    quantity: "6 kg cooked",
    servings: 40,
    location: "Tambaram",
    startH: 2,
    durH: 2,
    cookedAgoH: 1.5,
    safeLeftH: 4.5,
    condition: "Freshly cooked, kept hot",
    source: "Wedding reception",
    image: "/images/food/rice.jpg",
    description:
      "Set aside before the evening reception was served, so none of it touched a plate. Packed in covered steel vessels.",
    status: "AVAILABLE",
  },
  {
    name: "Chicken Biryani",
    category: "Prepared Meals",
    diet: "Non-veg",
    quantity: "10 kg",
    servings: 40,
    location: "Velachery",
    startH: 3,
    durH: 1.5,
    cookedAgoH: 1,
    safeLeftH: 5.5,
    condition: "Cooked this evening, sealed in foil trays",
    source: "Restaurant",
    image: "/images/food/biryani.jpg",
    description:
      "Dum biryani boxed up at closing time. Raita is not included.",
    status: "AVAILABLE",
  },
  {
    name: "Idli, Sambar and Chutney",
    category: "Prepared Meals",
    diet: "Veg",
    quantity: "120 idlis",
    servings: 40,
    location: "Anna Nagar",
    startH: 1,
    durH: 2.5,
    cookedAgoH: 1,
    safeLeftH: 5,
    condition: "Cooked this morning, packed in boxes",
    source: "Catering order",
    image: "/images/food/idli.jpg",
    description:
      "A breakfast order was cancelled at short notice and the idlis went unclaimed. Sambar and coconut chutney come packed separately.",
    status: "CONFIRMED",
  },
  {
    name: "Lunch Boxes (Sambar Rice, Poriyal)",
    category: "Prepared Meals",
    diet: "Veg",
    quantity: "30 boxes",
    servings: 30,
    location: "Porur",
    startH: 1,
    durH: 2,
    cookedAgoH: 2,
    safeLeftH: 5,
    condition: "Sealed lunch boxes, room temperature",
    source: "Office canteen",
    image: "/images/food/lunchbox.jpg",
    description:
      "The meeting they were ordered for ended early, so the boxes were never opened.",
    status: "AVAILABLE",
  },
  {
    name: "Chapathi and Kuruma",
    category: "Prepared Meals",
    diet: "Veg",
    quantity: "60 chapathis, 6 litres kuruma",
    servings: 25,
    location: "Perambur",
    startH: 2.5,
    durH: 2,
    cookedAgoH: 1.5,
    safeLeftH: 6,
    condition: "Cooked this evening, kept covered",
    source: "Birthday dinner",
    image: "/images/food/chapathi.jpg",
    description:
      "A family birthday dinner came in well under headcount. The mild kuruma has potato, carrot and peas.",
    status: "AVAILABLE",
  },
  {
    name: "Curd Rice",
    category: "Prepared Meals",
    diet: "Veg",
    quantity: "5 kg",
    servings: 22,
    location: "Mylapore",
    startH: -3,
    durH: 1.5,
    cookedAgoH: 4,
    safeLeftH: -1,
    condition: "Freshly made, kept in a cool place",
    source: "Temple annadhanam",
    image: "/images/food/curdrice.jpg",
    description:
      "Tempered with mustard and curry leaves for a temple annadhanam. Contains curd.",
    status: "COLLECTED",
  },
  {
    name: "Bread Loaves",
    category: "Bakery",
    diet: "Veg",
    quantity: "35 loaves",
    servings: 100,
    location: "Adyar",
    startH: 4,
    durH: 1.5,
    cookedAgoH: 8,
    safeLeftH: 40,
    condition: "Baked today, sealed in bags",
    source: "Neighbourhood bakery",
    image: "/images/food/bread.jpg",
    description:
      "White and whole wheat loaves from today's bake that did not sell.",
    status: "AVAILABLE",
  },
  {
    name: "Plain Buns",
    category: "Bakery",
    diet: "Veg",
    quantity: "50 pieces",
    servings: 50,
    location: "Kodambakkam",
    startH: 3.5,
    durH: 1.5,
    cookedAgoH: 7,
    safeLeftH: 16,
    condition: "Baked today, packed in trays",
    source: "Bakery",
    image: "/images/food/buns.jpg",
    description: "Soft sweet buns from the afternoon batch.",
    status: "AVAILABLE",
  },
  {
    name: "Veg Samosas",
    category: "Bakery",
    diet: "Veg",
    quantity: "70 pieces",
    servings: 35,
    location: "T. Nagar",
    startH: 2,
    durH: 1.5,
    cookedAgoH: 3,
    safeLeftH: 5,
    condition: "Fried this afternoon, kept dry",
    source: "Snack stall",
    image: "/images/food/samosa.jpg",
    description:
      "Potato and peas filling. They taste best warm, so come early in the window.",
    status: "AVAILABLE",
  },
  {
    name: "Veg Puffs",
    category: "Bakery",
    diet: "Veg",
    quantity: "40 pieces",
    servings: 40,
    location: "Guindy",
    startH: -3,
    durH: 1.5,
    cookedAgoH: 10,
    safeLeftH: 14,
    condition: "Baked this morning, boxed",
    source: "Local bakery",
    image: "/images/food/puffs.jpg",
    description:
      "Mixed vegetable puffs that remained after the lunch rush.",
    status: "COLLECTED",
  },
  {
    name: "Poovan Bananas",
    category: "Fruits & Vegetables",
    diet: "Veg",
    quantity: "15 kg",
    servings: 60,
    location: "Koyambedu",
    startH: 16,
    durH: 2,
    cookedAgoH: 24,
    safeLeftH: 40,
    condition: "Ripe, a few spotted, no damage",
    source: "Market vendor",
    image: "/images/food/banana.jpg",
    description:
      "These ripe bananas will not last the week. A few skins are dark but the fruit inside is fine.",
    status: "AVAILABLE",
  },
  {
    name: "Tomatoes",
    category: "Fruits & Vegetables",
    diet: "Veg",
    quantity: "20 kg",
    servings: 80,
    location: "Koyambedu",
    startH: 3,
    durH: 2,
    cookedAgoH: 72,
    safeLeftH: 90,
    condition: "Firm, picked this week",
    source: "Wholesale vendor",
    image: "/images/food/tomato.jpg",
    description:
      "Soft ones are already sorted out. Good for sambar or rasam in a community kitchen.",
    status: "REQUESTED",
  },
  {
    name: "Brinjal",
    category: "Fruits & Vegetables",
    diet: "Veg",
    quantity: "12 kg",
    servings: 40,
    location: "Madhavaram",
    startH: 17,
    durH: 2,
    cookedAgoH: 20,
    safeLeftH: 60,
    condition: "Fresh, from a farm delivery",
    source: "Farm delivery",
    image: "/images/food/brinjal.jpg",
    description:
      "Long purple brinjal from a bulk order the supplier over-delivered.",
    status: "AVAILABLE",
  },
  {
    name: "Keerai (Spinach)",
    category: "Fruits & Vegetables",
    diet: "Veg",
    quantity: "6 kg",
    servings: 30,
    location: "Besant Nagar",
    startH: 2.5,
    durH: 2,
    cookedAgoH: 6,
    safeLeftH: 8,
    condition: "Picked this morning, kept in shade",
    source: "Terrace garden group",
    image: "/images/food/keerai.jpg",
    description:
      "Cut fresh from a community terrace garden. It needs cooking today.",
    status: "AVAILABLE",
  },
  {
    name: "Parle-G Biscuits",
    category: "Packaged Food",
    diet: "Veg",
    quantity: "36 packets",
    servings: 36,
    location: "Royapettah",
    startH: 18,
    durH: 2,
    cookedAgoH: 240,
    safeLeftH: 2880,
    condition: "Sealed and unopened",
    source: "Corporate event",
    image: "/images/food/biscuits.jpg",
    description:
      "Cartons from a training day that were never opened.",
    status: "AVAILABLE",
  },
  {
    name: "Packed Murukku",
    category: "Packaged Food",
    diet: "Veg",
    quantity: "24 packets",
    servings: 24,
    location: "Mylapore",
    startH: 3,
    durH: 2,
    cookedAgoH: 240,
    safeLeftH: 1008,
    condition: "Sealed and unopened",
    source: "Golu gift bags",
    image: "/images/food/murukku.jpg",
    description:
      "Spare snack packs made for Navaratri gift bags.",
    status: "AVAILABLE",
  },
  {
    name: "Nendran Banana Chips",
    category: "Packaged Food",
    diet: "Veg",
    quantity: "18 packets",
    servings: 18,
    location: "Thiruvanmiyur",
    startH: 19,
    durH: 2,
    cookedAgoH: 240,
    safeLeftH: 2160,
    condition: "Sealed and unopened",
    source: "Snack shop",
    image: "/images/food/chips.jpg",
    description:
      "200 g packs. The shop is clearing stock before it moves premises.",
    status: "AVAILABLE",
  },
  {
    name: "Milk Packets",
    category: "Dairy & Beverages",
    diet: "Veg",
    quantity: "40 × 500 ml",
    servings: 40,
    location: "Nanganallur",
    startH: 2,
    durH: 2,
    cookedAgoH: 6,
    safeLeftH: 16,
    condition: "Sealed, kept chilled",
    source: "Dairy booth",
    image: "/images/food/milk.jpg",
    description:
      "Surplus from the evening delivery, kept in the chiller since it arrived.",
    status: "AVAILABLE",
  },
  {
    name: "Buttermilk Bottles",
    category: "Dairy & Beverages",
    diet: "Veg",
    quantity: "30 bottles",
    servings: 30,
    location: "Triplicane",
    startH: -4,
    durH: 2,
    cookedAgoH: 6,
    safeLeftH: -1,
    condition: "Chilled, sealed bottles",
    source: "Temple event",
    image: "/images/food/buttermilk.jpg",
    description:
      "Spiced buttermilk in bottles that were never opened.",
    status: "COLLECTED",
  },
  {
    name: "Tender Coconuts",
    category: "Dairy & Beverages",
    diet: "Veg",
    quantity: "28 coconuts",
    servings: 28,
    location: "Neelankarai",
    startH: 16,
    durH: 2,
    cookedAgoH: 12,
    safeLeftH: 36,
    condition: "Fresh, whole and uncut",
    source: "Roadside vendor",
    image: "/images/food/coconut.jpg",
    description:
      "Overstock from the morning delivery.",
    status: "AVAILABLE",
  }, 
    {
    name: "Rose Milk",
    category: "Dairy & Beverages",
    diet: "Veg",
    quantity: "20 bottles",
    servings: 20,
    location: "T. Nagar",
    startH: 5,
    durH: 2,
    cookedAgoH: 4,
    safeLeftH: 18,
    condition: "Chilled and sealed",
    source: "Birthday party",
    image: "/images/food/rosemilk.jpg",
    description:
      "Bottled rose milk left over from a birthday celebration.",
    status: "AVAILABLE",
  },
  {
    name: "Raw Rice",
    category: "Groceries",
    diet: "Veg",
    quantity: "25 kg",
    servings: 100,
    location: "Saidapet",
    startH: 24,
    durH: 2,
    cookedAgoH: 720,
    safeLeftH: 8760,
    condition: "Dry, sealed bags",
    source: "Grocery donation",
    image: "/images/food/rawrice.jpg",
    description:
      "New sealed bags of raw rice donated by a local grocery shop.",
    status: "AVAILABLE",
  },
  {
    name: "Toor Dal",
    category: "Groceries",
    diet: "Veg",
    quantity: "10 kg",
    servings: 80,
    location: "Ashok Nagar",
    startH: 20,
    durH: 2,
    cookedAgoH: 720,
    safeLeftH: 8760,
    condition: "Sealed packets",
    source: "Community donation",
    image: "/images/food/dal.jpg",
    description:
      "Good quality toor dal in sealed packets.",
    status: "AVAILABLE",
  },
  {
    name: "Wheat Flour",
    category: "Groceries",
    diet: "Veg",
    quantity: "10 kg",
    servings: 70,
    location: "Kilpauk",
    startH: 18,
    durH: 2,
    cookedAgoH: 720,
    safeLeftH: 8760,
    condition: "Sealed bags",
    source: "Grocery donation",
    image: "/images/food/atta.jpg",
    description:
      "Sealed wheat flour bags donated after a community event.",
    status: "AVAILABLE",
  },
  {
    name: "Rava",
    category: "Groceries",
    diet: "Veg",
    quantity: "8 kg",
    servings: 60,
    location: "Egmore",
    startH: 12,
    durH: 2,
    cookedAgoH: 720,
    safeLeftH: 8760,
    condition: "Sealed packets",
    source: "Household donation",
    image: "/images/food/rava.jpg",
    description:
      "Semolina suitable for upma, kesari and other preparations.",
    status: "AVAILABLE",
  },
  {
    name: "Sugar",
    category: "Groceries",
    diet: "Veg",
    quantity: "10 kg",
    servings: 100,
    location: "Ayanavaram",
    startH: 14,
    durH: 2,
    cookedAgoH: 720,
    safeLeftH: 8760,
    condition: "Sealed bags",
    source: "Household donation",
    image: "/images/food/sugar.jpg",
    description:
      "Sealed sugar bags that can be used by a community kitchen.",
    status: "AVAILABLE",
  },
];

function toTimestamp(hoursFromNow) {
  const date = new Date();
  date.setTime(date.getTime() + hoursFromNow * 60 * 60 * 1000);
  return date;
}

async function seedFood() {
  try {
    const result = await pool.query(
      "SELECT COUNT(*)::int AS count FROM food_listings"
    );

    if (result.rows[0].count > 0) {
      return;
    }

    for (const food of seedRows) {
      await pool.query(
        `
        INSERT INTO food_listings
        (
          owner_id,
          name,
          category,
          diet,
          quantity,
          servings,
          location,
          pickup_start,
          pickup_end,
          cooked_at,
          safe_until,
          condition,
          source,
          image,
          description,
          phone,
          status
        )
        VALUES
        (
          NULL,
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14,
          NULL,
          $15
        )
        `,
        [
          food.name,
          food.category,
          food.diet,
          food.quantity,
          food.servings,
          food.location,
          toTimestamp(food.startH),
          toTimestamp(food.startH + food.durH),
          toTimestamp(-food.cookedAgoH),
          toTimestamp(food.safeLeftH),
          food.condition,
          food.source,
          food.image,
          food.description,
          food.status,
        ]
      );
    }

    console.log("Demo food listings added to PostgreSQL.");
  } catch (error) {
    console.error("Could not seed food:", error.message);
  }
}

app.get("/api/test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS now");

    res.json({
      success: true,
      message: "Plate2Plate backend is connected to PostgreSQL.",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database test error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed.",
      error: error.message,
    });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      type = "donor",
    } = req.body;

    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "").trim();

    if (!cleanName || !cleanEmail || !cleanPassword) {
      return res.status(400).json({
        message: "Please fill in all required fields.",
      });
    }

    if (!cleanEmail.includes("@")) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters.",
      });
    }

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [cleanEmail]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 10);

    const result = await pool.query(
      `
      INSERT INTO users
      (name, email, password, type)
      VALUES
      ($1, $2, $3, $4)
      RETURNING id, name, email, type, created_at
      `,
      [
        cleanName,
        cleanEmail,
        hashedPassword,
        type === "recipient" ? "recipient" : "donor",
      ]
    );

    res.status(201).json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    res.status(500).json({
      message: "Could not create account.",
      error: error.message,
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "");

    if (!cleanEmail || !cleanPassword) {
      return res.status(400).json({
        message: "Please enter your email and password.",
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        password,
        type,
        created_at
      FROM users
      WHERE email = $1
      `,
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const account = result.rows[0];

    const passwordMatches = await bcrypt.compare(
      cleanPassword,
      account.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    delete account.password;

    res.json({
      success: true,
      user: account,
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Could not log in.",
      error: error.message,
    });
  }
});

app.get("/api/food", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        f.*,
        owner.name AS owner_name,
        owner.email AS owner_email,
        requester.name AS requester_name,
        requester.email AS requester_email,
        requester.email AS requested_by_email
      FROM food_listings f
      LEFT JOIN users owner
        ON owner.id = f.owner_id
      LEFT JOIN users requester
        ON requester.id = f.requested_by
      ORDER BY f.created_at DESC, f.id DESC
    `);

    res.json({
      success: true,
      foods: result.rows,
    });
  } catch (error) {
    console.error("Food fetch error:", error);

    res.status(500).json({
      message: "Could not load food listings.",
      error: error.message,
    });
  }
});

app.post("/api/food", async (req, res) => {
  try {
    const {
      owner_id,
      name,
      category,
      diet,
      quantity,
      servings,
      location,
      pickup_start,
      pickup_end,
      cooked_at,
      safe_until,
      condition,
      source,
      image,
      description,
      phone,
    } = req.body;

    if (!owner_id || !name || !category || !quantity || !location) {
      return res.status(400).json({
        message:
          "Name, category, quantity, location and owner are required.",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO food_listings
      (
        owner_id,
        name,
        category,
        diet,
        quantity,
        servings,
        location,
        pickup_start,
        pickup_end,
        cooked_at,
        safe_until,
        condition,
        source,
        image,
        description,
        phone,
        status
      )
      VALUES
      (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, 'AVAILABLE'
      )
      RETURNING *
      `,
      [
        owner_id,
        name,
        category,
        diet || null,
        quantity,
        servings ? Number(servings) : null,
        location,
        pickup_start || null,
        pickup_end || null,
        cooked_at || null,
        safe_until || null,
        condition || null,
        source || null,
        image || null,
        description || null,
        phone || null,
      ]
    );

    res.status(201).json({
      success: true,
      food: result.rows[0],
    });
  } catch (error) {
    console.error("Food creation error:", error);

    res.status(500).json({
      message: "Could not create food listing.",
      error: error.message,
    });
  }
});

app.put("/api/food/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      owner_id,
      name,
      category,
      diet,
      quantity,
      servings,
      location,
      pickup_start,
      pickup_end,
      cooked_at,
      safe_until,
      condition,
      source,
      image,
      description,
      phone,
    } = req.body;

    const ownerCheck = await pool.query(
      `
      SELECT id
      FROM food_listings
      WHERE id = $1
        AND owner_id = $2
      `,
      [id, owner_id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        message: "You can only edit your own food listings.",
      });
    }

    const result = await pool.query(
      `
      UPDATE food_listings
      SET
        name = $1,
        category = $2,
        diet = $3,
        quantity = $4,
        servings = $5,
        location = $6,
        pickup_start = $7,
        pickup_end = $8,
        cooked_at = $9,
        safe_until = $10,
        condition = $11,
        source = $12,
        image = $13,
        description = $14,
        phone = $15
      WHERE id = $16
        AND owner_id = $17
        AND status = 'AVAILABLE'
      RETURNING *
      `,
      [
        name,
        category,
        diet || null,
        quantity,
        servings ? Number(servings) : null,
        location,
        pickup_start || null,
        pickup_end || null,
        cooked_at || null,
        safe_until || null,
        condition || null,
        source || null,
        image || null,
        description || null,
        phone || null,
        id,
        owner_id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message:
          "This listing cannot be edited because it is no longer available.",
      });
    }

    res.json({
      success: true,
      food: result.rows[0],
    });
  } catch (error) {
    console.error("Food update error:", error);

    res.status(500).json({
      message: "Could not update food listing.",
      error: error.message,
    });
  }
});
app.delete("/api/food/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { owner_id } = req.body;

    if (!owner_id) {
      return res.status(400).json({
        message: "Owner is required.",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM food_listings
      WHERE id = $1
        AND owner_id = $2
        AND status = 'AVAILABLE'
      RETURNING id
      `,
      [id, owner_id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        message: "You can only delete your own listing, and only while it is still available.",
      });
    }

    res.json({
      success: true,
      message: "Food listing deleted.",
    });
  } catch (error) {
    console.error("Food delete error:", error);

    res.status(500).json({
      message: "Could not delete food listing.",
      error: error.message,
    });
  }
});

app.post("/api/food/:id/request", async (req, res) => {
  const client = await pool.connect();

  try {
    const foodId = Number(req.params.id);
    const requesterId = Number(req.body.requester_id);
    const requestedAmount = Number(req.body.requested_servings) || 1;

    if (!requesterId) {
      return res.status(400).json({ message: "Requester is required." });
    }

    if (!Number.isInteger(requestedAmount) || requestedAmount < 1) {
      return res.status(400).json({ message: "Enter a valid number of servings." });
    }

    await client.query("BEGIN");

    // Lock the row so two people cannot grab the same food at once.
    const foodResult = await client.query(
      "SELECT * FROM food_listings WHERE id = $1 FOR UPDATE",
      [foodId]
    );

    if (foodResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Food listing not found." });
    }

    const food = foodResult.rows[0];

    const requesterResult = await client.query(
      "SELECT id, name FROM users WHERE id = $1",
      [requesterId]
    );

    if (requesterResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(401).json({
        message: "Your account was not found. Please log in again.",
      });
    }

    const requester = requesterResult.rows[0];

    if (food.status !== "AVAILABLE") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "This food is no longer available." });
    }

    if (food.owner_id && Number(food.owner_id) === requesterId) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "You cannot request your own food listing." });
    }

    if (food.servings && requestedAmount > Number(food.servings)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Requested servings exceed the available amount.",
      });
    }

    let resultRow;
    let partial = false;

    if (food.servings && requestedAmount < Number(food.servings)) {
      // Partial request: shrink the original listing, and create a new
      // REQUESTED listing holding just the servings this person asked for.
      partial = true;
      const remaining = Number(food.servings) - requestedAmount;

      await client.query(
        `UPDATE food_listings
         SET servings = $1, quantity = $2
         WHERE id = $3`,
        [remaining, `${remaining} servings remaining`, foodId]
      );

      const split = await client.query(
        `
        INSERT INTO food_listings
        (
          owner_id, name, category, diet, quantity, servings, location,
          pickup_start, pickup_end, cooked_at, safe_until, condition,
          source, image, description, phone, status,
          requested_by, requested_servings
        )
        VALUES
        (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, 'REQUESTED', $17, $18
        )
        RETURNING *
        `,
        [
          food.owner_id, food.name, food.category, food.diet,
          `${requestedAmount} servings`, requestedAmount, food.location,
          food.pickup_start, food.pickup_end, food.cooked_at, food.safe_until,
          food.condition, food.source, food.image, food.description,
          food.phone, requesterId, requestedAmount,
        ]
      );

      resultRow = split.rows[0];
    } else {
      const updated = await client.query(
        `
        UPDATE food_listings
        SET status = 'REQUESTED',
            requested_by = $1,
            requested_servings = $2
        WHERE id = $3
        RETURNING *
        `,
        [requesterId, requestedAmount, foodId]
      );

      resultRow = updated.rows[0];
    }

    await client.query(
      `
      INSERT INTO food_requests
        (food_id, requester_id, food_name, requested_servings, status)
      VALUES ($1, $2, $3, $4, 'REQUESTED')
      `,
      [resultRow.id, requesterId, food.name, requestedAmount]
    );

    await notify(
      client,
      food.owner_id,
      `${requester.name} requested ${requestedAmount} servings of ${food.name}. Please confirm it.`
    );
    await notify(
      client,
      requesterId,
      `You requested ${requestedAmount} servings of ${food.name}. Waiting for the donor to confirm.`
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      food: resultRow,
      partial,
      message: "Food request placed successfully.",
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Food request error:", error);

    res.status(500).json({
      message: "Could not request food.",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

app.patch("/api/food/:id/status", async (req, res) => {
  const client = await pool.connect();

  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    const actorId = Number(req.body.actor_id);

    const nextStatus = { REQUESTED: "CONFIRMED", CONFIRMED: "COLLECTED" };

    if (!actorId) {
      return res.status(400).json({ message: "Please log in again." });
    }

    await client.query("BEGIN");

    const found = await client.query(
      "SELECT * FROM food_listings WHERE id = $1 FOR UPDATE",
      [id]
    );

    if (found.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Food listing not found." });
    }

    const food = found.rows[0];

    // Only the donor or the person who requested it may move it along.
    // (Demo listings with no owner can be moved by the requester.)
    const isOwner = food.owner_id && Number(food.owner_id) === actorId;
    const isRequester = food.requested_by && Number(food.requested_by) === actorId;

    if (!isOwner && !isRequester) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        message: "You are not part of this request.",
      });
    }

    if (nextStatus[food.status] !== status) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: `A ${food.status.toLowerCase()} listing cannot move to ${String(status).toLowerCase()}.`,
      });
    }

    const result = await client.query(
      "UPDATE food_listings SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );

    await client.query(
      `
      UPDATE food_requests
      SET status = $1
      WHERE food_id = $2
        AND status IN ('REQUESTED', 'CONFIRMED')
      `,
      [status, id]
    );

    const text =
      status === "CONFIRMED"
        ? `The request for ${food.name} was confirmed. You can now see the donor's phone number.`
        : `${food.name} was marked as collected.`;

    await notify(client, food.requested_by, text);
    if (food.owner_id) await notify(client, food.owner_id, text);

    await client.query("COMMIT");

    res.json({ success: true, food: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Status update error:", error);

    res.status(500).json({
      message: "Could not update food status.",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

app.patch("/api/food/:id/cancel", async (req, res) => {
  const client = await pool.connect();

  try {
    const id = Number(req.params.id);
    const requesterId = Number(req.body.requester_id);

    await client.query("BEGIN");

    const result = await client.query(
      `
      UPDATE food_listings
      SET status = 'AVAILABLE',
          requested_by = NULL,
          requested_servings = NULL
      WHERE id = $1
        AND requested_by = $2
        AND status IN ('REQUESTED', 'CONFIRMED')
      RETURNING *
      `,
      [id, requesterId]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "This request cannot be cancelled." });
    }

    await client.query(
      `
      UPDATE food_requests
      SET status = 'CANCELLED'
      WHERE food_id = $1
        AND requester_id = $2
        AND status IN ('REQUESTED', 'CONFIRMED')
      `,
      [id, requesterId]
    );

    const food = result.rows[0];
    await notify(client, food.owner_id, `A request for ${food.name} was cancelled. It is available again.`);
    await notify(client, requesterId, `You cancelled your request for ${food.name}.`);

    await client.query("COMMIT");

    res.json({
      success: true,
      food,
      message: "Food request cancelled.",
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Cancel request error:", error);

    res.status(500).json({
      message: "Could not cancel request.",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

app.patch("/api/food/:id/rating", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rating } = req.body;
    const requesterId = Number(req.body.requester_id);

    const numericRating =
      rating === "yes" || rating === true
        ? 1
        : rating === "no" || rating === false
          ? 0
          : Number(rating);

    if (![0, 1, 2, 3, 4, 5].includes(numericRating)) {
      return res.status(400).json({ message: "Invalid rating." });
    }

    const result = await pool.query(
      `
      UPDATE food_listings
      SET rating = $1
      WHERE id = $2
        AND requested_by = $3
        AND status = 'COLLECTED'
      RETURNING *
      `,
      [numericRating, id, requesterId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        message: "Only the person who collected this food can rate it.",
      });
    }

    res.json({ success: true, food: result.rows[0] });
  } catch (error) {
    console.error("Rating error:", error);

    res.status(500).json({
      message: "Could not save rating.",
      error: error.message,
    });
  }
});

/* ---------- users and notifications ---------- */

app.get("/api/users/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, type, created_at FROM users WHERE id = $1",
      [Number(req.params.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error("User fetch error:", error);
    res.status(500).json({ message: "Could not load user.", error: error.message });
  }
});

app.get("/api/notifications/:userId", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, text, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC, id DESC
      LIMIT 40
      `,
      [Number(req.params.userId)]
    );

    res.json({ success: true, notifications: result.rows });
  } catch (error) {
    console.error("Notifications error:", error);
    res.status(500).json({ message: "Could not load updates.", error: error.message });
  }
});

app.delete("/api/notifications/:userId", async (req, res) => {
  try {
    await pool.query("DELETE FROM notifications WHERE user_id = $1", [
      Number(req.params.userId),
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error("Clear notifications error:", error);
    res.status(500).json({ message: "Could not clear updates.", error: error.message });
  }
});

app.patch("/api/food/:id/report", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const result = await pool.query(
      `
      UPDATE food_listings
      SET reported = TRUE
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Food listing not found.",
      });
    }

    res.json({
      success: true,
      food: result.rows[0],
      message: "Food listing reported.",
    });
  } catch (error) {
    console.error("Report error:", error);

    res.status(500).json({
      message: "Could not report food listing.",
      error: error.message,
    });
  }
});

app.post("/api/contributions", async (req, res) => {
  try {
    const {
      name,
      email,
      occasion,
      date,
      contribution_date,
      share,
      servings,
      message,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO contributions
      (
        name,
        email,
        occasion,
        contribution_date,
        share,
        servings,
        message
      )
      VALUES
      ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        name || null,
        email || null,
        occasion || null,
        contribution_date || date || null,
        share || null,
        servings ? Number(servings) : null,
        message || null,
      ]
    );

    res.status(201).json({
      success: true,
      contribution: result.rows[0],
      message: "Contribution saved successfully.",
    });
  } catch (error) {
    console.error("Contribution error:", error);

    res.status(500).json({
      message: "Could not save contribution.",
      error: error.message,
    });
  }
});

/* One-time fix: listings saved earlier in PostgreSQL still hold the old
   image names, so rename them to the new ones. Safe to run every start. */
async function fixImageNames() {
  const renames = [
    ["/images/food/meals0.jpg", "/images/food/meals.jpg"],
    ["/images/food/bakery0.jpg", "/images/food/bakery.jpg"],
    ["/images/food/fruitveg0.jpg", "/images/food/fruits.jpg"],
    ["/images/food/packfood0.jpg", "/images/food/packaged.jpg"],
    ["/images/food/dairybev0.jpg", "/images/food/dairy.jpg"],
    ["/images/food/groceries0.jpg", "/images/food/grocery.jpg"],
    ["/images/food/meals1.jpg", "/images/food/rice.jpg"],
    ["/images/food/meals2.jpg", "/images/food/biryani.jpg"],
    ["/images/food/meals3.jpg", "/images/food/idli.jpg"],
    ["/images/food/meals4.jpg", "/images/food/lunchbox.jpg"],
    ["/images/food/meals5.jpg", "/images/food/chapathi.jpg"],
    ["/images/food/meals6.jpg", "/images/food/curdrice.jpg"],
    ["/images/food/bakery1.jpg", "/images/food/bread.jpg"],
    ["/images/food/bakery2.jpg", "/images/food/buns.jpg"],
    ["/images/food/bakery5.jpg", "/images/food/samosa.jpg"],
    ["/images/food/bakery6.jpg", "/images/food/puffs.jpg"],
    ["/images/food/fruitveg1.jpg", "/images/food/banana.jpg"],
    ["/images/food/fruitveg2.jpg", "/images/food/tomato.jpg"],
    ["/images/food/fruitveg4.jpg", "/images/food/brinjal.jpg"],
    ["/images/food/fruitveg5.jpg", "/images/food/keerai.jpg"],
    ["/images/food/packfood1.jpg", "/images/food/biscuits.jpg"],
    ["/images/food/packfood3.jpg", "/images/food/murukku.jpg"],
    ["/images/food/packfood5.jpg", "/images/food/chips.jpg"],
    ["/images/food/dairybev1.jpg", "/images/food/milk.jpg"],
    ["/images/food/dairybev3.jpg", "/images/food/buttermilk.jpg"],
    ["/images/food/dairybev6.jpg", "/images/food/coconut.jpg"],
    ["/images/food/dairybev4.jpg", "/images/food/rosemilk.jpg"],
    ["/images/food/groceries1.jpg", "/images/food/rawrice.jpg"],
    ["/images/food/grocery1.jpg", "/images/food/rawrice.jpg"],
    ["/images/food/groceries2.jpg", "/images/food/dal.jpg"],
    ["/images/food/grocery2.jpg", "/images/food/dal.jpg"],
    ["/images/food/groceries4.jpg", "/images/food/atta.jpg"],
    ["/images/food/grocery3.jpg", "/images/food/atta.jpg"],
    ["/images/food/grocery4.jpg", "/images/food/rava.jpg"],
    ["/images/food/grocery5.jpg", "/images/food/sugar.jpg"],
    ["/images/food/food-placeholder.jpg", "/images/food/placeholder.jpg"]
  ];

  try {
    for (const [oldName, newName] of renames) {
      await pool.query(
        "UPDATE food_listings SET image = $2 WHERE image = $1",
        [oldName, newName]
      );
    }
  } catch (error) {
    console.error("Could not rename old images:", error.message);
  }
}

async function startServer() {
  try {
    await pool.query("SELECT NOW()");
    console.log("PostgreSQL connected successfully.");

    await ensureSchema();
    console.log("Database tables are ready.");

    await seedFood();
    await fixImageNames();

    app.listen(PORT, () => {
      console.log(
        `Plate2Plate backend running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Could not start Plate2Plate backend.");
    console.error(error.message);
    process.exit(1);
  }
}

startServer();