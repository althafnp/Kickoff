const Order = require('../../models/orderSchema')
const User = require('../../models/userSchema')


const loadOrderPage = async (req, res) => {
    try {

        const order = await Order.find({}).sort({createdOn: -1}).populate('userId');

        // console.log('order', order)

        res.render('order-list', {order})
    } catch (error) {
        console.log('Error loading Orders page', error)
        res.redirect('/admin/page-error')
    }
}


const changeStatus = async (req, res) => {
    try {

        const {status, id} = req.body;

        const order = await Order.findOne({orderId: id})

        if(!order){
            return res.status(404).json({success: false, message: 'No Order Found'})
        }

        order.status = status;

        await order.save();

        res.status(200).json({message: 'Order Status Updated Successfully'})
        
    } catch (error) {
        console.log('Error updating order status:', error);
        res.status(500).json({ message: 'Server error' });
    }
}


const cancelOrder = async (req, res) => {
    try {

        const {id} = req.body;

        const order = await Order.findOne({orderId: id}).populate('orderedItems.product')
        console.log(order)

        if(!order){
            return res.status(404).json({message: 'Order not Found'})
        }

        for(let item of order.orderedItems){
            const product = item.product;

            const variant = product.variant.find(v => v.size === item.size)

            if(variant){
                variant.stock += item.quantity
            }

            await product.save();
        }

        if(order.paymentMethod == 'razorpay'){
            const user = await User.findById(order.userId)

            user.wallet += order.finalAmount;

            user.transactions.push({
                type: 'Credited',
                amount: order.finalAmount,
                description: `Refund for order cancellation (Order Id: ${order.orderId})`
            })

            await user.save();
        }
       

        order.status = 'Cancelled';
        await order.save();

        res.json({message: 'Order Cancelled ans stock restored'})
        
    } catch (error) {
        console.log('Error Cancelling order:', error);
        res.status(500).json({ message: 'Server error' });
    }
}


const loadReturnRequests = async (req, res) => {
    try {

        const returnRequests = await Order.find({ status: 'Return Request' }).populate('userId');



        res.render('return-requests', { returnRequests });
    } catch (error) {
        console.error('Error fetching return requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


const processReturn = async (req, res) => {
    const { orderId, action } = req.body; 

    try {
        const order = await Order.findOne({orderId}).populate('orderedItems.product')

        if (!order || order.status !== 'Return Request') {
            return res.status(400).json({ success: false, message: 'Invalid order or return not requested.' });
        }

        if (action === 'approve') {

            order.status = 'Returned';


            for (let item of order.orderedItems) {
                const product = item.product;
                const variant = product.variant.find(v => v.size === item.size);
                if (variant) {
                    variant.stock += item.quantity;
                }
                await product.save();
            }


            if (order.paymentMethod === 'razorpay' || order.paymentMethod === 'COD') {

                const user = await User.findById(order.userId);

                user.wallet += order.finalAmount;

                user.transactions.push({
                    type: 'Refund',
                    amount: order.finalAmount,
                    description: `Refund for returned order (Order ID: ${order.orderId})`,
                });
                await user.save();
            }

            await order.save();
            res.status(200).json({ success: true, message: 'Return approved and processed.' });
        } else if (action === 'deny') {

            order.status = 'Delivered'; 
            await order.save();
            res.status(200).json({ success: true, message: 'Return request denied.' });
        }

    } catch (error) {
        console.error('Error processing return:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    loadOrderPage,
    changeStatus,
    cancelOrder,
    loadReturnRequests,
    processReturn
}