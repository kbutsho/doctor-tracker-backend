const { z } = require('zod');
const { listBase, phone } = require('./common');

const doctorBody = z.object({
  name: z.string().trim().min(2).max(100),
  specialization: z.string().trim().min(2).max(100),
  hospital: z.string().trim().min(2).max(150),
  phone,
  email: z.string().trim().toLowerCase().email(),
});

exports.createDoctorBody = doctorBody;
exports.updateDoctorBody = doctorBody.partial().refine((o) => Object.keys(o).length > 0, 'At least one field is required');

exports.listDoctorsQuery = listBase.extend({
  specialization: z.string().trim().max(100).optional(),
  hospital: z.string().trim().max(150).optional(),
  sortBy: z.enum(['createdAt', 'name', 'specialization', 'hospital']).default('createdAt'),
});
