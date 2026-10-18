import type { UploadApiResponse } from "cloudinary";
import { v2 as cloudinary, } from "cloudinary";

export function uploadedImage(buffer: Buffer): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "sample/Africa",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Cloudinary returned no result"));

        resolve(result);
      },
    );
    stream.end(buffer);
  });
}