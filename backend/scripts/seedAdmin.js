require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const sequelize = require('../config/database');
const User = require('../models/User');

async function seedAdmin() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: false });

    const existing = await User.findOne({ where: { username: 'ADMIN1' } });
    if (existing) {
      console.log('Admin account ADMIN1 already exists — skipping.');
      return;
    }

    await User.create({
      username: 'ADMIN1',
      email: 'admin1@hoclieutuongtac2.com',
      password: 'admin123',
      role: 'admin',
      isActive: true,
      emailVerified: true,
    });

    console.log('✅ Admin account created.');
    console.log('   Username : ADMIN1');
    console.log('   Password : admin123');
    console.log('   Role     : admin');
  } catch (err) {
    console.error('❌ Failed to seed admin:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seedAdmin();
