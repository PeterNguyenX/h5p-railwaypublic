require('dotenv').config();
const sequelize = require('./config/database');
const { Video, User } = require('./models');

async function createTestVideos() {
  try {
    console.log('Connecting to database...');
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Find or create a test user
    let testUser = await User.findOne({ where: { email: 'admin@example.com' } });
    if (!testUser) {
      testUser = await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('Test user created');
    }

    // Create test videos that match our actual files
    const testVideos = [
      {
        title: 'Test Video 1',
        description: 'First test video with HLS processing',
        filePath: 'uploads/videos/ex1.mov',
        hlsPath: 'uploads/hls/ex1/stream.m3u8',
        thumbnailPath: 'uploads/hls/ex1/thumbnail.jpg',
        userId: testUser.id,
        status: 'ready',
        duration: 30
      },
      {
        title: 'Test Video 2', 
        description: 'Second test video with HLS processing',
        filePath: 'uploads/videos/ex2.mov',
        hlsPath: 'uploads/hls/ex2/stream.m3u8',
        thumbnailPath: 'uploads/hls/ex2/thumbnail.jpg',
        userId: testUser.id,
        status: 'ready',
        duration: 35
      }
    ];

    // Delete existing test videos to avoid duplicates
    await Video.destroy({ where: { userId: testUser.id } });

    // Create new test videos
    for (const videoData of testVideos) {
      const video = await Video.create(videoData);
      console.log(`Created video: ${video.title} (ID: ${video.id})`);
    }

    console.log('Test videos created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test videos:', error);
    process.exit(1);
  }
}

createTestVideos();
