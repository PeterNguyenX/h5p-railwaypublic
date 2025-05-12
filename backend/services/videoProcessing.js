const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;

class VideoProcessingService {
  constructor() {
    // No initialization needed for fluent-ffmpeg
  }

  async generateThumbnail(videoPath, outputPath) {
    console.log(`Generating thumbnail for video: ${videoPath}, output: ${outputPath}`);
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['00:00:01'], // Take thumbnail from first second
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '640x360' // 16:9 aspect ratio
        })
        .on('end', () => {
          console.log(`Thumbnail generated successfully: ${outputPath}`);
          resolve();
        })
        .on('error', (error) => {
          console.error(`Error generating thumbnail for video: ${videoPath}`, error);
          reject(error);
        });
    });
  }

  async getVideoDuration(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) reject(err);
        resolve(Math.floor(metadata.format.duration));
      });
    });
  }

  async processVideo(videoPath, outputDir) {
    const videoId = path.basename(videoPath, path.extname(videoPath));
    const hlsDir = path.join(outputDir, videoId);

    // Create HLS directory
    await fs.mkdir(hlsDir, { recursive: true });

    // Compress video before processing
    const compressedPath = path.join(outputDir, `${videoId}-compressed.mp4`);
    await this.compressVideo(videoPath, compressedPath);

    // Generate thumbnail
    const thumbnailPath = path.join(hlsDir, 'thumbnail.jpg');
    await this.generateThumbnail(compressedPath, thumbnailPath);

    // Convert to HLS
    const hlsPath = path.join(hlsDir, 'stream.m3u8');
    await this.convertToHLS(compressedPath, hlsDir);

    return {
      thumbnailPath: path.relative(process.cwd(), thumbnailPath),
      hlsPath: path.relative(process.cwd(), hlsPath)
    };
  }

  async convertToHLS(videoPath, outputDir) {
    const outputPath = path.join(outputDir, 'stream.m3u8');
    
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([
          '-profile:v baseline',
          '-level 3.0',
          '-start_number 0',
          '-hls_time 10',
          '-hls_list_size 0',
          '-f hls',
          '-hls_segment_filename', path.join(outputDir, 'segment%d.ts'),
          '-vf', 'scale=-2:720', // Scale to 720p while maintaining aspect ratio
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-b:a', '128k'
        ])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  async trimVideo(inputPath, outputPath, startTime, endTime) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  async compressVideo(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',
          '-crf 23', // Compression level (lower is better quality)
          '-preset medium', // Compression speed
          '-c:a aac',
          '-b:a 128k'
        ])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  async extractAudio(videoPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .toFormat('mp3')
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });
  }

  async cleanupFiles(files) {
    for (const file of files) {
      try {
        await fs.unlink(file);
      } catch (error) {
        console.error(`Error deleting file ${file}:`, error);
      }
    }
  }
}

module.exports = VideoProcessingService;