const Coupon = require('../../models/couponSchema')



const loadCouponPage = async (req, res) => {
    try {

        const coupons = await Coupon.find({});

        coupons.forEach(async (coupon) => {
            if(new Date > coupon.expireOn && coupon.status == 'Active'){
                coupon.status = 'Inactive';
                await coupon.save()
            }
        })

        res.render('coupon', {coupons})
        
    } catch (error) {
        console.log('error loading coupon', error)
        res.status(500).json({ message: 'Error fetching coupons' });
    }
}

const addCoupon = async (req, res) => {
    try {

        const {code, couponOffer, minAmount, maxAmount, expireOn} = req.body;



        const existingCoupon = await Coupon.findOne({code})
        if(existingCoupon){
            return res.status(400).json({ message: 'Coupon code already exists. Please use a different code.' });
        }

        const newCoupon = new Coupon({
            code,
            couponOffer,
            minAmount,
            maxAmount,
            expireOn
        })

        await newCoupon.save()

        res.redirect('/admin/coupon')
        
    } catch (error) {
        console.log('Error adding coupon', error);
        res.redirect('/admin/page-error')
    }
}



const deleteCoupon = async (req, res) => {
    try {
        
        const {id} = req.params;

        await Coupon.findByIdAndDelete(id);

        res.redirect('/admin/coupon')
        
    } catch (error) {
        console.log('Error deleting coupon', error);
        res.redirect('/admin/page-error')
    }
}




module.exports = {
    loadCouponPage,
    addCoupon,
    deleteCoupon
}
