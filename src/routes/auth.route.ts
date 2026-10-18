import { Router } from "express";

import {
  login,
  getMe,
  logout,
  getAllUsers,
} from "../controllers/auth.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
const router = Router();

router.post("/login", login);
router.get("/me", requireAuth, getMe);
router.post("/logout", requireAuth, logout);
router.get("/users", requireAuth, requireRole("admin"), getAllUsers);

export default router;
