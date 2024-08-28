const User = require('../../models/userSchema')
const nodemailer = require('nodemailer');
const env = require('dotenv').config();
const bcrypt = require('bcrypt');
const { ReturnDocument } = require('mongodb');

//LOAD SIGNUP PAGE
const loadSignupPage = async (req, res) => {
    try {
        return res.render('signup');
    } catch (error) {
        console.log('SignupPage not found', error);
        res.status(500).send('Server error')
    }
}


//GENERATE OTP AND NODEMAILER
function generateOtp() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

async function sendVerificationEmail(email, otp){
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth:{
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        });

        const info = transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: 'Verify your account',
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP: ${otp}</b>`
        });

        return (await info).accepted.length > 0;
    } catch (error) {
        console.log('Error sending Email', error);
        return false;
    }
}

//SIGNUP VALIDATION
const signup = async (req, res) => {
    try {
        const {name, email, password, confirmPassword} = req.body;

        if(password != confirmPassword){
            return res.render('signup', {message: 'Password does not match'})
        };

        const findUser = await User.findOne({email});
        if(findUser){
            return res.render('signup', {message: 'User with this email already exist'});
        }

        const otp = generateOtp();

        const emailSent = await sendVerificationEmail(email, otp);
        
        if(!emailSent){
            console.log('ok');
            return res.json('email-error');
        }
        
        
        req.session.userOtp = otp;
        req.session.userData = {name, email, password};

        // res.redirect('/auth/verify-otp');
        res.render('verify-otp');
        console.log('OTP sent', otp);

    } catch (error) {
        console.log('Signup error', error);
        res.status(500).send('Page not found')
    }
}

//PASSWORD HASHING
const securePassword = async (password) => {
    try {

        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;

    } catch (error) {
        console.log('Password hashing error', error);
    }
}


// const loadOtpPage = async (req, res) => {
//     try {
//         return res.render('verify-otp');
//     } catch (error) {
//         console.log('Otp page not found', error);
//         res.status(500).send('Server error');
//     }
// }
//VERIFYING OTP
const verifyOtp = async (req, res) => {
    try {
        
        const {otp} = req.body;
        console.log(otp);

        if(otp === req.session.userOtp){
            const user = req.session.userData;

            const passwordHash = await securePassword(user.password);

            const saveUserData = new User({
                name: user.name,
                email: user.email,
                password: passwordHash
            });

            await saveUserData.save();
            req.session.user = saveUserData._id;

            res.json({success: true, redirectUrl: '/auth/login'});
        }
        else{
            res.status(400).json({success: false, message: 'Invalid OTP, Please try again'})
        }

    } catch (error) {
        console.log('OTP verification failed', error);
        res.status(500).json({success: false, message: 'An error occured'})
    }
}

//RESEND OTP
const resendOtp = async (req, res) => {
    try {
        const {email} = req.session.userData;

        if(!email){
            return res.status(400).json({success: false, message: 'Email not found in session'})
        }

        const otp = generateOtp();
        req.session.userOtp = otp;

        const emailSent = await sendVerificationEmail(email, otp);
        if(emailSent){
            console.log('Resend OTP: ', otp);
            res.status(200).json({success: true, message: 'OTP Resend Successfully'})
        }
        else{
            res.status(500).json({success: false, message: 'Failed to resend OTP. Please try again'})
        }
    } catch (error) {
        console.log('Resend OTP error', error);
        res.status(500).json({success: false, message: 'Server error. Please try again'})
    }
}



//LOAD LOGIN PAGE
const loadLoginPage = async (req, res) => {
    try {

        if(!req.session.user){
            return res.render('login');
        }
        else{
            res.redirect('/')
        }

    } catch (error) {
        console.log('LoginPage not found',error);
        res.status(500).send('Server error');
    }
};

const login = async (req, res) => {
    try {
        
        const {email, password} = req.body;

        const findUser = await User.findOne({isAdmin: false, email: email});

        if(!findUser){
            return res.render('login', {message: 'User not found'});
        }

        if(findUser.isBlocked){
            return res.render('login', {message: 'User is currently blocked'})
        }

        const passwordMatch = await bcrypt.compare(password, findUser.password);

        if(!passwordMatch){
            return res.render('login', {message: 'Incorrect password'});
        }

        req.session.user = findUser._id;
        res.redirect('/');

    } catch (error) {
        
        console.log('Login error', error);
        res.render('login', {message: 'Login failed. Please try again'});

    }
}


const logout = async (req, res) => {
    try {

        req.session.destroy((err) => {
            if(err){
                console.log('Session not destroyed error', err);
                return res.send('Logout Failed. Please Try Again');
            }

            return res.redirect('/auth/login')
        })

    } catch (error) {
        console.log('Logout error', error);
        res.status(500).send('Server error');
    }
}



module.exports = {
    loadSignupPage,
    loadLoginPage,
    signup,
    verifyOtp,
    resendOtp,
    login,
    logout
}