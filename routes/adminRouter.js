const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/adminController')
const customerController = require('../controllers/admin/customerController')
const {adminAuth} = require('../middlewares/auth')

//MIDDLEWARE FOR ADMIN AUTHENTICATION
// router.use(adminAuth)


router.get('/dashboard', adminController.loadDashboard);


//CUSTOMERS
router.get('/users', adminAuth, customerController.customerInfo)
router.get('/users/blockUser', adminAuth, customerController.userBlocked)
router.get('/users/unblockUser', adminAuth, customerController.userUnblocked)







module.exports = router;







