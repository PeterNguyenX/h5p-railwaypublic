const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { Video } = require("../models");

// Generate LTI link for a video
router.get("/generate/:videoId", async (req, res) => {
  try {
    const video = await Video.findOne({
      where: { id: req.params.videoId }
    });

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    const payload = { 
      videoId: video.id,
      title: video.title,
      type: 'h5p'
    };
    
    const token = jwt.sign(payload, process.env.LTI_SECRET, { expiresIn: '1y' });
    const ltiLink = `${process.env.APP_URL}/lti/embed/${token}`;
    
    res.json({ ltiLink });
  } catch (error) {
    console.error("Error generating LTI link:", error);
    res.status(500).json({ error: "Error generating LTI link" });
  }
});

// LTI launch endpoint
router.post("/launch", (req, res) => {
  // This is a simplified LTI launch endpoint
  // In a real implementation, you would validate the LTI request
  // and handle the OAuth flow
  
  const { videoId, title, type } = req.body;
  
  if (!videoId) {
    return res.status(400).json({ error: "Video ID is required" });
  }
  
  // Generate a session token for the LTI user
  const payload = { 
    videoId,
    title,
    type,
    role: 'student',
    lti: true
  };
  
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  
  // Redirect to the video player with the token
  res.redirect(`${process.env.FRONTEND_URL}/lti/player/${token}`);
});

// LTI embed endpoint
router.get("/embed/:token", async (req, res) => {
  try {
    const { token } = req.params;
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.LTI_SECRET);
    const { videoId } = decoded;
    
    // Get the video
    const video = await Video.findOne({
      where: { id: videoId }
    });
    
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }
    
    // Render the LTI embed page
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${video.title}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link rel="stylesheet" href="/path/to/your/styles.css">
          <script src="https://h5p.org/sites/all/modules/h5p/library/js/h5p-resizer.js" charset="UTF-8"></script>
        </head>
        <body class="lti-body">
          <div class="lti-container">
            <iframe 
              src="${process.env.FRONTEND_URL}/api/h5p/content/${video.id}" 
              width="100%" 
              height="100%" 
              frameborder="0" 
              allowfullscreen="allowfullscreen"
              allow="geolocation *; microphone *; camera *; midi *; encrypted-media *">
            </iframe>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error embedding LTI content:", error);
    res.status(500).json({ error: "Error embedding LTI content" });
  }
});

module.exports = router;
