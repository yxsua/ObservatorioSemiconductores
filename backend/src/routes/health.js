const express = require("express");
const router = express.Router();

const pool = require("../config/database");

router.get("/", async (req, res) => {

    try {

        const result = await pool.query("SELECT NOW()");

        res.json({

            status: "ok",

            backend: "running",

            database: "connected",

            timestamp: result.rows[0].now

        });

    } catch (err) {

        console.error(err);

        res.status(500).json({

            status: "error",

            database: "disconnected"

        });

    }

});

module.exports = router;