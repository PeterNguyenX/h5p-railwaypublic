# Video File Organization

## 📁 **Improved File Structure**

After the optimization, when you upload a video, here's the cleaner file organization:

### **Before (Confusing)**
```
uploads/
├── videos/
│   └── videoname.mov                    # Original uploaded file
├── hls/
│   ├── videoname-compressed.mp4         # Compressed file (loose)
│   └── videoname/                       # HLS directory
│       ├── stream.m3u8                  # HLS playlist
│       ├── thumbnail.jpg                # Video thumbnail
│       └── segment*.ts                  # Video segments
```

### **After (Clean & Organized)**
```
uploads/
├── videos/
│   └── videoname.mov                    # Original uploaded file
└── hls/
    └── videoname/                       # All processed files in one place
        ├── videoname.mp4                # Compressed video
        ├── stream.m3u8                  # HLS playlist
        ├── thumbnail.jpg                # Video thumbnail
        └── segment*.ts                  # Video segments
```

## 🔄 **Processing Flow**

1. **Upload**: Original file saved to `/uploads/videos/`
2. **Create Directory**: Video-specific folder created in `/uploads/hls/videoname/`
3. **Compress**: Optimized MP4 saved inside the video folder
4. **Generate Thumbnail**: Thumbnail created from compressed video
5. **HLS Conversion**: Streaming files generated in the same folder

## 📊 **Benefits**

### ✅ **Organization**
- All processed files for a video are in one directory
- No more loose compressed files in the root HLS folder
- Easier to manage and clean up files

### ✅ **Performance Tracking**
- File size comparison logging (original vs compressed)
- Compression ratio calculation
- Better monitoring of processing efficiency

### ✅ **Space Management**
- Optional cleanup of original files after processing
- Clear visibility of storage usage
- Compression statistics for optimization

## 🛠️ **Configuration Options**

### **Keep Original Files** (Default)
```javascript
// Original files are preserved for backup/re-processing
// Both original and compressed versions exist
```

### **Auto-cleanup Original Files** (Optional)
```javascript
// Uncomment this line in videoRoutes.js to save space:
await videoProcessor.cleanupOriginalFile(videoPath);
```

## 📈 **File Size Monitoring**

The system now logs:
- Original file size in MB
- Compressed file size in MB  
- Compression ratio percentage
- Processing completion status

Example output:
```
[UPLOAD] Video processing complete:
  - Original size: 45.8 MB
  - Compressed size: 12.3 MB
  - Compression ratio: 26.9%
```

## 🗂️ **Directory Structure Example**

```
uploads/
├── videos/                              # Original uploads
│   ├── presentation.mov                 # 45.8 MB
│   ├── tutorial.mp4                     # 32.1 MB
│   └── demo.mov                         # 67.2 MB
└── hls/                                # Processed videos
    ├── presentation/
    │   ├── presentation.mp4             # 12.3 MB (compressed)
    │   ├── stream.m3u8                  # HLS playlist
    │   ├── thumbnail.jpg                # Thumbnail
    │   ├── segment0.ts                  # Video chunks
    │   ├── segment1.ts
    │   └── ...
    ├── tutorial/
    │   ├── tutorial.mp4                 # 8.7 MB (compressed)
    │   ├── stream.m3u8
    │   ├── thumbnail.jpg
    │   └── segment*.ts
    └── demo/
        ├── demo.mp4                     # 18.1 MB (compressed)
        ├── stream.m3u8
        ├── thumbnail.jpg
        └── segment*.ts
```

This organization makes it much easier to:
- Find all files related to a specific video
- Calculate storage usage per video
- Clean up or archive video sets
- Debug processing issues
- Manage backups and transfers
