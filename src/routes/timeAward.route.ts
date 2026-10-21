import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import upload, { handleUpload } from "../config/multer";
import {
  createApplication,
  getApplicationById,
  getApplications,
} from "../controllers/timesAward.controller";

const router = Router();

router.post("/", handleUpload, createApplication);
router.get("/", getApplications);
router.get("/:id", getApplicationById);

export default router;
