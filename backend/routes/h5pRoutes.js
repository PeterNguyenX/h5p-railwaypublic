const express = require("express");
const router = express.Router();
const fs = require("fs");

// Load H5P template
router.get("/get-template", (req, res) => {
    const template = fs.readFileSync("templates/sample-h5p.json");
    res.json(JSON.parse(template));
});

module.exports = router;
