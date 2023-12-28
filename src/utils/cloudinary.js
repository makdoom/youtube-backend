import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const uploadedFile = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    if (uploadedFile) {
      console.log(
        `File has been uploaded successfully on ⛅️ \nFile URL: ${uploadedFile.url}`
      );
    }

    // Unlink local files
    fs.unlinkSync(localFilePath);
    return uploadedFile;
  } catch (error) {
    // Remove file from local as the uploading got failed
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteOnCloudinary = async (filePublicId) => {
  try {
    if (!filePublicId) return null;

    const uploadedFile = await cloudinary.uploader.destroy(filePublicId, {
      resource_type: "auto",
    });

    return uploadedFile;
  } catch (error) {
    throw new ApiError(500, "Error while removing old avatar file");
  }
};

export { uploadOnCloudinary, deleteOnCloudinary };
