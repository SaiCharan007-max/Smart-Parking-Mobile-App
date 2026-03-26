import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  addVehicle,
  getUserVehicles,
  deleteVehicle,
} from "../controllers/vehicle.controller.js";

const router = express.Router();

router.post("/", authMiddleware, addVehicle);
router.get("/", authMiddleware, getUserVehicles);
router.delete("/:id", authMiddleware, deleteVehicle);

export default router;