const { Video, User } = require('../models');

async function fixVideoUsers() {
  try {
    console.log('Fixing video user associations...');
    
    // Get all videos with null userId
    const videosWithoutUser = await Video.findAll({
      where: {
        userId: null
      }
    });
    
    console.log(`Found ${videosWithoutUser.length} videos without userId`);
    
    if (videosWithoutUser.length === 0) {
      console.log('No videos to fix');
      return;
    }
    
    // Get the admin user to assign these videos to
    const adminUser = await User.findOne({
      where: {
        role: 'admin'
      },
      order: [['createdAt', 'ASC']] // Get the first admin user
    });
    
    if (!adminUser) {
      console.error('No admin user found');
      return;
    }
    
    console.log(`Assigning videos to admin user: ${adminUser.username} (${adminUser.id})`);
    
    // Update all videos without userId to belong to admin
    const [updatedCount] = await Video.update(
      { userId: adminUser.id },
      {
        where: {
          userId: null
        }
      }
    );
    
    console.log(`Updated ${updatedCount} videos to belong to admin user`);
    console.log('Video user fix complete!');
    
  } catch (error) {
    console.error('Error fixing video users:', error);
  }
}

// Run if called directly
if (require.main === module) {
  fixVideoUsers().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { fixVideoUsers };
