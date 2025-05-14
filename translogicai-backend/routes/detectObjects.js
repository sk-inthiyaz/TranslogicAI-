const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const AZURE_CV_KEY = process.env.AZURE_CV_KEY;
const AZURE_CV_ENDPOINT = process.env.AZURE_CV_ENDPOINT;

// Multer setup for file uploads
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  try {
    const filePath = path.resolve(req.file.path);
    const fileStream = fs.readFileSync(filePath);
    // Use the latest GA Computer Vision API (v4.0)
    const response = await axios.post(
      `${AZURE_CV_ENDPOINT}/computervision/imageanalysis:analyze?api-version=2023-10-01&features=objects`,
      fileStream,
      {
        headers: {
          "Ocp-Apim-Subscription-Key": AZURE_CV_KEY,
          "Content-Type": "application/octet-stream",
        },
      }
    );
    fs.unlinkSync(filePath);
    res.json(response.data);
  } catch (err) {
    fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
    console.error("Azure object detection error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to detect objects", details: err.response?.data || err.message });
  }
});

module.exports = router;
