import type { NextFunction, Request, Response } from "express";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

export default upload;

const uploadFields = upload.fields([
  { name: "formal_portrait_photograph", maxCount: 1 },
  { name: "photo_1_candidate_performing", maxCount: 1 },
  { name: "photo_2_showing_project", maxCount: 1 },
  { name: "signature", maxCount: 1 },
]);

export function handleUpload(req: Request, res: Response, next: NextFunction) {
  uploadFields(req, res, (err: unknown) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Each image must be 5 MB or smaller"
          : err.code === "LIMIT_UNEXPECTED_FILE"
            ? `Unexpected file field: ${err.field}`
            : err.message;
      return res.status(400).json({ success: false, message });
    }

    return res.status(400).json({
      success: false,
      message: err instanceof Error ? err.message : "File upload failed",
    });
  });
}
