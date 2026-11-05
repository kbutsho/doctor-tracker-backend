const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex, dateRange, buildMeta } = require('../utils/helpers');

exports.createDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: { doctor } });
});

exports.listDoctors = asyncHandler(async (req, res) => {
  const { page, limit, search, specialization, hospital, from, to, sortBy, order } = req.query;

  const match = {};
  if (specialization) match.specialization = specialization;
  if (hospital) match.hospital = hospital;
  const range = dateRange(from, to);
  if (range) match.createdAt = range;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    match.$or = [{ name: rx }, { email: rx }, { specialization: rx }, { hospital: rx }, { phone: rx }];
  }

  const dir = order === 'asc' ? 1 : -1;

  const [result] = await Doctor.aggregate([
    { $match: match },
    {
      $facet: {
        data: [
          { $sort: { [sortBy]: dir, _id: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $lookup: {
              from: 'patients',
              let: { id: '$_id' },
              pipeline: [{ $match: { $expr: { $eq: ['$doctor', '$$id'] } } }, { $count: 'n' }],
              as: 'pc',
            },
          },
          { $addFields: { patientsCount: { $ifNull: [{ $arrayElemAt: ['$pc.n', 0] }, 0] } } },
          { $project: { pc: 0, __v: 0 } },
        ],
        total: [{ $count: 'n' }],
      },
    },
  ]);

  const total = result.total[0]?.n || 0;
  res.json({ success: true, data: { doctors: result.data }, meta: buildMeta(page, limit, total) });
});

// distinct values for filter dropdowns
exports.getFilterOptions = asyncHandler(async (_req, res) => {
  const [specializations, hospitals] = await Promise.all([
    Doctor.distinct('specialization'),
    Doctor.distinct('hospital'),
  ]);
  res.json({ success: true, data: { specializations: specializations.sort(), hospitals: hospitals.sort() } });
});

exports.getDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).lean();
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  const patientsCount = await Patient.countDocuments({ doctor: doctor._id });
  res.json({ success: true, data: { doctor: { ...doctor, patientsCount } } });
});

exports.updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  res.json({ success: true, data: { doctor } });
});

// deleting a doctor also removes their patients (cascade) so there are no orphans
exports.deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndDelete(req.params.id);
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  const { deletedCount } = await Patient.deleteMany({ doctor: doctor._id });
  res.json({ success: true, message: 'Doctor deleted', data: { deletedPatients: deletedCount } });
});
