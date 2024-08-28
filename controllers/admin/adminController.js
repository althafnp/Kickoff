const User = require('../../models/userSchema');
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');


const loadDashboard = async (req, res) => {
    try {
        if(req.session.admin){
            res.render('dashboard');
        }
        else{
            return res.redirect('/admin/auth/login')
        }
    } catch (error) {
        console.log('Cannot find Dashboard', error);
        res.status(500).send('Server error')
    }
}

module.exports = {
    loadDashboard
}