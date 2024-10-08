const Coupon = require('../../models/couponSchema')
const User = require('../../models/userSchema')
const Cart = require('../../models/cartSchema')

const loadCouponPage = async (req, res) => {
    try {

        if(req.user){

            const user = await User.findOne({_id: req.user})
            const coupon = await Coupon.find({status: 'Active'})

            res.render('coupons', {coupon, user: req.user})
        }
        else{
            res.redirect('/auth/login')
        }
        
    } catch (error) {
        console.log('Coupons not found', error);
        res.status(500).send('Server error');
    }
}


const applyCoupon = async (req, res) => {

    try {

        const userId = req.user._id;

        const {couponCode} = req.body;

        const coupon = await Coupon.findOne({code: couponCode, status: 'Active'});

        const cart = await Cart.findOne({userId: userId})

        let totalPrice = cart.items.reduce((acc, item) => {
            return acc + item.totalPrice;
        }, 0)

        totalPrice = totalPrice + 40;

        if(!coupon){
            return res.status(400).json({ message: 'Invalid or inactive coupon code.' });
        }

        const currentDate = new Date();
        if (currentDate > coupon.expireOn) {
            return res.status(400).json({ message: 'Coupon code has expired.' });
        }


        if(totalPrice < coupon.minAmount || totalPrice > coupon.maxAmount){
            return res.status(400).json({message: `Coupon can be applied only on orders between ₹${coupon.minAmount} and ₹${coupon.maxAmount}.`});
        }


        const discount = (totalPrice * coupon.couponOffer) / 100;
        const newTotal = totalPrice - discount;

        
        res.status(200).json({
            success: true,
            discount,
            newTotal,
            message: `Coupon applied! You saved ₹${discount}.`
        });
        
    } catch (error) {
        console.log('Error applying coupon', error)
        res.status(500).json({ message: 'Error applying coupon, please try again.' });
    }
}



module.exports = {
    loadCouponPage,
    applyCoupon
}