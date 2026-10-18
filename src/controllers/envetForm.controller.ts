import pool from "../db/pool";
import "../config/cloudinary";
import { env } from "../config/session";
import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { AppError } from "../utiles/error.utiles";
import { uploadedImage } from "../middleware/uploadImage.middleware";
// create
export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { title, tickets, event_date, tickets_type } = req.body ?? {};

    if (typeof title !== "string" || !title.trim()) {
      throw new AppError("TITLE_ERROR");
    }

    const ticketCount = Number(tickets);

    if (
      tickets === undefined ||
      tickets === null ||
      tickets === "" ||
      !Number.isInteger(ticketCount) ||
      ticketCount <= 0
    ) {
      throw new AppError("TICKECTS_ERROR");
    }

    if (
      typeof event_date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(event_date) ||
      Number.isNaN(Date.parse(`${event_date}T00:00:00Z`)) ||
      new Date(`${event_date}T00:00:00Z`).toISOString().slice(0, 10) !==
        event_date
    ) {
      throw new AppError("DATE_ERROR");
    }

    const allowedTypes = ["Gala", "Summit", "Youth"];

    if (
      typeof tickets_type !== "string" ||
      !allowedTypes.includes(tickets_type)
    ) {
      throw new AppError("TICKETS_TYPE_ERROR");
    }

    if (!req.file) {
      throw new AppError("IMAGE_ERROR");
    }

    if (!req.file.mimetype.startsWith("image/")) {
      throw new AppError("UPLOAD_ERROR");
    }

    let imageUrl: string;

    try {
      
      const uploadResult = await uploadedImage(req.file.buffer);
      imageUrl = uploadResult.secure_url;
    
    } catch (error) {
      console.error("Cloudinary upload failed:", error);
      throw new AppError("IMAGE_UPLOAD_ERROR");
    }

    const result = await pool.query(
      `INSERT INTO event_forms
        (title, tickets, image_url, event_date, tickets_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title.trim(), ticketCount, imageUrl, event_date, tickets_type],
    );

    if (!result) throw new AppError("RESLUT_ERROR");

    res.status(200).json({
      message: "Event form create successfully",
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    throw new AppError("INTERNAL_SERVER_ERROR");
  }
});

// get event
export const getEventById = asyncHandler( async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      if (Number.isNaN(id)) throw new AppError("EVENT_ID_ERROR");

      const result = pool.query(
        `SELECT * FROM event_forms
      WHERE id = $1`,
        [id],
      );

      if (!result || (await result).rows.length === 0)
        throw new AppError("RESLUT_ERROR");

      res.status(200).json({
        message: "Fetch Events Successfully!",
        success: true,
        data: (await result).rows[0],
      });
    } catch (error) {
      console.error(error);
      throw new AppError("INTERNAL_SERVER_ERROR");
    }
  },
);

// get all event
export const getAllEvents = asyncHandler(async (req: Request, res: Response) => {
    try {
      const result = pool.query(
        `SELECT * FROM event_forms
       ORDER BY id 
      DESC
      `,
      );

      if (!result || (await result).rows.length === 0)
        throw new AppError("RESLUT_ERROR");

      res.status(200).json({
        message: "Get Event successfully!",
        success: true,
        data: (await result).rows,
      });
    } catch (error) {
      console.error(error);
      throw new AppError("INTERNAL_SERVER_ERROR");
    }
  },
);


const ALLOWED_TYPES: readonly string[] = ["Gala", "Summit", "Youth"];
const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];
const MAX_TICKETS = 1_000_000;

const isValidIsoDate = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
};


// update event

export const eventUpdate = asyncHandler(async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) throw new AppError("EVENT_ID_ERROR");

    const { title, tickets, event_date, tickets_type } = req.body ?? {};

    if (typeof title !== "string" || !title.trim() || title.trim().length > 200)  throw new AppError("TITLE_ERROR");

    const ticketCount = Number(tickets);

    if (
      !Number.isInteger(ticketCount) ||
      ticketCount <= 0 ||
      ticketCount > MAX_TICKETS
    )
      throw new AppError("TICKECTS_ERROR");

    if (!isValidIsoDate(event_date)) throw new AppError("DATE_ERROR");

    if (
      typeof tickets_type !== "string" ||
      !ALLOWED_TYPES.includes(tickets_type)
    )
      throw new AppError("TICKETS_TYPE_ERROR");

    if (req.file && !ALLOWED_IMAGE_MIMES.includes(req.file.mimetype))
      throw new AppError("UPLOAD_ERROR");

    const existing = await pool.query(
      `SELECT 1 FROM event_forms 
     WHERE id = $1`,
      [id],
    );
    if (existing.rowCount === 0) throw new AppError("EVENT_NOT_FOUND");

    let imageUrl: string | null = null;

    if (req.file) {
      try {
      
        imageUrl = (await uploadedImage(req.file.buffer)).secure_url;
      
      } catch (error) {
        console.error("Cloudinary upload failed:", error);
        throw new AppError("IMAGE_UPLOAD_ERROR");
      }
    }

    const { rows } = await pool.query(
      `UPDATE event_forms
       SET 
         title = $1,
         tickets = $2,
         image_url = COALESCE($3, image_url),
         event_date = $4,
         tickets_type = $5
     WHERE id = $6
     RETURNING *`,
      [title.trim(), ticketCount, imageUrl, event_date, tickets_type, id],
    );

    if (rows.length === 0) throw new AppError("EVENT_NOT_FOUND");

    res.status(200).json({
      message: "Event updated successfully!",
      success: true,
      data: rows[0],
    });

  } catch (error) {
    
    console.error(error);
    throw new AppError("INTERNAL_SERVER_ERROR")
    
  }
});

// delect event
export const deleteEvent = asyncHandler (async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if(Number.isNaN(id)) throw new AppError("EVENT_ID_ERROR")

    const result = pool.query(
      `DELETE FROM event_forms
      WHERE id = $1
      RETURNING *;`, 
      [
        id
      ]
    )

    if(!result || (await result).rows.length === 0) throw new AppError("RESLUT_ERROR")

    res.status(200).json({
      message: "Event delete successfully!",
      success: true
    })


  } catch (error) {
    
    console.error(error);
    throw new AppError("INTERNAL_SERVER_ERROR")
        
  }
})
