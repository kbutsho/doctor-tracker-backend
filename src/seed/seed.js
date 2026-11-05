const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000 - Math.random() * 8 * 3600 * 1000);

const specs = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Oncology', 'Gynecology', 'ENT'];
const hospitals = ['Square Hospital', 'United Hospital', 'Evercare Hospital', 'Labaid Hospital', 'Popular Medical'];
const conditions = ['Hypertension', 'Diabetes', 'Migraine', 'Fracture', 'Asthma', 'Skin Allergy', 'Anemia', 'Arthritis', 'Fever', 'Back Pain'];
const first = ['Rahim', 'Karim', 'Nusrat', 'Sadia', 'Tanvir', 'Mitu', 'Arif', 'Farhana', 'Imran', 'Jannat', 'Sabbir', 'Rumana'];
const last = ['Ahmed', 'Hossain', 'Khan', 'Islam', 'Chowdhury', 'Akter', 'Rahman', 'Uddin'];

(async () => {
  await mongoose.connect(env.MONGODB_URI);

  if (process.argv.includes('--fresh')) {
    await Promise.all([Doctor.deleteMany({}), Patient.deleteMany({})]);
    console.log('Cleared doctors & patients');
  }

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@gmail.com').toLowerCase();
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: process.env.SEED_ADMIN_NAME || 'Super Admin',
      email: adminEmail,
      password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
    });
    console.log(`Admin created: ${admin.email}`);
  }

  if ((await Doctor.countDocuments()) === 0) {
    const doctors = await Doctor.insertMany(
      Array.from({ length: 14 }, (_, i) => ({
        name: `Dr. ${rand(first)} ${rand(last)}`,
        specialization: specs[i % specs.length],
        hospital: rand(hospitals),
        phone: `+88017${Math.floor(10000000 + Math.random() * 89999999)}`,
        email: `doctor${i + 1}@example.com`,
        createdBy: admin._id,
        createdAt: daysAgo(Math.floor(Math.random() * 60)),
      }))
    );

    await Patient.insertMany(
      Array.from({ length: 220 }, () => {
        const created = daysAgo(Math.floor(Math.random() * 60));
        return {
          name: `${rand(first)} ${rand(last)}`,
          age: 1 + Math.floor(Math.random() * 85),
          gender: rand(['male', 'female', 'other', 'male', 'female']),
          phone: `+88018${Math.floor(10000000 + Math.random() * 89999999)}`,
          condition: rand(conditions),
          doctor: rand(doctors)._id,
          createdAt: created,
          updatedAt: created,
        };
      })
    );
    console.log('Seeded 14 doctors and 220 patients');
  }

  await Promise.all([Doctor.syncIndexes(), Patient.syncIndexes(), User.syncIndexes()]);
  console.log('Indexes synced');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
