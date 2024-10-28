const User = require('../../models/userSchema');
const Product = require('../../models/productSchema');
const Cart = require('../../models/cartSchema');
const Order = require('../../models/orderSchema');
const Address = require('../../models/addressSchema')
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');


const loadOrdersPage = async (req, res) => {
    try {
        if (req.user) {
            const userId = req.user._id;

            const page = parseInt(req.query.page) || 1;
            const limit = 5;
            const skip = (page - 1) * limit;

            const totalOrders = await Order.countDocuments({userId: userId})

            const order = await Order.find({ userId: userId })
                .populate('orderedItems.product')
                .populate('address')
                .sort({createdOn: -1})
                .skip(skip)
                .limit(limit)

            const totalPages = Math.ceil(totalOrders / limit);


            if (!order || order.length === 0) {
                return res.render('orders', { user: req.user, message: 'Currently No Orders' })
            }


            return res.render('orders', { 
                user: req.user,
                order,
                currentPage: page,
                totalPages,
                totalOrders,
            })
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

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        for (let item of order.orderedItems) {
            const product = item.product;

            const variant = product.variant.find(v => v.size === item.size)


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


const downloadInvoice = async (req, res) => {
    try {

        const userId = req.user._id;
        const orderId = req.params.orderId;

        const order = await Order.findOne({orderId}).populate('userId').populate('orderedItems.product')
        const userAddress = await Address.findOne({userId: userId})

        if(userAddress){
            var usedAddress = userAddress.address.find(addr => addr._id.toString() === order.address.toString());

            if (!usedAddress) {
                return res.status(404).json({ success: false, message: 'Address not found.' });
            }
        }

        const totalPriceWithAdditional = order.totalPrice + order.discount
        const deliveryCharge = 40


        // Set headers for PDF download
        res.setHeader('Content-disposition', `attachment; filename=invoice_${orderId}.pdf`);
        res.setHeader('Content-type', 'application/pdf');

        const doc = new PDFDocument();

        // Stream the PDF to the response
        doc.pipe(res);

        // Company Logo and Header
        doc.image(path.resolve(__dirname, '../../public/images/logo.png'), 50, 50, { width: 100 })
        //    .fontSize(20).text('Your Company Name', 200, 65, { align: 'right' })
        //    .moveDown(1)
        //    .fontSize(12).text('Your Company Slogan', { align: 'right' })
        //    .moveDown(1);

        // Add Invoice Number and Date
        doc.fontSize(10).text(`Invoice Number: ${orderId}`, { align: 'right' })
           .text(`Invoice Date: ${new Date(order.createdOn).toLocaleDateString()}`, { align: 'right' })
           .moveDown(1);

        // Add Customer Details Section
        doc.fontSize(12).text('Customer Details', { underline: true })
           .moveDown(0.5)
           .fontSize(10)
           .text(`Customer Name: ${order.userId.name}`)
           .text(`Phone: ${usedAddress.phone}`)
           .text(`City: ${usedAddress.city}, State: ${usedAddress.state}, Pincode: ${usedAddress.pincode}`)
           .moveDown(1);

        // Add Order Details Header
        doc.fontSize(12).text('Order Details', { underline: true })
           .moveDown(0.5);

        // Create Order Details Table
        doc.fontSize(10);
        order.orderedItems.forEach(item => {
            doc.text(`Product: ${item.product.productName}`, { continued: true })
               .text(`Quantity: ${item.quantity}`, { continued: true, align: 'right' })
               .moveDown(1)
               .text(`Price per item: ${(item.price / item.quantity).toFixed(2)}`, { continued: true }).moveDown(1)
               .text(`Total: ${item.price.toFixed(2)}`, { align: 'right' }).moveDown(1)
            doc.moveDown(1);
        });

        // Add Prices Breakdown
        doc.moveDown(1)
           .fontSize(12).text('Summary', { underline: true })
           .moveDown(0.5)
           .fontSize(10)
           .text(`Total Price Before Discount: ${(totalPriceWithAdditional - deliveryCharge).toFixed(2)}`)
           .text(`Discount: ${order.discount.toFixed(2)}`)
           .text(`Delivery Charge: ${deliveryCharge.toFixed(2)}`)
           .moveDown(0.5)
           .fontSize(12).text(`Final Amount: ${order.finalAmount.toFixed(2)}`, { bold: true })
           .moveDown(1);

        // Add Payment Method
        doc.fontSize(10)
           .text(`Payment Method: ${order.paymentMethod}`)
           .moveDown(1);

        // Footer with Thank You Message
        doc.moveDown(2)
           .fontSize(12).text('Thank you for shopping with us!', { align: 'center', bold: true })
           .fontSize(10).text('We hope to see you again soon.', { align: 'center' });

        // Finalize the PDF
        doc.end();

        
    } catch (error) {
        console.error('Error generating Invoice:', error);
        res.status(500).json({ message: 'An error occurred while generating Invoice.' });
    }
}




module.exports = {
    loadOrdersPage,
    cancelOrder,
    orderDetails,
    requestReturn,
    downloadInvoice
}