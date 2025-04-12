const multer = require("multer")

const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
    // Allowed mime types for images and PDFs
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
  
    // Check if the file mimetype matches the allowed types
    const isValid = allowedTypes.test(file.mimetype);
  
    if (isValid) {
      cb(null, true); // File is valid, proceed
    } else {
      cb(new Error("Invalid file type, only images and PDFs are allowed!"), false); // Reject the file
    }
  };

const upload = multer({
    storage:storage,
    fileFilter:fileFilter
})

module.exports = upload