import pool from "../config/db.js";

export const getAreas = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         area,
         COUNT(*)::INT AS total_slots,
         COUNT(*) FILTER (WHERE NOT is_occupied)::INT AS available_slots,
         COUNT(*) FILTER (WHERE is_occupied)::INT AS occupied_slots
       FROM slots
       GROUP BY area
       ORDER BY area`
    );
    console.log("[ParkX BE][Slots] getAreas success", { count: result.rows.length });
    res.json(result.rows);
  } catch (err) {
    console.error("[ParkX BE][Slots] getAreas failed", err?.message || err);
    res.status(500).json({ error: err.message });
  }
};

export const getSlotsByArea = async (req, res) => {
  try {
    const area = String(req.params.areaId || "").trim().toLowerCase();
    if (!area) {
      return res.status(400).json({ message: "areaId is required" });
    }

    const result = await pool.query(
      "SELECT * FROM slots WHERE LOWER(area)=$1 ORDER BY slot_number",
      [area]
    );

    console.log("[ParkX BE][Slots] getSlotsByArea success", { area, count: result.rows.length });
    res.json(result.rows);
  } catch (err) {
    console.error("[ParkX BE][Slots] getSlotsByArea failed", err?.message || err);
    res.status(500).json({ error: err.message });
  }
};
