const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const asyncHandler = require('../utils/asyncHandler');

const dayKey = (d) => d.toISOString().slice(0, 10);

const fillTimeline = (rows, days) => {
  const map = new Map(rows.map((r) => [r._id, r.count]));
  const out = [];
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = dayKey(d);
    out.push({ date: key, count: map.get(key) || 0 });
  }
  return out;
};

const timelineAgg = (Model, since) =>
  Model.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } }, count: { $sum: 1 } } },
  ]);

exports.getStats = asyncHandler(async (req, res) => {
  const { days, top } = req.query;

  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));
  const last7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalDoctors, totalPatients, newDoctors7d, newPatients7d,
    patientsPerDoctor, patientsTimeline, doctorsTimeline,
    conditionDistribution, specializationDistribution, genderDistribution, recentPatients,
  ] = await Promise.all([
    Doctor.estimatedDocumentCount(),
    Patient.estimatedDocumentCount(),
    Doctor.countDocuments({ createdAt: { $gte: last7 } }),
    Patient.countDocuments({ createdAt: { $gte: last7 } }),

    Patient.aggregate([
      { $group: { _id: '$doctor', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: top },
      { $lookup: { from: 'doctors', localField: '_id', foreignField: '_id', as: 'd' } },
      { $unwind: '$d' },
      { $project: { _id: 0, doctorId: '$_id', name: '$d.name', specialization: '$d.specialization', count: 1 } },
    ]),

    timelineAgg(Patient, since),
    timelineAgg(Doctor, since),

    Patient.aggregate([
      { $group: { _id: '$condition', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $project: { _id: 0, condition: '$_id', count: 1 } },
    ]),

    Doctor.aggregate([
      { $group: { _id: '$specialization', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $project: { _id: 0, specialization: '$_id', count: 1 } },
    ]),

    Patient.aggregate([
      { $group: { _id: '$gender', count: { $sum: 1 } } },
      { $project: { _id: 0, gender: '$_id', count: 1 } },
    ]),

    Patient.find().sort({ createdAt: -1 }).limit(5).populate('doctor', 'name specialization').lean(),
  ]);

  res.json({
    success: true,
    data: {
      totals: {
        doctors: totalDoctors,
        patients: totalPatients,
        avgPatientsPerDoctor: totalDoctors ? Number((totalPatients / totalDoctors).toFixed(1)) : 0,
        newDoctorsLast7Days: newDoctors7d,
        newPatientsLast7Days: newPatients7d,
      },
      patientsPerDoctor,
      patientsTimeline: fillTimeline(patientsTimeline, days),
      doctorsTimeline: fillTimeline(doctorsTimeline, days),
      conditionDistribution,
      specializationDistribution,
      genderDistribution,
      recentPatients,
      rangeDays: days,
    },
  });
});
