import pool from "../db/pool";
import "../config/cloudinary";
import type { Request, Response } from "express";
import { AppError } from "../utiles/error.utiles";
import { asyncHandler } from "../middleware/asyncHandler";
import { uploadedImage } from "../middleware/uploadImage.middleware";

export const createNewsBlogForm = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { title, date, location } = req.body;

      if (typeof title !== "string" || !title.trim())
        throw new AppError("TITLE_ERROR");

      if (
        typeof location !== "string" ||
        location === undefined ||
        location === null ||
        !location.trim() ||
        location.trim().length > 200
      )
        throw new AppError("LOCATION_ERROR");

      if (
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ||
        new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
      ) {
        throw new AppError("DATE_ERROR");
      }

      if (!req.file) throw new AppError("IMAGE_ERROR");

      if (!req.file.mimetype.startsWith("image/"))
        throw new AppError("UPLOAD_ERROR");

      let imageURL: string;

      try {
        const uploadResult = await uploadedImage(req.file.buffer);
        imageURL = uploadResult.secure_url;
      } catch (error) {
        console.error("Cloudinary upload failed:", error);
        throw new AppError("IMAGE_UPLOAD_ERROR");
      }

      const result = await pool.query(
        `
        INSERT INTO news_blog_form (
            title,
            date,
            image_url,
            location
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [title.trim(), date, imageURL, location],
      );

      if (!result || result.rows.length === 0)
        throw new AppError("RESLUT_ERROR");

      res.status(200).json({
        message: "News Blog Form crate successfully!",
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error(error);
      throw new AppError("INTERNAL_SERVER_ERROR");
    }
  },
);

export const getNewsBlogsById = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      if (Number.isNaN(id)) throw new AppError("NEWS_ID_ERROR");

      const result = pool.query(
        `
            SELECT * FROM news_blog_form
            WHERE id = $1
            `,
        [id],
      );

      if (!result || (await result).rows.length === 0)
        throw new AppError("RESLUT_ERROR");

      res.status(200).json({
        message: "Get News is successfully!",
        success: true,
        data: (await result).rows[0],
      });
    } catch (error) {
      console.error(error);
      throw new AppError("INTERNAL_SERVER_ERROR");
    }
  },
);

export const getAllNewsBlog = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const result = pool.query(`
            SELECT * FROM  news_blog_form
            ORDER BY id
            DESC`);

      if (!result || (await result).rows.length === 0)
        throw new AppError("RESLUT_ERROR");

      res.status(200).json({
        message: "Get All news blog successfully!",
        success: true,
        data: (await result).rows,
      });
    } catch (error) {
      console.error(error);
      throw new AppError("INTERNAL_SERVER_ERROR");
    }
  },
);

const isValidIsoDate = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const d = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
};

export const newsBlogUpdate = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // get id from url
      const id = Number(req.params.id);

      // validate id
      if (Number.isNaN(id)) throw new AppError("NEWS_ID_ERROR");

      // get data from body
      const { title, date, location } = req.body ?? {};
      // validate body!
      if (
        typeof title !== "string" ||
        !title.trim() ||
        title.trim().length > 200
      )
        throw new AppError("TITLE_ERROR");

      if (!isValidIsoDate(date)) throw new AppError("DATE_ERROR");

      if (
        typeof location !== "string" ||
        location === undefined ||
        location === null ||
        !location.trim() ||
        location.trim().length > 200
      )
        throw new AppError("LOCATION_ERROR");

      const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];

      if (req.file && !ALLOWED_IMAGE_MIMES.includes(req.file.mimetype))
        throw new AppError("UPLOAD_ERROR");

      const existing = pool.query(
        `
            SELECT 1 FROM news_blog_form
            WHERE id = $1`,
        [id],
      );

      if ((await existing).rowCount === 0) throw new AppError("NEWS_NOT_FOUND");

      let imageURL: string | null = null;

      if (req.file) {
        try {
          imageURL = (await uploadedImage(req.file.buffer)).secure_url;
        } catch (error) {
          console.error("Cloudinary upload failed:", error);
          throw new AppError("IMAGE_UPLOAD_ERROR");
        }
      }

      const result = pool.query(
        `UPDATE news_blog_form
            SET
              title = $1,
              date = $2,
              location = $3,
              image_url = COALESCE($4, image_url)
            WHERE id = $5
            RETURNING *`,
        [title, date, location, imageURL, id],
      );

      if (!result || (await result).rows.length === 0)
        throw new AppError("RESLUT_ERROR");

      res.status(200).json({
        message: "News Blog update successfully!",
        success: true,
        data: (await result).rows[0],
      });
    } catch (error) {
      console.error(error);
      throw new AppError("INTERNAL_SERVER_ERROR");
    }
  },
);

export const deleteNewsBlog = asyncHandler( async (req: Request, res: Response) => {
    try {
      
      const id = Number(req.params.id);
      
      if(Number.isNaN(id)) throw new AppError("NEWS_ID_ERROR")

      const reslut = pool.query(
        `DELETE FROM news_blog_form
        WHERE id = $1
        RETURNING *`, 
        [
          id
        ]
      )

      if(!reslut || (await reslut).rows.length === 0) throw new AppError("RESLUT_ERROR")

      res.status(200).json({
        message: "News Delete successfully!",
        success: true
      })

    } catch (error) {
      console.error(error);
      throw new AppError("INTERNAL_SERVER_ERROR");
    }
  },
);
