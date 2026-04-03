import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  enrollContact,
  getEnrollments,
  getEnrollmentByContact,
} from "../controllers/enrollmentController.js";

const router = express.Router();

router.post("/", requireAuth, enrollContact);
router.get("/", requireAuth, getEnrollments);
router.get("/contact/:contactId", requireAuth, getEnrollmentByContact);

export default router;