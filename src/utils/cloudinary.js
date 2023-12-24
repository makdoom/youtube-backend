import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
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
    return uploadedFile;
  } catch (error) {
    // Remove file from local as the uploading got failed
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export { uploadOnCloudinary };