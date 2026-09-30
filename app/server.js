const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const DB_HOST = process.env.DB_HOST || "db";
const DB_NAME = process.env.DB_NAME || "foodorders";
const DB_USER = process.env.DB_USER || "fooduser";
const DB_PASSWORD = process.env.DB_PASSWORD || "foodpassword";
const DB_PORT = process.env.DB_PORT || 5432;

const pool = new Pool({
    host: DB_HOST,
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT
});

async function initializeDatabase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            customer_name VARCHAR(100) NOT NULL,
            food_item VARCHAR(200) NOT NULL,
            quantity INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({
            status: "UP",
            database: "CONNECTED"
        });
    } catch (error) {
        console.error("Database health check failed:", error.message);
        res.status(503).json({
            status: "DOWN",
            database: "NOT_CONNECTED"
        });
    }
});

app.post("/orders", async (req, res) => {
    const { customer_name, food_item, quantity } = req.body;

    if (!customer_name || !food_item || !quantity) {
        return res.status(400).json({
            error: "customer_name, food_item and quantity are required"
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO orders (customer_name, food_item, quantity)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [customer_name, food_item, quantity]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Create order failed:", error.message);
        res.status(500).json({
            error: "Failed to create order"
        });
    }
});

app.get("/orders", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM orders ORDER BY id"
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Retrieve orders failed:", error.message);
        res.status(500).json({
            error: "Failed to retrieve orders"
        });
    }
});

app.listen(PORT, async () => {
    console.log(`Order API running on port ${PORT}`);

    try {
        await initializeDatabase();
        console.log("Database initialized successfully");
    } catch (error) {
        console.error("Database initialization failed:", error.message);
    }
});