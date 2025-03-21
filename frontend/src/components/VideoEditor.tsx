import { useState, useEffect } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import "@ffmpeg/ffmpeg/dist/ffmpeg.min.js";

const ffmpeg = createFFmpeg({ log: true });

const VideoEditor = () => {
    const [video, setVideo] = useState<File | null>(null);
    const [trimmedVideo, setTrimmedVideo] = useState<string>("");

    useEffect(() => {
        if (!ffmpeg.isLoaded()) {
            ffmpeg.load();
        }
    }, []);

    const handleTrim = async () => {
        if (!video) return;

        ffmpeg.FS("writeFile", "input.mp4", await fetchFile(video));
        await ffmpeg.run("-i", "input.mp4", "-ss", "00:00:05", "-to", "00:00:10", "-c", "copy", "output.mp4");
        const data = ffmpeg.FS("readFile", "output.mp4");

        const trimmedBlob = new Blob([data.buffer], { type: "video/mp4" });
        setTrimmedVideo(URL.createObjectURL(trimmedBlob));
    };

    return (
        <div>
            <h3>Video Editor</h3>
            <label htmlFor="video-upload">Upload Video</label>
            <input id="video-upload" type="file" accept="video/*" onChange={(e) => setVideo(e.target.files?.[0] || null)} />
            <button onClick={handleTrim}>Trim Video (5s-10s)</button>
            {trimmedVideo && <video src={trimmedVideo} controls />}
        </div>
    );
};

export default VideoEditor;
