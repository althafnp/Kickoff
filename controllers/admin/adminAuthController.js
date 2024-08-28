const User = require('../../models/userSchema');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt')



const loadLogin = (req, res) => {

    if(req.session.admin){
        return res.redirect('/admin/dashboard');
    }
    else{
        res.render('admin-login')
    }
}

const login = async (req, res) => {
    try {
        
        const {email, password} = req.body;
        const admin = await User.findOne({email: email, isAdmin: true});

        if(admin){
            const passwordMatch = await bcrypt.compare(password, admin.password);
            if(passwordMatch){
                req.session.admin = true;
                return res.redirect('/admin/dashboard')
            }
            else{
                return res.render('admin-login', {message: 'Invalid Password'})
            }
        }
        else{
            return res.render('admin-login', {message: 'Not Admin Found'})
        }

    } catch (error) {
        console.log('Admin login error', error);
        res.status(500).send('Server Error')
    }
}


const logout = async (req, res) => {
    try {

        req.session.destroy((err) => {
            if(err){
                console.log('Admin session destroy error', err);
                return res.send('Logout failed. Please try again');
            }

            res.redirect('/admin/auth/login');
        })

    } catch (error) {
        console.log('Admin logout error');
        res.status(500).send('Server error');
    }
}



module.exports = {
    loadLogin,
    login,
    logout
}