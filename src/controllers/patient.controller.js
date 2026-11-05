const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex, dateRange, buildMeta } = require('../utils/helpers');

const buildFilter = (q, doctorId) => {
  const f = {};
  const doctor = doctorId || q.doctor;
  if (doctor) f.doctor = doctor;
  if (q.condition) f.condition = q.condition;
  if (q.gender) f.gender = q.gender;
  const range = dateRange(q.from, q.to);
  if (range) f.createdAt = range;
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    f.$or = [{ name: rx }, { phone: rx }, { condition: rx }];
  }
  return f;
};

const paginate = async (filter, q) => {
  const { page, limit, sortBy, order } = q;
  const sort = { [sortBy]: order === 'asc' ? 1 : -1, _id: -1 };
  const [patients, total] = await Promise.all([
    Patient.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('doctor', 'name specialization hospital')
      .lean(),
    Patient.countDocuments(filter),
  ]);
  return { patients, meta: buildMeta(page, limit, total) };
};

const ensureDoctor = async (id) => {
  if (!(await Doctor.exists({ _id: id }))) throw new ApiError(404, 'Doctor not found');
};

// ---------- /api/patients ----------
exports.listPatients = asyncHandler(async (req, res) => {
  const { patients, meta } = await paginate(buildFilter(req.query), req.query);
  res.json({ success: true, data: { patients }, meta });
});

exports.createPatient = asyncHandler(async (req, res) => {
  await ensureDoctor(req.body.doctor);
  const patient = await Patient.create(req.body);
  res.status(201).json({ success: true, data: { patient } });
});

exports.getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id).populate('doctor', 'name specialization hospital');
  if (!patient) throw new ApiError(404, 'Patient not found');
  res.json({ success: true, data: { patient } });
});

exports.updatePatient = asyncHandler(async (req, res) => {
  if (req.body.doctor) await ensureDoctor(req.body.doctor);
  const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('doctor', 'name specialization hospital');
  if (!patient) throw new ApiError(404, 'Patient not found');
  res.json({ success: true, data: { patient } });
});

exports.deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndDelete(req.params.id);
  if (!patient) throw new ApiError(404, 'Patient not found');
  res.json({ success: true, message: 'Patient deleted' });
});

exports.getConditions = asyncHandler(async (_req, res) => {
  const conditions = await Patient.distinct('condition');
  res.json({ success: true, data: { conditions: conditions.sort() } });
});

// ---------- /api/doctors/:id/patients ----------
exports.listDoctorPatients = asyncHandler(async (req, res) => {
  await ensureDoctor(req.params.id);
  const { patients, meta } = await paginate(buildFilter(req.query, req.params.id), req.query);
  res.json({ success: true, data: { patients }, meta });
});

exports.addPatientToDoctor = asyncHandler(async (req, res) => {
  await ensureDoctor(req.params.id);
  const patient = await Patient.create({ ...req.body, doctor: req.params.id });
  res.status(201).json({ success: true, data: { patient } });
});

exports.removePatientFromDoctor = asyncHandler(async (req, res) => {
  const patient = await Patient.findOneAndDelete({ _id: req.params.patientId, doctor: req.params.id });
  if (!patient) throw new ApiError(404, 'Patient not found under this doctor');
  res.json({ success: true, message: 'Patient removed from doctor' });
});
