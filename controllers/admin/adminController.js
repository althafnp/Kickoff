const User = require('../../models/userSchema');
const Order = require('../../models/orderSchema')
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
            const weekStart = new Date(today.setDate(today.getDate() - today.getDay())); // Start of the week
            query.createdOn = { $gte: weekStart };
        } else if (filter === 'monthly') {
            const startOfMonth = new Date(new Date().setDate(1)); // Start of the month
            query.createdOn = { $gte: startOfMonth };
        } else if (filter === 'yearly') {
            const startOfYear = new Date(new Date().getFullYear(), 0, 1); // Start of the year
            query.createdOn = { $gte: startOfYear };
        } else if (filter === 'custom' && startDate && endDate) {
            query.createdOn = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }


        const orders = await Order.find(query);



        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);
        const totalDiscount = orders.reduce((acc, order) => acc + (order.discount || 0), 0);

        


        res.render('dashboard', {
            totalOrders,
            totalRevenue,
            totalDiscount
        });



    } catch (error) {
        console.log('Cannot find Dashboard', error);
        res.redirect('/admin/page-error')
    }
}



module.exports = {
    pageError,
    loadDashboard
}