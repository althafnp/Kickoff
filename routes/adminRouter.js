const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin/adminController')
const customerController = require('../controllers/admin/customerController')
const categoryController = require('../controllers/admin/categoryController')
const productController = require('../controllers/admin/productController')
const orderController = require('../controllers/admin/orderController')
const couponController = require('../controllers/admin/couponController')
const multer = require('multer')
const storage = require('../helpers/multer')
const uploads = multer({storage: storage})
const {adminAuth} = require('../middlewares/auth')




router.get('/dashboard', adminAuth, adminController.loadDashboard);


//PAGE ERROR
router.get('/page-error', adminController.pageError);


//MIDDLEWARE FOR ADMIN AUTHENTICATION
// router.use(adminAuth)


//CUSTOMERS
router.get('/users', adminAuth, customerController.customerInfo)
router.get('/users/blockUser', adminAuth, customerController.userBlocked)
router.get('/users/unblockUser', adminAuth, customerController.userUnblocked)



//CATEGORY
router.get('/category', adminAuth, categoryController.categoryInfo)
router.post('/category/addCategory', adminAuth, categoryController.addCategory)
router.post('/category/listCategory', adminAuth, categoryController.categoryListed)
router.post('/category/unlistCategory', adminAuth, categoryController.categoryUnlisted)
router.get('/category/editCategory/:id', adminAuth, categoryController.getEditCategory)
router.post('/category/editCategory/:id', adminAuth, categoryController.editCategory)



//PRODUCTS
router.get('/products', adminAuth, productController.getProductPage)
router.get('/products/blockProduct', adminAuth, productController.productBlocked)
router.get('/products/unblockProduct', adminAuth, productController.productUnblocked)
router.get('/addProducts', adminAuth, productController.getProductAddPage)
router.get('/addProducts/names', adminAuth, productController.getNamesByCategory)
router.post('/addProducts', adminAuth, uploads.array('images', 4), productController.addProducts)
router.get('/products/editProduct', adminAuth, productController.getEditProduct);
router.post('/products/editProduct/:id', adminAuth, uploads.array('images', 4), productController.editProduct)
router.post('/products/deleteImage', adminAuth, productController.deleteSingleImage)
router.post('/addProductOffer', adminAuth, productController.addProductOffer)
router.post('/removeProductOffer', adminAuth, productController.removeProductOffer)



//ORDERS
router.get('/orders',adminAuth, orderController.loadOrderPage)
router.post('/orders/changeStatus', adminAuth, orderController.changeStatus)
router.post('/orders/cancelOrder', adminAuth, orderController.cancelOrder)
router.get('/return-requests', adminAuth, orderController.loadReturnRequests)
router.post('/process-return', adminAuth, orderController.processReturn)


//COUPON
router.get('/coupon', adminAuth, couponController.loadCouponPage)
router.post('/add-coupon', adminAuth, couponController.addCoupon)
router.post('/delete-coupon/:id', adminAuth, couponController.deleteCoupon)

module.exports = router;







