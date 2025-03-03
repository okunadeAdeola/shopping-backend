const express = require('express');
const router = express.Router()
const verifyToken = require('../middleware/verifyToken');


const {register, userLogin, password, resetPassword, getDashboard, newsletter,verifyOtp, forgotPassword} = require('../controller/user.controller')

router.post('/signup', register);
router.post('/login', userLogin);
router.post('/forgotPassword', password);
router.post('/resetPassword', resetPassword);
router.post('/news', newsletter);
// router.post('/sendResetEmail', sendResetEmail);
router.post('/forgotPassword', forgotPassword);
router.post('/verifyOtp', verifyOtp);

router.get('/dashboard', verifyToken, getDashboard);

module.exports = router;