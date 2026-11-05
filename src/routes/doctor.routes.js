const router = require('express').Router();
const doctor = require('../controllers/doctor.controller');
const patient = require('../controllers/patient.controller');
const validate = require('../middleware/validate');
const { restrictTo } = require('../middleware/auth');
const { idParam } = require('../validators/common');
const { createDoctorBody, updateDoctorBody, listDoctorsQuery } = require('../validators/doctor.validator');
const { createPatientForDoctorBody, listPatientsQuery, doctorPatientParams } = require('../validators/patient.validator');

router.get('/filters', doctor.getFilterOptions);

router
  .route('/')
  .get(validate({ query: listDoctorsQuery }), doctor.listDoctors)
  .post(validate({ body: createDoctorBody }), doctor.createDoctor);

router
  .route('/:id')
  .get(validate({ params: idParam }), doctor.getDoctor)
  .put(validate({ params: idParam, body: updateDoctorBody }), doctor.updateDoctor)
  .delete(restrictTo('admin'), validate({ params: idParam }), doctor.deleteDoctor);

// patients under a specific doctor
router
  .route('/:id/patients')
  .get(validate({ params: idParam, query: listPatientsQuery }), patient.listDoctorPatients)
  .post(validate({ params: idParam, body: createPatientForDoctorBody }), patient.addPatientToDoctor);

router.delete('/:id/patients/:patientId', validate({ params: doctorPatientParams }), patient.removePatientFromDoctor);

module.exports = router;
