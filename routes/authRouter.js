const express = require('express');
const router = express.Router();
const authController = require('../controllers/user/authController.js');
const passport = require('passport');


router.get('/signup', authController.loadSignupPage)
router.post('/signup', authController.signup)
router.post('/verify-otp', authController.verifyOtp)

router.post('/resend-otp', authController.resendOtp)

router.get('/login', authController.loadLoginPage)
router.post('/login', authController.login)


router.get('/google', passport.authenticate('google', {scope:['profile', 'email']}));
router.get('/google/callback', passport.authenticate('google', {failureRedirect: '/auth/signup'}), (req, res) => {
    req.session.user = req.user._id;
    if (req.session.user){
        res.redirect('/');
    }
    else{
        return res.redirect('/auth/google/callback');
    }
    
});

router.get('/logout', authController.logout)

module.exports = router;