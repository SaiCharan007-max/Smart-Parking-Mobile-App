import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  bookSlot,
  exitParking,
  getBookingHistory,
  getActiveBooking,
  getActiveBookings,
  getBookingById,
} from "../controllers/booking.controller.js";

const router = express.Router();

router.post("/", authMiddleware, bookSlot);
router.post("/exit", authMiddleware, exitParking);
router.get("/active", authMiddleware, getActiveBooking);
router.get("/active/all", authMiddleware, getActiveBookings);
router.get("/history", authMiddleware, getBookingHistory);
router.get("/:id", authMiddleware, getBookingById);


export default router;
