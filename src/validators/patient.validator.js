const { z } = require('zod');
const { listBase, phone, objectId } = require('./common');

const patientFields = z.object({
  name: z.string().trim().min(2).max(100),
  age: z.coerce.number().int().min(0).max(150),
  gender: z.enum(['male', 'female', 'other']),
  phone,
  condition: z.string().trim().min(2).max(150),
  notes: z.string().trim().max(1000).optional(),
});

exports.createPatientForDoctorBody = patientFields;
exports.createPatientBody = patientFields.extend({ doctor: objectId });
exports.updatePatientBody = patientFields
  .extend({ doctor: objectId })
  .partial()
  .refine((o) => Object.keys(o).length > 0, 'At least one field is required');

exports.listPatientsQuery = listBase.extend({
  doctor: objectId.optional(),
  condition: z.string().trim().max(150).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  sortBy: z.enum(['createdAt', 'name', 'age', 'condition']).default('createdAt'),
});

exports.doctorPatientParams = z.object({ id: objectId, patientId: objectId });
