const express = require('express');
const router = express.Router();
const userController = require('../controllers/user/userController')
const shopController = require('../controllers/user/shopController')
const profileController = require('../controllers/user/profileController')
const cartController = require('../controllers/user/cartController')
const checkoutController = require('../controllers/user/checkoutController')
const orderController = require('../controllers/user/ordersController')
const whishlistController = require('../controllers/user/wishlistController')
const couponController = require('../controllers/user/couponController')
const walletController = require('../controllers/user/walletController')
const {userAuth} = require('../middlewares/auth');


router.get('/', userAuth, userController.loadHomePage)


router.get('/shop', userAuth, userController.loadShopPage)
router.get('/shop/details/:id', userAuth, shopController.loadShopDetails)
router.get('/shop/details/stock/:productId/:size', userAuth, shopController.stockDetails)


//PROFILE AND ADDRESSES
router.get('/profile', userAuth, profileController.loadProfilePage)
router.put('/editProfile', userAuth, profileController.editProfile)
router.post('/addAddress', userAuth, profileController.addAddress)
router.put('/editAddress', userAuth, profileController.editAddress)
router.delete('/deleteAddress/:id', userAuth, profileController.deleteAddress)
router.post('/changePassword', userAuth, profileController.changePassword)


//CART
router.get('/cart', userAuth, cartController.loadCartPage)
router.post('/cart/add', userAuth, cartController.addCart)
router.post('/cart/update-quantity', userAuth, cartController.updateCart)
router.get('/cart/remove/:productId', userAuth, cartController.removeCart)


//CHECKOUT
router.get('/checkout/:cartId', userAuth, checkoutController.loadCheckoutPage)
router.post('/checkout/place-order', userAuth, checkoutController.placeOrder)
router.post('/checkout/capture-payment', userAuth, checkoutController.capturePayment)
router.get('/order-success', userAuth, checkoutController.orderSuccess)

//ORDERS
router.get('/orders', userAuth, orderController.loadOrdersPage)
router.post('/orders/cancel/:orderId', userAuth, orderController.cancelOrder)
router.get('/orders/details/:orderId', userAuth, orderController.orderDetails)
router.post('/orders/return-request', userAuth, orderController.requestReturn)



//WISHLIST
router.get('/wishlist', userAuth, whishlistController.loadWishlistPage)
router.post('/wishlist/add', userAuth, whishlistController.addWishlist)
router.get('/wishlist/remove/:productId', userAuth, whishlistController.removeWishlist)

//COUPON
router.get('/coupons', userAuth, couponController.loadCouponPage)
router.post('/checkout/apply-coupon',userAuth, couponController.applyCoupon)



//WALLET
router.get('/wallet', userAuth, walletController.loadWalletPage)

module.exports = router;
