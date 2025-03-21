const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");

const s3 = new AWS.S3({ region: "us-east-1" });

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: "your-s3-bucket",
        key: (req, file, cb) => cb(null, `videos/${Date.now()}-${file.originalname}`)
    })
});

router.post("/upload", upload.single("video"), (req, res) => {
    res.json({ url: req.file.location });
});
