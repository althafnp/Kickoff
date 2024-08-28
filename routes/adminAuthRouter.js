const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/admin/adminAuthController')


router.get('/login', adminAuthController.loadLogin)
router.post('/login', adminAuthController.login)
router.get('/logout', adminAuthController.logout)

module.exports = router;