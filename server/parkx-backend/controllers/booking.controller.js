import pool from "../config/db.js";

const DEFAULT_RATE_PER_HOUR = Number(process.env.PARKING_RATE_PER_HOUR || 20);
const BOOKING_SELECT = `
  SELECT
    b.*,
    u.username,
    u.email,
    v.vehicle_number,
    v.model AS vehicle_model,
    s.area,
    s.slot_number,
    s.is_occupied
  FROM bookings b
  JOIN users u ON u.id = b.user_id
  LEFT JOIN vehicles v ON v.id = b.vehicle_id
  JOIN slots s ON s.id = b.slot_id
`;

const calculateDurationMinutes = (entryTime, exitTime) => {
  const durationMs = Math.max(0, exitTime.getTime() - entryTime.getTime());
  return Math.max(1, Math.ceil(durationMs / (1000 * 60)));
};

const calculateAmount = (durationMinutes, ratePerHour) => {
  const amount = (durationMinutes / 60) * ratePerHour;
  return Number(amount.toFixed(2));
};

export const bookSlot = async (req, res) => {
  console.log("[BOOK SLOT] Request body:", req.body, "UserId:", req.userId);
  const client = await pool.connect();
  try {
    const { vehicle_id, slot_id } = req.body;

    const effectiveUserId = Number(req.userId);
    const vehicleId = Number(vehicle_id);
    const slotId = Number(slot_id);

    if (!effectiveUserId || !vehicleId || !slotId) {
      return res.status(400).json({ message: "vehicle_id and slot_id are required" });
    }

    await client.query("BEGIN");

    const vehicleCheck = await client.query(
      "SELECT id FROM vehicles WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL",
      [vehicleId, effectiveUserId]
    );

    if (!vehicleCheck.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Vehicle not found for this user" });
    }

    const existingActiveBooking = await client.query(
      "SELECT id FROM bookings WHERE vehicle_id=$1 AND status='active' LIMIT 1 FOR UPDATE",
      [vehicleId]
    );

    if (existingActiveBooking.rowCount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "This vehicle already has an active booking" });
    }

    const slotCheck = await client.query(
      "SELECT id, is_occupied FROM slots WHERE id=$1 FOR UPDATE",
      [slotId]
    );

    if (!slotCheck.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Slot not found" });
    }

    if (slotCheck.rows[0].is_occupied) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Slot occupied" });
    }

    await client.query(
      "UPDATE slots SET is_occupied=true WHERE id=$1",
      [slotId]
    );

    const booking = await client.query(
      `INSERT INTO bookings (
        user_id, vehicle_id, slot_id, entry_time, status, payment_status, pricing_rate_per_hour
      ) VALUES ($1,$2,$3,NOW(),'active','pending',$4) RETURNING *`,
      [effectiveUserId, vehicleId, slotId, DEFAULT_RATE_PER_HOUR]
    );

    const bookingDetails = await client.query(
      `${BOOKING_SELECT} WHERE b.id=$1`,
      [booking.rows[0].id]
    );

    await client.query("COMMIT");
    console.log("[ParkX BE][Booking] bookSlot success", {
      bookingId: bookingDetails.rows[0]?.id,
      slotId,
      vehicleId,
      userId: effectiveUserId,
    });
    res.status(201).json(bookingDetails.rows[0]);
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (_err) {
      // Ignore rollback failure after the main error.
    }
    console.error("[ParkX BE][Booking] bookSlot failed", err?.message || err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const exitParking = async (req, res) => {
  console.log("[EXIT PARKING] Request body:", req.body, "UserId:", req.userId);
  const client = await pool.connect();
  try {
    const { booking_id } = req.body;
    const bookingId = booking_id ? Number(booking_id) : null;
    const userId = Number(req.userId);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await client.query("BEGIN");

    const bookingCheck = bookingId
      ? await client.query(
          "SELECT * FROM bookings WHERE id=$1 AND user_id=$2 AND status='active' FOR UPDATE",
          [bookingId, userId]
        )
      : await client.query(
          "SELECT * FROM bookings WHERE user_id=$1 AND status='active' ORDER BY entry_time DESC LIMIT 1 FOR UPDATE",
          [userId]
        );

    if (!bookingCheck.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Active booking not found for this user" });
    }

    const booking = bookingCheck.rows[0];
    const exitTime = new Date();
    const durationMinutes = calculateDurationMinutes(booking.entry_time, exitTime);
    const totalAmount = calculateAmount(durationMinutes, booking.pricing_rate_per_hour);

    const updatedBooking = await client.query(
      `UPDATE bookings SET 
        exit_time=$1, duration_minutes=$2, total_amount=$3, status='completed', payment_status='paid' 
      WHERE id=$4 RETURNING *`,
      [exitTime, durationMinutes, totalAmount, booking.id]
    );

    await client.query(
      "UPDATE slots SET is_occupied=false WHERE id=$1",
      [booking.slot_id]
    );

    const bookingDetails = await client.query(
      `${BOOKING_SELECT} WHERE b.id=$1`,
      [updatedBooking.rows[0].id]
    );

    await client.query("COMMIT");
    console.log("[ParkX BE][Booking] exitParking success", {
      bookingId: bookingDetails.rows[0]?.id,
      userId,
      durationMinutes,
      totalAmount,
    });
    res.json(bookingDetails.rows[0]);
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (_err) {
      // Ignore rollback errors
    }
    console.error("[ParkX BE][Booking] exitParking failed", err?.message || err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req;

    const booking = await pool.query(
      `${BOOKING_SELECT} WHERE b.id=$1 AND b.user_id=$2`,
      [id, userId]
    );

    if (!booking.rowCount) {
      return res
        .status(404)
        .json({ message: "Booking not found or access denied" });
    }
    console.log("[ParkX BE][Booking] getBookingById success", { id, userId });
    res.json(booking.rows[0]);
  } catch (err) {
    console.error("[ParkX BE][Booking] getBookingById failed", err?.message || err);
    res.status(500).json({ error: err.message });
  }
};

export const getActiveBooking = async (req, res) => {
  try {
    const { userId } = req;
    const booking = await pool.query(
      `${BOOKING_SELECT} WHERE b.user_id=$1 AND b.status='active' ORDER BY b.entry_time DESC LIMIT 1`,
      [userId]
    );
    console.log("[ParkX BE][Booking] getActiveBooking success", {
      userId,
      bookingId: booking.rows[0]?.id || null,
    });
    res.json(booking.rows[0] || null);
  } catch (err) {
    console.error("[ParkX BE][Booking] getActiveBooking failed", err?.message || err);
    res.status(500).json({ error: err.message });
  }
};

export const getActiveBookings = async (req, res) => {
  try {
    const { userId } = req;
    const bookings = await pool.query(
      `${BOOKING_SELECT} WHERE b.user_id=$1 AND b.status='active' ORDER BY b.entry_time DESC`,
      [userId]
    );
    console.log("[ParkX BE][Booking] getActiveBookings success", {
      userId,
      count: bookings.rows.length,
    });
    res.json(bookings.rows || []);
  } catch (err) {
    console.error("[ParkX BE][Booking] getActiveBookings failed", err?.message || err);
    res.status(500).json({ error: err.message });
  }
};

export const getBookingHistory = async (req, res) => {
  try {
    const { userId } = req;
    const bookings = await pool.query(
      `${BOOKING_SELECT} WHERE b.user_id=$1 ORDER BY b.entry_time DESC`,
      [userId]
    );
    console.log("[ParkX BE][Booking] getBookingHistory success", {
      userId,
      count: bookings.rows.length,
    });
    res.json(bookings.rows);
  } catch (err) {
    console.error("[ParkX BE][Booking] getBookingHistory failed", err?.message || err);
    res.status(500).json({ error: err.message });
  }
};
