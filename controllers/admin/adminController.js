const User = require('../../models/userSchema');
const Order = require('../../models/orderSchema')
const Product = require('../../models/productSchema')
const PDFDocument = require('pdfkit')
const fs = require('fs')
const XLSX = require('xlsx')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');


const pageError = async (req, res) => {
    res.render('admin-error');
}

const loadDashboard = async (req, res) => {
    try {
        const { filter, startDate, endDate } = req.query;
        let query = {};


        if (filter === 'daily') {
            query.createdOn = { $gte: new Date().setHours(0, 0, 0, 0) };
        } else if (filter === 'weekly') {
            const today = new Date();
            const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
            query.createdOn = { $gte: weekStart };
        } else if (filter === 'monthly') {
            const startOfMonth = new Date(new Date().setDate(1)); 
            query.createdOn = { $gte: startOfMonth };
        } else if (filter === 'yearly') {
            const startOfYear = new Date(new Date().getFullYear(), 0, 1); 
            query.createdOn = { $gte: startOfYear };
        } else if (filter === 'custom' && startDate && endDate) {
            query.createdOn = { $gte: new Date(startDate), $lte: new Date(endDate) }; 
        }

        const orders = await Order.find(query)
        const successfulOrders = orders.filter(order => !['Returned', 'Cancelled'].includes(order.status));

        const totalOrders = successfulOrders.length;
        const totalRevenue = successfulOrders.reduce((acc, order) => acc + order.totalPrice, 0);
        const totalDiscount = successfulOrders.reduce((acc, order) => acc + (order.discount || 0), 0);

        const newUsersQuery = {};
        if (filter === 'daily') {
            newUsersQuery.createdAt = { $gte: new Date().setHours(0, 0, 0, 0) };
        } else if (filter === 'weekly') {
            const weekStart = new Date(new Date().setDate(new Date().getDate() - new Date().getDay()));
            newUsersQuery.createdAt = { $gte: weekStart };
        } else if (filter === 'monthly') {
            newUsersQuery.createdAt = { $gte: new Date(new Date().setDate(1)) };
        } else if (filter === 'yearly') {
            newUsersQuery.createdAt = { $gte: new Date(new Date().getFullYear(), 0, 1) };
        } else if (filter === 'custom' && startDate && endDate) {
            newUsersQuery.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const totalUsers = await User.find({ isAdmin: false }).countDocuments();
        const newUsers = await User.countDocuments(newUsersQuery);
        const totalProducts = await Product.countDocuments();

        res.render('dashboard', {
            totalOrders,
            totalRevenue,
            totalDiscount,
            totalUsers,
            newUsers,
            totalProducts,
        });

    } catch (error) {
        console.error('Cannot load Dashboard', error);
        res.redirect('/admin/page-error');
    }
};


const getSalesReport = async (req, res) => {
    try {
        const { filterType, startDate, endDate } = req.body;

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        let query = {};

        if (filterType === 'daily') {
            query.createdOn = { $gte: new Date().setHours(0, 0, 0, 0) };
        } else if (filterType === 'weekly') {
            const today = new Date();
            const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
            query.createdOn = { $gte: weekStart };
        } else if (filterType === 'monthly') {
            const startOfMonth = new Date(new Date().setDate(1));
            query.createdOn = { $gte: startOfMonth };
        } else if (filterType === 'yearly') {
            const startOfYear = new Date(new Date().getFullYear(), 0, 1);
            query.createdOn = { $gte: startOfYear };
        } else if (filterType === 'custom' && startDate && endDate) {
            query.createdOn = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const orders = await Order.find(query)
            .populate('userId')
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit);

        const count = await Order.countDocuments(query); 
        const totalPages = Math.ceil(count / limit);

        const successfulOrders = orders.filter(order => !['Returned', 'Cancelled'].includes(order.status));

        const totalOrders = successfulOrders.length;
        const totalRevenue = successfulOrders.reduce((acc, order) => acc + order.totalPrice, 0);
        const totalDiscount = successfulOrders.reduce((acc, order) => acc + (order.discount || 0), 0);

        const formattedOrders = orders.map(order => ({
            userId: order.userId,
            totalPrice: order.totalPrice,
            finalPrice: order.finalAmount || (order.totalPrice - (order.discount || 0)),
            status: order.status,
            paymentMethod: order.paymentMethod,
            createdOn: order.createdOn.toLocaleString() 
        }));

        res.json({
            totalOrders,
            totalRevenue,
            totalDiscount,
            orders: formattedOrders,
            totalPages,
            currentPage: page
        });

    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).json({ message: 'An error occurred while generating the sales report.' });
    }
};


const generateSalesPdfReport = async (req, res) => {
    try {
        const { filterType, startDate, endDate } = req.body;

        let query = {};


        if (filterType === 'daily') {
            query.createdOn = { $gte: new Date().setHours(0, 0, 0, 0) };
        } else if (filterType === 'weekly') {
            const today = new Date();
            const weekStart = new Date(today.setDate(today.getDate() - today.getDay())); 
            query.createdOn = { $gte: weekStart };
        } else if (filterType === 'monthly') {
            const startOfMonth = new Date(new Date().setDate(1)); 
            query.createdOn = { $gte: startOfMonth };
        } else if (filterType === 'yearly') {
            const startOfYear = new Date(new Date().getFullYear(), 0, 1); 
            query.createdOn = { $gte: startOfYear };
        } else if (filterType === 'custom' && startDate && endDate) {
            query.createdOn = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }


        const orders = await Order.find(query).populate('userId');

        

        const doc = new PDFDocument();
        const filename = 'sales-report.pdf';


        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);


        doc.pipe(res);

        doc.fontSize(18).text('Sales Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Filter Type: ${filterType}`, { align: 'left' });
        doc.text(`Start Date: ${startDate || 'N/A'}`, { align: 'left' });
        doc.text(`End Date: ${endDate || 'N/A'}`, { align: 'left' });
        doc.moveDown();


        doc.text('No.', 20, doc.y, { continued: true });
        doc.text('Customer Name', 40, doc.y, { continued: true });
        doc.text('Total Price', 60, doc.y, { continued: true });
        doc.text('Final Price', 80, doc.y, { continued: true });
        doc.text('Status', 100, doc.y, { continued: true });
        doc.text('Payment Method', 120, doc.y, { continued: true });
        doc.text('Created On', 140, doc.y);
        doc.moveDown();


        orders.forEach((order, index) => {
            doc.text(index + 1, 20, doc.y, { continued: true });
            doc.text(order.userId.name, 40, doc.y, { continued: true });
            doc.text(order.totalPrice, 80, doc.y, { continued: true });
            doc.text(order.finalAmount, 120, doc.y, { continued: true });
            doc.text(order.status, 180, doc.y, { continued: true });
            doc.text(order.paymentMethod, 220, doc.y, { continued: true });
            doc.text(new Date(order.createdOn).toLocaleDateString(), 280, doc.y);
            doc.moveDown();
        });


        doc.end();

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ message: 'An error occurred while generating the PDF report.' });
    }
};


const salesExcelReport = async (req, res) => {
    try {
        const { filterType, startDate, endDate } = req.body;

        let query = {};
        if (filterType === 'daily') {
            query.createdOn = { $gte: new Date().setHours(0, 0, 0, 0) };
        } else if (filterType === 'weekly') {
            const today = new Date();
            const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
            query.createdOn = { $gte: weekStart };
        } else if (filterType === 'monthly') {
            const startOfMonth = new Date(new Date().setDate(1));
            query.createdOn = { $gte: startOfMonth };
        } else if (filterType === 'yearly') {
            query.createdOn = { $gte: startOfYear };
        } else if (filterType === 'custom' && startDate && endDate) {
            query.createdOn = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }


        const orders = await Order.find(query).populate('userId');

        const data = [
            ['S.No', 'Customer Name', 'Total Price', 'Final Amount', 'Order Status', 'Payment Method', 'Created On']
        ];

        orders.forEach((order, index) => {
            data.push([
                index + 1,
                order.userId.name,
                `₹${order.totalPrice}`,
                `₹${order.finalAmount}`,
                order.status,
                order.paymentMethod,
                new Date(order.createdOn).toLocaleDateString()
            ]);
        });


        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');


        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });


        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="sales-report.xlsx"');


        res.send(buffer);

    } catch (error) {
        console.error('Error generating Excel report:', error);
        res.status(500).send('An error occurred while generating the Excel report.');
    }
};



const getTopSellingProducts = async (req, res) => {
    try {

        const topSellingProducts = await Order.aggregate([

            { $unwind: '$orderedItems' },

            {
                $group: {
                    _id: '$orderedItems.product',
                    totalSales: { $sum: '$orderedItems.quantity' }
                }
            },

            { $sort: { totalSales: -1 } },

            { $limit: 10 },

            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },

            { $unwind: '$productDetails' },

            {
                $project: {
                    productName: '$productDetails.productName',
                    totalSales: 1
                }
            }
        ]);

        res.json({
            success: true,
            topSellingProducts
        });
    } catch (error) {
        console.error('Error fetching top-selling products:', error);
        res.status(500).json({ success: false, message: 'Error fetching top-selling products.' });
    }
};



module.exports = {
    pageError,
    loadDashboard,
    getSalesReport,
    generateSalesPdfReport,
    salesExcelReport,
    getTopSellingProducts
}