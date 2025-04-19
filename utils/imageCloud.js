const path = require("path");
const cloudinary = require("cloudinary").v2;
const AppError = require("./AppError");

// Configure Cloudinary globally
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return next();

    // Create a unique public_id
    const public_id = `gp/${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    // Convert Buffer to a data URI for Cloudinary
    const dataUri = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "gp",
      format: "png",
      public_id: public_id,
      resource_type: "auto",
    });

    req.body.photo = result.secure_url;
    next();
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return next(new AppError("Image upload failed", 500));
  }
};

exports.uploadDoctorFiles = async (req, res, next) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) return next();

    const uploadPromises = Object.entries(req.files).map(
      async ([fieldName, fileArray]) => {
        // We assume each field has only 1 file
        const file = fileArray[0];

        const public_id = `gp/${fieldName}-${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}`;
        const dataUri = `data:${file.mimetype};base64,${file.buffer.toString(
          "base64"
        )}`;

        const result = await cloudinary.uploader.upload(dataUri, {
          folder: "gp",
          public_id,
          format: "png",
          resource_type: "auto",
        });

        // Attach the Cloudinary URL back to req.body
        req.body[fieldName] = result.secure_url;
      }
    );

    await Promise.all(uploadPromises);
    next();
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return next(new AppError("File upload failed", 500));
  }
};
