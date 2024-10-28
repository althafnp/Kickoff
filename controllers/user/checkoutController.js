const User = require('../../models/userSchema');
const Product = require('../../models/productSchema');
const Cart = require('../../models/cartSchema');
const Order = require('../../models/orderSchema');
const Address = require('../../models/addressSchema')
const Coupon = require('../../models/couponSchema')
const Razorpay = require('razorpay');
const crypto = require('crypto')

const loadCheckoutPage = async (req, res) => {
    try {

        if(req.user){

            
            const cartId = req.params.cartId;
            const userId = req.user._id;

            const cart = await Cart.findById(cartId).populate('items.productId')
            const addresses = await Address.findOne({userId: userId})

            const usedCoupons = await Order.find({ userId: userId }, 'coupon.code').distinct('coupon.code');


            const activeCoupons = await Coupon.find({ status: 'Active' });
            const availableCoupons = activeCoupons.filter(coupon => !usedCoupons.includes(coupon.code));


            

            return res.render('checkout', {cart, addresses, coupons: availableCoupons, user: req.user})
        }
        else{
            res.redirect('/auth/login')
        }
        
    } catch (error) {
        console.log('Cart not found', error);
        res.status(500).send('Server error');
    }
}

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})


const placeOrder = async (req, res) => {
    const userId = req.user._id;
    const { address, paymentMethod, couponCode} = req.body;

    try {

        let discount = 0;
        let couponApplied = false;
        let coupon = null;

        
        const cart = await Cart.findOne({ userId: userId }).populate('items.productId');
        
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty Or Product is Unavailable' });
        }

        let totalItemPrice = 0;
        for (const item of cart.items) {
            const product = item.productId;

            if(product.isBlocked){
                return res.status(400).json({success: false, message: `${product.productName} Is No Longer Available `})
            }


            const variant = product.variant.find(v => v.size === item.size);
            
            if (variant) {
                if (variant.stock >= item.quantity) {
                    variant.stock -= item.quantity;
                } else {
                    return res.status(400).json({ success: false, message: `Not enough stock for ${product.productName} (Size: ${variant.size})` });
                }
            }

            totalItemPrice += item.productId.salePrice * item.quantity;
            await product.save();  // Update stock
        }

        if(couponCode){
            const coupon = await Coupon.findOne({code: couponCode, status: 'Active'})

            if(!coupon){
                return res.status(400).json({message: 'Invalid coupon code.'})
            }

            const previousOrder = await Order.findOne({userId: req.user._id, 'coupon.code': couponCode});
            if(previousOrder){
                return res.status(400).json({message: 'You have already used this coupon'})
            }

            discount = ((totalItemPrice + 40) * coupon.couponOffer) / 100;
            couponApplied = true
        }

        const deliveryCharge = 40;
        const totalWithoutDiscount = totalItemPrice + deliveryCharge;
        const finalTotal = totalItemPrice + deliveryCharge - discount;
        coupon = await Coupon.findOne({code: couponCode, status: 'Active'})

        let paymentStatus = 'Paid';

        if(paymentMethod == 'razorpay'){
            paymentStatus = 'Failed';
        }

        let newOrder = new Order({
            userId: userId,
            orderedItems: cart.items.map(item => ({
                product: item.productId._id,
                quantity: item.quantity,
                price: item.productId.salePrice * item.quantity,
                size: item.size
            })),
            totalPrice: totalWithoutDiscount, 
            finalAmount: finalTotal,
            discount: discount,
            coupon: couponApplied ? {code: couponCode, offer: coupon.couponOffer} : null,
            address: address,
            deliveryCharge: deliveryCharge,
            paymentMethod: paymentMethod,
            paymentStatus: paymentStatus,
            couponApplied: couponApplied,
            status: 'Pending',
            createdOn: Date.now()
        });

        if (paymentMethod === 'razorpay') {
            const razorpayOrder = await razorpayInstance.orders.create({
                amount: finalTotal * 100,  // Amount in paise
                currency: 'INR',
                receipt: `order_rcptid_${new Date().getTime()}`,
                payment_capture: 1
            });

            newOrder.razorpayOrderId = razorpayOrder.id;
            await newOrder.save();

            return res.status(200).json({
                success: true,
                orderId: newOrder._id,
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                key: process.env.RAZORPAY_KEY_ID
            });
        }

        await newOrder.save();
        cart.items = [];
        await cart.save();

        return res.status(200).json({ success: true, message: 'Order placed successfully', redirectUrl: '/order-success' });
    } catch (error) {
        console.error('Order Error:', error);
        res.status(500).json({ success: false, message: 'Failed to place order.' });
    }
};


const capturePayment = async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    const userId = req.user._id

    try {
        const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
        const cart = await Cart.findOne({userId: userId})

        if (!order) {
            return res.status(400).json({ success: false, message: 'Order not found' });
        }

        // Verify payment signature (optional but recommended)
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        // Update order with Razorpay payment details
        order.razorpayPaymentId = razorpay_payment_id;
        order.razorpaySignature = razorpay_signature;
        order.paymentStatus = 'Paid';

        await order.save();
        cart.items = [];
        await cart.save();
        
        res.status(200).json({ success: true, message: 'Payment captured successfully', redirectUrl: '/order-success' });
    } catch (error) {
        console.error('Payment Capture Error:', error);
        res.status(500).json({ success: false, message: 'Failed to capture payment' });
    }
};


const continuePayment = async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await Order.findById(orderId);
        if (!order || order.paymentStatus !== 'Failed') {
            return res.status(400).json({ success: false, message: 'Invalid order or payment already completed' });
        }

        // Regenerate Razorpay order if payment failed
        const razorpayOrder = await razorpayInstance.orders.create({
            amount: order.finalAmount * 100, // Amount in paise
            currency: 'INR',
            receipt: `order_rcptid_${new Date().getTime()}`,
            payment_capture: 1
        });

        // Update the order with new Razorpay order ID
        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        res.status(200).json({
            success: true,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.RAZORPAY_KEY_ID // Send Razorpay key to the frontend
        });
    } catch (error) {
        console.error('Continue Payment Error:', error);
        res.status(500).json({ success: false, message: 'Failed to continue payment' });
    }
};





const orderSuccess = async (req, res) => {
    try {

        if(req.user){
            res.render('success', {user: req.user})
        }
        else{
            res.redirect('/auth/login')
        }
        
    } catch (error) {
        console.log('error loading order page', error)
        res.status(500).send('Server error');
    }
}

const paymentFailure = async (req, res) => {
    try {

        if(req.user){
            res.render('failed', {user: req.user})
        }
        else{
            res.redirect('/auth/login')
        }
        
    } catch (error) {
        console.log('error loading order page', error)
        res.status(500).send('Server error');
    }
}


module.exports = {
    loadCheckoutPage,
    placeOrder,
    orderSuccess,
    capturePayment,
    paymentFailure,
    continuePayment
}