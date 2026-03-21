const sequelize = require('./config/database');
const { Video, User } = require('./models');

sequelize.authenticate().then(async () => {
  try {
    console.log('Starting database cleanup...\n');
    
    // Get all users
    const users = await User.findAll({ attributes: ['id', 'username'] });
    console.log(`Found ${users.length} user(s):`);
    users.forEach(u => console.log(`  - ${u.username} (ID: ${u.id})`));
    
    // Count orphaned videos (no userId)
    const orphanedCount = await Video.count({ where: { userId: null } });
    console.log(`\nFound ${orphanedCount} orphaned video(s) (no userId)`);
    
    // Count all videos
    const totalCount = await Video.count();
    console.log(`Total videos: ${totalCount}`);
    
    if (orphanedCount > 0) {
      // Delete orphaned videos
      await Video.destroy({ where: { userId: null } });
      console.log(`\nDeleted ${orphanedCount} orphaned video(s)`);
    }
    
    // Count videos per user
    console.log('\nVideos per user:');
    for (const user of users) {
      const count = await Video.count({ where: { userId: user.id } });
      console.log(`  - ${user.username}: ${count} video(s)`);
    }
    
    console.log('\nDatabase cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}).catch(err => {
  console.error('Database connection error:', err.message);
  process.exit(1);
});
