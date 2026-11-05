const router = require('express').Router();
const ctrl = require('../controllers/patient.controller');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/common');
const { createPatientBody, updatePatientBody, listPatientsQuery } = require('../validators/patient.validator');

router.get('/conditions', ctrl.getConditions);

router
  .route('/')
  .get(validate({ query: listPatientsQuery }), ctrl.listPatients)
  .post(validate({ body: createPatientBody }), ctrl.createPatient);

router
  .route('/:id')
  .get(validate({ params: idParam }), ctrl.getPatient)
  .put(validate({ params: idParam, body: updatePatientBody }), ctrl.updatePatient)
  .delete(validate({ params: idParam }), ctrl.deletePatient);

module.exports = router;
