import pool from "../config/db.js";

export const addVehicle = async (req, res) => {
  console.log("[ADD VEHICLE] Request body:", req.body, "UserId:", req.userId);
  try {
    const { vehicle_number, model } = req.body;
    const userId = req.userId;
    const normalizedVehicleNumber = String(vehicle_number || "").trim().toUpperCase();
    const normalizedModel = String(model || "").trim();

    if (!userId || !normalizedVehicleNumber || !normalizedModel) {
      return res.status(400).json({ message: "vehicle_number and model are required" });
    }

    const existingByNumber = await pool.query(
      "SELECT id, user_id, deleted_at FROM vehicles WHERE UPPER(vehicle_number)=UPPER($1) LIMIT 1",
      [normalizedVehicleNumber]
    );

    if (existingByNumber.rowCount) {
      const existing = existingByNumber.rows[0];
      const isSameUser = Number(existing.user_id) === Number(userId);

      if (isSameUser && existing.deleted_at) {
        const restored = await pool.query(
          `UPDATE vehicles
           SET model=$1, deleted_at=NULL, created_at=NOW()
           WHERE id=$2
           RETURNING *`,
          [normalizedModel, existing.id]
        );
        console.log("[ParkX BE][Vehicles] addVehicle restored soft-deleted vehicle", {
          vehicleId: existing.id,
          userId,
        });
        return res.status(201).json(restored.rows[0]);
      }

      return res.status(409).json({ message: "This license plate is already registered." });
    }

    const result = await pool.query(
      "INSERT INTO vehicles (user_id, vehicle_number, model) VALUES ($1, $2, $3) RETURNING *",
      [userId, normalizedVehicleNumber, normalizedModel]
    );

    console.log("[ParkX BE][Vehicles] addVehicle success", {
      vehicleId: result.rows[0]?.id,
      userId,
      vehicleNumber: normalizedVehicleNumber,
    });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ message: "This license plate is already registered." });
    }
    console.error("[ParkX BE][Vehicles] addVehicle failed", err?.message || err);
    res.status(500).json({ error: err.message });
  }
};

export const getUserVehicles = async (req, res) => {
  try {
    const userId = req.userId;
    const result = await pool.query(
      "SELECT * FROM vehicles WHERE user_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC",
      [userId]
    );
    console.log("[ParkX BE][Vehicles] getUserVehicles success", { userId, count: result.rows.length });
    res.json(result.rows);
  } catch (err) {
    console.error("[ParkX BE][Vehicles] getUserVehicles failed", err?.message || err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteVehicle = async (req, res) => {
  console.log("[DELETE VEHICLE] Params:", req.params, "UserId:", req.userId);
  try {
    const vehicleId = Number(req.params.id);
    if (!vehicleId) {
      return res.status(400).json({ message: "Invalid vehicle id" });
    }

    const vehicleCheck = await pool.query(
      "SELECT id FROM vehicles WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL",
      [vehicleId, req.userId]
    );
    if (!vehicleCheck.rowCount) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    const activeBooking = await pool.query(
      "SELECT id FROM bookings WHERE vehicle_id=$1 AND status='active' LIMIT 1",
      [vehicleId]
    );
    if (activeBooking.rowCount) {
      return res.status(400).json({ message: "Vehicle has an active booking and cannot be deleted" });
    }

    const bookingHistory = await pool.query(
      "SELECT id FROM bookings WHERE vehicle_id=$1 LIMIT 1",
      [vehicleId]
    );
    if (bookingHistory.rowCount) {
      await pool.query(
        "UPDATE vehicles SET deleted_at=NOW() WHERE id=$1 AND user_id=$2",
        [vehicleId, req.userId]
      );
      console.log("[ParkX BE][Vehicles] deleteVehicle soft-deleted", { vehicleId, userId: req.userId });
      return res.json({
        message: "Vehicle removed from your list. Booking history is preserved."
      });
    }

    const result = await pool.query(
      "DELETE FROM vehicles WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL RETURNING id",
      [vehicleId, req.userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    console.log("[ParkX BE][Vehicles] deleteVehicle hard-deleted", { vehicleId, userId: req.userId });
    res.json({ message: "Vehicle deleted" });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(400).json({ message: "Vehicle is referenced by existing bookings" });
    }
    console.error("[ParkX BE][Vehicles] deleteVehicle failed", err?.message || err);
    res.status(500).json({ error: err.message });
  }
};
