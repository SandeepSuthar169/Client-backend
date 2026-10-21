import pool from "../db/pool";
// import "../config/cloudinary";
import type { Request, Response } from "express";
import { AppError } from "../utiles/error.utiles";
import { asyncHandler } from "../middleware/asyncHandler";

import type { UploadApiResponse } from "cloudinary";
import cloudinary from "../config/cloudinary"; 
import { uploadedImage } from "../middleware/uploadImage.middleware";
import {
  AWARD_CATEGORIES,
  COUNTRIES,
  PROFESSIONAL_TITLES,
} from "../config/content";



type UploadedFiles = Record<string, Express.Multer.File[] | undefined>;

// NOT NULL text columns -> max length (undefined = TEXT, no limit)
const REQUIRED_TEXT_FIELDS: Record<string, number | undefined> = {
  full_name: 150,
  email: 254,
  city: 100,
  organization: 200,
  biography_profile: undefined,
  impact_on_people: undefined,
  explanation_of_impact: undefined,
  applicant_representative_name: 150,
};

// Nullable text columns
const OPTIONAL_TEXT_FIELDS: Record<string, number | undefined> = {
  phone_number: 25,
  major_achievements: undefined,
  why_candidate_deserves_award: undefined,
};

// Videos are stored as TEXT. Multer only accepts images, so these are links
// (YouTube, Google Drive, Vimeo, etc.).
const VIDEO_FIELDS = [
  "video_1_personal_introduction",
  "video_2_achievements_and_work",
  "video_3_evidence_of_impact",
  "video_4_award_statement_and_vision",
] as const;

// NOT NULL image columns, uploaded as multipart files
const REQUIRED_IMAGE_FIELDS = [
  "formal_portrait_photograph",
  "photo_1_candidate_performing",
  "photo_2_showing_project",
] as const;

// Nullable image column (signature_storage_path), uploaded as multipart file
const SIGNATURE_FIELD = "signature";



const asString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const asBoolean = (value: unknown): boolean =>
  value === true ||
  (typeof value === "string" &&
    ["true", "1", "on", "yes"].includes(value.trim().toLowerCase()));

const isOneOf = (list: readonly string[], value: string): boolean =>
  list.includes(value);

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const isIsoDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s()-]{6,25}$/;


function validateApplication(body: Record<string, unknown>, files: UploadedFiles) {
  const errors: Record<string, string> = {};
  const fields: Record<string, string | boolean | null> = {};

  // Enum / check-constraint fields
  const awardCategory = asString(body.award_category);
  if (!isOneOf(AWARD_CATEGORIES, awardCategory)) {
    errors.award_category = "Select a valid award category";
  }
  fields.award_category = awardCategory;

  const country = asString(body.country);
  if (!isOneOf(COUNTRIES, country)) {
    errors.country = "Select a valid country";
  }
  fields.country = country;

  const professionalTitle = asString(body.professional_title);
  if (!isOneOf(PROFESSIONAL_TITLES, professionalTitle)) {
    errors.professional_title = "Select a valid professional title";
  }
  fields.professional_title = professionalTitle;

  // Required text fields
  for (const [key, max] of Object.entries(REQUIRED_TEXT_FIELDS)) {
    const value = asString(body[key]);
    if (!value) errors[key] = "This field is required";
    else if (max && value.length > max) errors[key] = `Must be at most ${max} characters`;
    fields[key] = value;
  }

  // Optional text fields (empty -> NULL)
  for (const [key, max] of Object.entries(OPTIONAL_TEXT_FIELDS)) {
    const value = asString(body[key]);
    if (value && max && value.length > max) {
      errors[key] = `Must be at most ${max} characters`;
    }
    fields[key] = value || null;
  }

  // Format checks
  const email = String(fields.email ?? "").toLowerCase();
  if (email && !errors.email && !EMAIL_REGEX.test(email)) {
    errors.email = "Enter a valid email address";
  }
  fields.email = email;

  if (fields.phone_number && !PHONE_REGEX.test(String(fields.phone_number))) {
    errors.phone_number = "Enter a valid phone number";
  }

  // Video links
  for (const key of VIDEO_FIELDS) {
    const value = asString(body[key]);
    if (!value) errors[key] = "A video link is required";
    else if (!isHttpUrl(value)) errors[key] = "Must be a valid http(s) link";
    fields[key] = value;
  }

  // Required image files
  for (const key of REQUIRED_IMAGE_FIELDS) {
    if (!files[key]?.[0]) errors[key] = "An image file is required";
  }

  // Declaration & consent
  const consent = asBoolean(body.consent_to_submit_media);
  const declaration = asBoolean(body.declaration_accepted);
  if (!consent) errors.consent_to_submit_media = "Consent is required to submit";
  if (!declaration) errors.declaration_accepted = "You must accept the declaration";
  fields.consent_to_submit_media = consent;
  fields.declaration_accepted = declaration;

  const declarationDate = asString(body.declaration_date);
  if (!declarationDate) errors.declaration_date = "This field is required";
  else if (!isIsoDate(declarationDate)) errors.declaration_date = "Use format YYYY-MM-DD";
  fields.declaration_date = declarationDate;

  return { errors, fields };
}


function sendError(res: Response, error: unknown, message: string) {
  const code = (error as { code?: string })?.code;

  // Postgres: invalid enum value / not-null violation / check violation
  if (code === "22P02" || code === "23502" || code === "23514") {
    return res.status(400).json({
      success: false,
      message: "Submitted data was rejected by the database",
    });
  }

  console.error(`[africa_time_award] ${message}:`, error);
  return res.status(500).json({ success: false, message });
}



export async function createApplication(req: Request, res: Response) {

  const files = (req.files ?? {}) as UploadedFiles;
  const { errors, fields } = validateApplication(req.body ?? {}, files);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  const uploaded: UploadApiResponse[] = [];

  try {
    const uploadField = async (field: string): Promise<string | null> => {
      const file = files[field]?.[0];
      if (!file) return null;
      const result = await uploadedImage(file.buffer);
      uploaded.push(result);
      return result.secure_url;
    };

    const uploadFieldNames = [...REQUIRED_IMAGE_FIELDS, SIGNATURE_FIELD];
    const settled = await Promise.allSettled(uploadFieldNames.map(uploadField));

    const failed = settled.find((r) => r.status === "rejected");
    if (failed) throw (failed as PromiseRejectedResult).reason;

    const urls = settled.map((r) => (r as PromiseFulfilledResult<string | null>).value);
    const [portrait, photo1, photo2, signature] = urls;

    const record: Record<string, unknown> = {
      award_category: fields.award_category,
      full_name: fields.full_name,
      email: fields.email,
      phone_number: fields.phone_number,
      country: fields.country,
      city: fields.city,
      professional_title: fields.professional_title,
      organization: fields.organization,
      biography_profile: fields.biography_profile,
      major_achievements: fields.major_achievements,
      impact_on_people: fields.impact_on_people,
      why_candidate_deserves_award: fields.why_candidate_deserves_award,
      formal_portrait_photograph: portrait,
      video_1_personal_introduction: fields.video_1_personal_introduction,
      video_2_achievements_and_work: fields.video_2_achievements_and_work,
      video_3_evidence_of_impact: fields.video_3_evidence_of_impact,
      video_4_award_statement_and_vision: fields.video_4_award_statement_and_vision,
      photo_1_candidate_performing: photo1,
      photo_2_showing_project: photo2,
      explanation_of_impact: fields.explanation_of_impact,
      consent_to_submit_media: fields.consent_to_submit_media,
      declaration_accepted: fields.declaration_accepted,
      applicant_representative_name: fields.applicant_representative_name,
      signature_storage_path: signature,
      declaration_date: fields.declaration_date,
    };

    // Column names come from the object above (never from user input)
    const columns = Object.keys(record);
    const placeholders = columns.map((_, i) => `$${i + 1}`);

    const { rows } = await pool.query(
      `INSERT INTO africa_time_award (${columns.join(", ")})
       VALUES (${placeholders.join(", ")})
       RETURNING *`,
      Object.values(record),
    );

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: rows[0],
    });
  } catch (error) {
    // Don't leave orphaned images in Cloudinary if anything above failed
    await Promise.allSettled(
      uploaded.map((r) => cloudinary.uploader.destroy(r.public_id)),
    );
    return sendError(res, error, "Failed to submit application");
  }
}


export async function getApplications(req: Request, res: Response) {
  try {
    const page = Math.max(parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(String(req.query.limit ?? "20"), 10) || 20, 1),
      100,
    );
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];

    const awardCategory = asString(req.query.award_category);
    if (awardCategory) {
      if (!isOneOf(AWARD_CATEGORIES, awardCategory)) {
        return res.status(400).json({ success: false, message: "Invalid award_category" });
      }
      params.push(awardCategory);
      conditions.push(`award_category = $${params.length}`);
    }

    const country = asString(req.query.country);
    if (country) {
      if (!isOneOf(COUNTRIES, country)) {
        return res.status(400).json({ success: false, message: "Invalid country" });
      }
      params.push(country);
      conditions.push(`country = $${params.length}`);
    }

    const search = asString(req.query.search);
    if (search) {
      params.push(`%${search}%`);
      conditions.push(
        `(full_name ILIKE $${params.length} OR organization ILIKE $${params.length})`,
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [list, count] = await Promise.all([
      pool.query(
        `SELECT id, award_category, full_name, email, country, city,
                professional_title, organization, formal_portrait_photograph,
                submitted_at
         FROM africa_time_award
         ${where}
         ORDER BY submitted_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset],
      ),
      pool.query(`SELECT COUNT(*)::int AS total FROM africa_time_award ${where}`, params),
    ]);

    const total: number = count.rows[0].total;

    return res.json({
      success: true,
      data: list.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return sendError(res, error, "Failed to fetch applications");
  }
}



export async function getApplicationById(req: Request, res: Response) {
  const id = String(req.params.id ?? "");

  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ success: false, message: "Invalid application id" });
  }

  try {
    const { rows } = await pool.query(
      "SELECT * FROM africa_time_award WHERE id = $1",
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    return sendError(res, error, "Failed to fetch application");
  }
}