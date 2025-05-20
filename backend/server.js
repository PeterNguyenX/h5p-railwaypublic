require('dotenv').config();
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const authRoutes = require("./routes/authRoutes");
const videoRoutes = require("./routes/videoRoutes");
const h5pRoutes = require("./routes/h5pRoutes");
const templateRoutes = require("./routes/templateRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const ltiRoutes = require("./routes/ltiRoutes");

dotenv.config();
const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://103.88.123.117'
];

// Enable CORS for development and production
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Serve static files from the uploads/videos directory
app.use('/uploads/videos', express.static(path.join(__dirname, 'uploads/videos')));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/h5p", h5pRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/lti", ltiRoutes);

// Video streaming endpoint
app.get("/video/:videoPath", (req, res) => {
  const range = req.headers.range;
  if (!range) {
    res.status(400).send("Requires Range header");
    return;
  }

  const videoPath = path.join(__dirname, "uploads/videos", req.params.videoPath);
  let videoSize;
  try {
    videoSize = fs.statSync(videoPath).size;
  } catch {
    res.status(404).send("Video not found");
    return;
  }

  const chunkSize = 1 * 1e6; // 1MB chunks
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + chunkSize, videoSize - 1);
  const contentLength = end - start + 1;
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };

  res.writeHead(206, headers);
  const stream = fs.createReadStream(videoPath, { start, end });
  stream.pipe(res);
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, "../frontend/build")));
  
  // The "catchall" handler: for any request that doesn't match one above, send back index.html
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
