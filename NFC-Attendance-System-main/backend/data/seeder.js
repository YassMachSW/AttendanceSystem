const User = require('../models/User');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const users = require('./seedUsers');
const attendances = require('./seedAttendance');
const classes = require('./seedClasses');
const bcrypt = require('bcryptjs');

const ALLOWED_CLASS_TYPES = ['predavanje', 'lab', 'auditorne'];

const seedUsers = async () => {
  try {
    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`User with email "${userData.email}" already exists.`);

        if (!existingUser.uid && userData.uid) {
          existingUser.uid = userData.uid;
          await existingUser.save();
          console.log(`UID added to user "${userData.email}".`);
        } else {
          console.log(`User "${userData.email}" already has a UID. Skipped updating.`);
        }

        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      await User.create({
        email: userData.email,
        name: userData.name,
        surname: userData.surname,
        password: hashedPassword,
        role: userData.role,
        uid: userData.uid,
      });

      console.log(`User "${userData.email}" successfully added to db.`);
    }
  } catch (error) {
    console.error('Error while seeding users:', error);
  }
};

const seedClasses = async () => {
  try {
    const allUsers = await User.find();
    const defaultManager =
      allUsers.find((u) => u.role === 'professor' || u.role === 'manager' || u.role === 'admin') ||
      allUsers[0];

    if (!defaultManager) {
      console.error('No users found in DB. Skipping seedClasses.');
      return;
    }

    for (const classesData of classes) {
      let assignedUser = defaultManager;

      if (classesData.name === 'Camping Jeep') {
        assignedUser =
          allUsers.find((u) => u.email === 'ppp') || defaultManager;
      } else if (classesData.name === 'Camping Jeep') {
        assignedUser =
          allUsers.find((u) => u.email === 'ppp') || defaultManager;
      }

      const validType = ALLOWED_CLASS_TYPES.includes(classesData.type)
        ? classesData.type
        : 'predavanje';

      await Class.create({
        name: classesData.name,
        type: validType,
        roomNumber: classesData.roomNumber || 'Main',
        date: classesData.date || new Date(),
        startTime: classesData.startTime || '08:00',
        endTime: classesData.endTime || '23:59',
        professorId: assignedUser._id,
      });

      console.log(`Class "${classesData.name}" successfully added to db.`);
    }
  } catch (error) {
    console.error('Error while seeding classes:', error);
  }
};

const seedAttendances = async () => {
  try {
    const allClasses = await Class.find();
    if (!allClasses || allClasses.length === 0) {
      console.error('No classes found in DB. Skipping seedAttendances.');
      return;
    }

    const fallbackUser = await User.findOne();
    let counter = 0;

    for (const attendanceData of attendances) {
      const targetClass = allClasses[counter % allClasses.length];
      counter += 1;

      const userRecord =
        (attendanceData.studentUID &&
          (await User.findOne({ uid: attendanceData.studentUID }))) ||
        fallbackUser;

      if (!userRecord || !targetClass) {
        console.log('Skipping attendance seed item due to missing user or class.');
        continue;
      }

      await Attendance.create({
        studentId: userRecord._id,
        classId: targetClass._id,
        status: attendanceData.status,
        studentUID: attendanceData.studentUID || userRecord.uid || '',
      });

      console.log('Attendance successfully added to db.');
    }
  } catch (error) {
    console.error('Error while seeding attendance:', error);
  }
};

module.exports = {
  seedUsers,
  seedAttendances,
  seedClasses,
};