import express from "express";
import {
  getAreas,
  getSlotsByArea,
} from "../controllers/slots.controller.js";

const router = express.Router();

router.get("/areas", getAreas);
router.get("/area/:areaId", getSlotsByArea);

export default router;
