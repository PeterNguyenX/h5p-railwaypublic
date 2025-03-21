import { useState } from "react";
import { Button, Container, Typography } from "@mui/material";
import axios from "axios";

const VideoUploader = () => {
    const [file, setFile] = useState<File | null>(null);

    const handleUpload = async () => {
        if (!file) return;
        const formData = new FormData();
        formData.append("video", file);
        await axios.post("/api/videos/upload", formData);
    };

    return (
        <Container>
            <Typography variant="h5">Upload Video</Typography>
            <label htmlFor="video-upload">Choose a video file:</label>
            <input id="video-upload" type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <Button variant="contained" color="primary" onClick={handleUpload}>Upload</Button>
        </Container>
    );
};

export default VideoUploader;
