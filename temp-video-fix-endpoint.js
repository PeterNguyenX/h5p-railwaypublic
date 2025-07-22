// Simple public endpoint to fix video ownership
// This will be added to server.js temporarily

app.get('/api/fix-video-ownership-public/:secret', async (req, res) => {
  try {
    const { secret } = req.params;
    
    // Simple security check
    if (secret !== 'fix-videos-2025-railway') {
      return res.status(403).json({ error: 'Invalid access' });
    }
    
    console.log('🔧 Starting video ownership fix...');
    
    const { Video, User } = require('./models');
    
    // Get all videos with null userId  
    const orphanedVideos = await Video.findAll({
      where: { userId: null }
    });
    
    console.log(`📊 Found ${orphanedVideos.length} orphaned videos`);
    
    if (orphanedVideos.length === 0) {
      return res.json({
        success: true,
        message: 'No orphaned videos found',
        fixed: 0
      });
    }
    
    // Get admin user to assign videos to
    const adminUser = await User.findOne({
      where: { role: 'admin' },
      order: [['createdAt', 'ASC']]
    });
    
    if (!adminUser) {
      return res.status(404).json({ error: 'No admin user found' });
    }
    
    console.log(`👤 Assigning videos to admin: ${adminUser.username}`);
    
    // Update all orphaned videos to belong to admin
    const [updatedCount] = await Video.update(
      { userId: adminUser.id },
      { where: { userId: null } }
    );
    
    console.log(`✅ Updated ${updatedCount} videos`);
    
    // Verify the fix worked
    const remainingOrphans = await Video.count({
      where: { userId: null }
    });
    
    res.json({
      success: true,
      message: `Successfully fixed ${updatedCount} videos`,
      details: {
        videosFixed: updatedCount,
        assignedToUser: adminUser.username,
        remainingOrphans: remainingOrphans
      }
    });
    
  } catch (error) {
    console.error('❌ Error fixing video ownership:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix video ownership',
      details: error.message
    });
  }
});
