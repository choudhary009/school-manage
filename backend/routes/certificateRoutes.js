const express = require('express');
const router = express.Router();
const {
  getNextCertificateNumberHandler,
  createCertificate,
  getCertificates,
  updateCertificate,
  deleteCertificate
} = require('../controllers/certificate_controller.js');

router.get('/next/:schoolId', getNextCertificateNumberHandler);
router.post('/create', createCertificate);
router.get('/all/:schoolId', getCertificates);
router.put('/update/:id', updateCertificate);
router.delete('/delete/:id', deleteCertificate);

module.exports = router;
