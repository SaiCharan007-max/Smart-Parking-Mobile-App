import express from "express";
import cors from "cors";
import pool, { checkDatabaseConnection } from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import vehicleRoutes from "./routes/vehicle.routes.js";
import slotsRoutes from "./routes/slots.routes.js";
import bookingRoutes from "./routes/booking.routes.js";

import errorMiddleware from "./middleware/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
    console.log("[ParkX BE][Request]", {
        method: req.method,
        path: req.originalUrl,
        userId: req.userId || null,
        body: req.body || null,
    });
    next();
});

app.get("/api/health", async (_req, res, next) => {
  try {
    await pool.query("SELECT 1");
        console.log("[ParkX BE][Health] DB check passed");
    res.json({ status: "ok" });
  } catch (error) {
        console.error("[ParkX BE][Health] DB check failed", error?.message || error);
    next(error);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/slots", slotsRoutes);
app.use("/api/bookings", bookingRoutes);

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

const ensureSlotInventory = async () => {
    const targets = [
        { area: "a", totalSlots: 35 },
        { area: "b", totalSlots: 46 },
        { area: "c", totalSlots: 30 },
    ];

    for (const { area, totalSlots } of targets) {
        await pool.query(
            `INSERT INTO slots (area, slot_number)
             SELECT $1, gs
             FROM generate_series(1, $2) AS gs
             ON CONFLICT (area, slot_number) DO NOTHING`,
            [area, totalSlots]
        );
    }
};

const bootstrap = async () => {
    try {
        await checkDatabaseConnection();
        await pool.query(
            "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ"
        );
        await ensureSlotInventory();
        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

        server.on("error", (error) => {
            if (error.code === "EADDRINUSE") {
                console.error(
                    `Port ${PORT} is already in use. Stop the other process using ${PORT} or start this server with a different PORT value.`
                );
                process.exit(1);
            }

            console.error("Server startup failed:", error);
            process.exit(1);
        });
    } catch (err) {
        console.error("Failed to bootstrap server:", err);
        process.exit(1);
    }
};

bootstrap();




