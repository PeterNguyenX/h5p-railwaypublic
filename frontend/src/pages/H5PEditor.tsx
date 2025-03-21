import { useState } from "react";
import axios from "axios";

const H5PEditor = () => {
    const [file, setFile] = useState<File | null>(null);

    const handleUpload = async () => {
        if (!file) return;
        const formData = new FormData();
        formData.append("video", file);
        await axios.post("/api/videos/upload", formData);
    };

    return (
        <div>
            <h2>Upload Video</h2>
            <label htmlFor="videoUpload">Upload a video:</label>
            <input id="videoUpload" type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button onClick={handleUpload}>Upload</button>
        </div>
    );
};

export default H5PEditor;
