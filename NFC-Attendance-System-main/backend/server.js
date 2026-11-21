const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const loginRoutes = require('./routes/loginRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const nfcRoutes = require('./routes/nfcRoutes');
const classesRoutes = require('./routes/classesRoutes');

const { seedUsers, seedClasses, seedAttendances } = require('./data/seeder');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/api/user', loginRoutes);
app.use('/api/attendances', attendanceRoutes);
app.use('/api/nfc', nfcRoutes);
app.use('/api/classes', classesRoutes);

const isCollectionEmpty = async (collectionName) => {
  const count = await mongoose.connection.collection(collectionName).countDocuments();
  return count === 0;
};

connectDB()
  .then(async () => {
    await seedUsers();

    const isClassesEmpty = await isCollectionEmpty('classes');
    if (isClassesEmpty) {
      console.log('Seeding classes...');
      await seedClasses();
    } else {
      console.log('Classes collection is not empty, skipping seed.');
    }

    const isAttendancesEmpty = await isCollectionEmpty('attendances');
    if (isAttendancesEmpty) {
      console.log('Seeding attendances...');
      await seedAttendances();
    } else {
      console.log('Attendances collection is not empty, skipping seed.');
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(`Error while connecting to the database: ${error.message}`);
  });