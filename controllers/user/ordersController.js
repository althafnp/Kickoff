const User = require('../../models/userSchema');
const Product = require('../../models/productSchema');
const Cart = require('../../models/cartSchema');
const Order = require('../../models/orderSchema');
const Address = require('../../models/addressSchema')


const loadOrdersPage = async (req, res) => {
    try {
        if (req.user) {
            const userId = req.user._id;

            const order = await Order.find({ userId: userId })
                .populate('orderedItems.product')
                .populate('address')
                .sort({ createdOn: -1 })




            if (!order || order.length === 0) {
                return res.render('orders', { user: req.user, message: 'Currently No Orders' })
            }


            return res.render('orders', { user: req.user, order })
        }
        else {
            res.redirect('/auth/login')
        }

    } catch (error) {
        console.error('Error loading orders:', error);
        res.status(500).send('Internal Server Error');
    }
}


const cancelOrder = async (req, res) => {

    const userId = req.user._id;
    const orderId = req.params.orderId;

    try {

        const order = await Order.findOne({ _id: orderId, userId: userId }).populate('orderedItems.product')
        console.log(order)

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        for (let item of order.orderedItems) {
            const product = item.product;
            console.log('product', product);

            const variant = product.variant.find(v => v.size === item.size)
            console.log('variant', variant);


            if (variant) {
                variant.stock += item.quantity;
            }

            await product.save();
        }

        if(order.paymentMethod == 'razorpay'){
            const user = await User.findById(userId)

            user.wallet += order.finalAmount;

            user.transactions.push({
                type: 'Credited',
                amount: order.finalAmount,
                description: `Refund for order cancellation (Order Id: ${order.orderId})`
            })

            await user.save()
        }

        order.status = 'Cancelled';
        await order.save();

        res.status(200).json({ success: true, message: 'Order cancelled, stock restored and amount credited to wallet' });

    } catch (error) {
        console.log('Order Error:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel order.' });
    }
}


const orderDetails = async (req, res) => {

    try {

        const userId = req.user._id
        const orderId = req.params.orderId

        if (req.user) {
            const order = await Order.findOne({ userId: userId, _id: orderId })
                .populate('orderedItems.product')


            const userAddress = await Address.findOne({ userId: userId });

            if (userAddress) {

                // Find the address that matches the order's address ID
                const usedAddress = userAddress.address.find(addr => addr._id.toString() === order.address.toString());

                if (!usedAddress) {
                    return res.status(404).json({ success: false, message: 'Address not found.' });
                }

            return res.render('order-details', { user: req.user, order, usedAddress })
            }


        }
        else {
            res.redirect('/auth/login')
        }


    } catch (error) {
        console.log('Order details Error:', error);
        res.status(500).json({ success: false, message: 'Failed to load  order details.' });
    }
}


const requestReturn = async (req, res) => {
    try {

        const {orderId} = req.body;

        const order = await Order.findOne({ orderId: orderId });

        if (!order || order.status !== 'Delivered') {
            return res.status(400).json({ success: false, message: 'Invalid order or order not delivered.' });
        }

        order.status = 'Return Request';
        await order.save();

        res.status(200).json({ success: true, message: 'Return request sent.' });
        
    } catch (error) {
        console.error('Error requesting return:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}




module.exports = {
    loadOrdersPage,
    cancelOrder,
    orderDetails,
    requestReturn
}