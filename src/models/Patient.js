const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    age: { type: Number, required: true, min: 0, max: 150 },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    phone: { type: String, required: true, trim: true },
    condition: { type: String, required: true, trim: true, maxlength: 150 },
    notes: { type: String, trim: true, maxlength: 1000 },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  },
  { timestamps: true }
);

patientSchema.index({ doctor: 1, createdAt: -1 });
patientSchema.index({ condition: 1, createdAt: -1 });
patientSchema.index({ gender: 1 });
patientSchema.index({ createdAt: -1 });
patientSchema.index({ name: 1 });

patientSchema.set('toJSON', { transform: (_d, r) => { delete r.__v; return r; } });

module.exports = mongoose.model('Patient', patientSchema);
