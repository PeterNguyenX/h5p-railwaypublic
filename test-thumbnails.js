const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const BASE_URL = 'http://localhost:3001';

async function testThumbnailSystem() {
  console.log('🔍 Testing Thumbnail System...\n');

  try {
    // Test 1: Default thumbnail availability
    console.log('1. Testing default thumbnail...');
    const defaultResponse = await axios.get(`${BASE_URL}/api/default-thumbnail.svg`);
    console.log(`✅ Default thumbnail: ${defaultResponse.status} ${defaultResponse.statusText}`);
    console.log(`   Content-Type: ${defaultResponse.headers['content-type']}`);
    console.log(`   Content-Length: ${defaultResponse.headers['content-length']} bytes\n`);

    // Test 2: Check if any video thumbnails exist
    console.log('2. Checking for existing video thumbnails...');
    const hlsDir = path.join(__dirname, 'backend/uploads/hls');
    
    try {
      const videoFolders = await fs.readdir(hlsDir);
      let foundThumbnails = 0;
      
      for (const folder of videoFolders) {
        if (folder === '.DS_Store') continue;
        
        const thumbnailPath = path.join(hlsDir, folder, 'thumbnail.jpg');
        try {
          await fs.access(thumbnailPath);
          console.log(`✅ Found thumbnail: ${folder}/thumbnail.jpg`);
          
          // Test if thumbnail is accessible via API
          const apiUrl = `${BASE_URL}/api/uploads/hls/${folder}/thumbnail.jpg`;
          const response = await axios.head(apiUrl);
          console.log(`   API accessible: ${response.status} ${response.statusText}`);
          foundThumbnails++;
        } catch (err) {
          console.log(`❌ Missing thumbnail: ${folder}/thumbnail.jpg`);
        }
      }
      
      if (foundThumbnails === 0) {
        console.log('ℹ️  No video thumbnails found (upload a video to test generation)\n');
      } else {
        console.log(`\n✅ Found ${foundThumbnails} accessible thumbnails\n`);
      }
    } catch (err) {
      console.log('ℹ️  HLS directory not found (no videos uploaded yet)\n');
    }

    // Test 3: Test thumbnail fallback middleware
    console.log('3. Testing thumbnail fallback middleware...');
    const nonExistentUrl = `${BASE_URL}/api/uploads/hls/nonexistent/thumbnail.jpg`;
    try {
      const fallbackResponse = await axios.get(nonExistentUrl);
      console.log(`✅ Fallback works: ${fallbackResponse.status} ${fallbackResponse.statusText}`);
      console.log(`   Content-Type: ${fallbackResponse.headers['content-type']}`);
      console.log(`   Should be SVG default thumbnail\n`);
    } catch (err) {
      console.log(`❌ Fallback failed: ${err.response?.status} ${err.response?.statusText}`);
      console.log('   Check if thumbnail fallback middleware is properly configured\n');
    }

    // Test 4: Check if server is running
    console.log('4. Testing server health...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/api/videos`, {
        headers: {
          // Note: This will fail without auth, but we just want to check if server responds
        }
      });
      console.log(`✅ Server responding: ${healthResponse.status}`);
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('✅ Server responding (401 Unauthorized - expected without auth token)');
      } else {
        console.log(`❌ Server issue: ${err.response?.status || err.message}`);
      }
    }

    console.log('\n🎉 Thumbnail system test completed!');
    console.log('\n📝 Summary:');
    console.log('   - Default thumbnail should always be available');
    console.log('   - Video thumbnails are generated during upload processing');
    console.log('   - Fallback middleware serves default for missing thumbnails');
    console.log('   - Frontend utilities handle URL conversion and error fallback');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the backend server is running (npm run dev:backend)');
    console.log('   2. Check if default-thumbnail.svg exists in backend/public/');
    console.log('   3. Verify thumbnail fallback middleware is configured');
  }
}

// Run the test
testThumbnailSystem();
