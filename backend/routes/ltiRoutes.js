const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

router.get("/generate-lti", (req, res) => {
    const payload = { user: "teacher123", role: "Instructor" };
    const token = jwt.sign(payload, process.env.LTI_SECRET);
    res.json({ lti_link: `https://lms.yoursite.com/lti?token=${token}` });
});

module.exports = router;
