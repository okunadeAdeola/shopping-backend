"use strict";

let User = require('../model/user.model');
let Newsletter = require('../model/newsletter.model');
const dotenv = require ('dotenv');
const jwt = require("jsonwebtoken")
const nodemailer = require ('nodemailer')
const mongoose = require ('mongoose');
const bcryptjs = require('bcryptjs');
const verifyToken = require('../middleware/verifyToken');


dotenv.config();

const pass = process.env.PASS;
const USERMAIL = process.env.USERMAIL;
const tokenStorage = new Map();

function generating() {
  return Math.floor(1000 + Math.random() * 9000)
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: USERMAIL,
    pass: pass
  },
  tls: {
    rejectUnauthorized: false, // this ignores the invalid certificate
  },
})

const Adeysquare =
  "https://res.cloudinary.com/dl0nnmoah/image/upload/v1730298606/holi_dc2vfj.jpg";
const OTP_EXP_MINUTES = 5;


/** ===== HELPERS ===== */
// const sendMailSafe = async (options) => {
//   try {
//     await transporter.sendMail(options);
//   } catch (err) {
//     console.error("Email send failed:", err.message);
//     // Non-fatal: we don’t block the core flow on email failure.
//   }
// };

// const createJwt = (user) =>
//   jwt.sign({ id: user._id.toString(), email: user.email }, JWT_SECRET, {
//     expiresIn: "10h",
//   });


// Newsletter subscribe
 const newsletter = (req, res) => {
    let form = new Newsletter(req.body)
    form.save()
    .then((response)=>{
      console.log(response);
      return res.status(200).json({status: true, message: 'email submitted successfully'})
    })
    .catch((err)=> {
      if(err.code === 11000){
        res.status(409).json({ status: false, message: "Duplicate user found" });
      }
      else{
        res.status(400).json({ status: false, message: "Fill in appropriately" });
      }
    })
  }

// Register
const register = (req, res) => {
    let form = new User(req.body);
    const { firstname, lastname, email, password } = req.body;
    const newUser = new User({
      firstname,
      lastname,
      email,
      password,
    })
    // console.log(newUser);
    newUser.save()
      .then((result) => {
        console.log(result);
        res.status(200).json({ status: true, message: "User signed up successfully", result });
        console.log('✔ user found', email);
        const mailOptions = {
          from: process.env.USER,
          to: email,
          subject: "Welcome to Shoppinsphere",
          html: `
            <div style="background-color: rgb(4,48,64); padding: 20px; color: rgb(179,14,100); border-radius: 5px">
              <img src="${Adeysquare}" alt="Shoppinsphere Logo" style="max-width: 150px; height: 130px; margin-bottom: 20px; margin-left: 300px;">
              <div style="text-align: center;">
              <p style="font-size: 18px;">Hello, ${firstname}!</p>
              <p style="font-size: 16px;">Welcome to Adey Square! We're thrilled that you've chosen to register with us.</p>
              <p style="font-size: 16px;">If you have any questions or need assistance, feel free to reach out @Okunade288@gmail.com.</p>
              <p style="font-size: 16px;">Thank you for joining us.</p>
              <p style="font-size: 16px;">Best regards,</p>
              <p style="font-size: 16px;">The Shoppinsphere Team</p>
              </div>
            </div>
          `,
        };
          return transporter.sendMail(mailOptions)
      })
      .catch((err) => {
        console.error(err);
        if (err.code === 11000) {
          res.status(409).json({ status: false, message: "Duplicate user found" });
        } else {
          res.status(400).json({ status: false, message: "Fill in appropriately" });
        }
      });
  }
// Login
const userLogin = async (req, res) => {
  console.log(req.body);
  const { password, email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (user) {
      const secrete = process.env.SECRET;
      user.validatePassword(password, (err, same) => {
        if (err) {
          res.status(500).json({ message: "Server error", status: false });
          res.status(400).json({ message: "Fill in appropriately", status: false });
        } else {
          if (same) {
            const token = jwt.sign({ email }, secrete, { expiresIn: "10h" });
            res.status(200).json({ message: "User signed in successfully", status: true, token, user });
          } else {
            console.log(err);
            
            res.status(401).json({ message: "Wrong password, please type the correct password", status: false });
          }
        }
      });
    } else {
      res.status(404).json({ message: "Wrong email, please type the correct email", status: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", status: false });
  }
}


// Protected: Dashboard
const getDashboard = async (req, res) => {
  try {
      const userId = req.user.id;
      const userDetail = await userModel.findById(userId);
      if (!userDetail) {
          return res.status(404).json({ status: false, message: "User not found" });
      }

      res.json({ status: true, message: "Welcome to the Dashboard", userDetail });
  } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, message: "Server error" });
  }
};


const password = (req, res) => {
  const { email } = req.body;
  console.log(email);
  const resetToken = generating();
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + 24);

  tokenStorage.set(resetToken, { email, expires: expirationDate, pin: generating() });
  console.log(email);

  User.findOne({ email })
    .then((result) => {
      if (result === null) {
        console.log('user not found', email);
        res.status(500).json({ message: '❌ User not found', status: false })
      } else {
        console.log('✔ user found', email);
        const mailOptions = {
          from: USERMAIL,
          to: email,
          subject: 'Your OTP Code',
          text: `Your 4-digit PIN code is: ${resetToken}`,
        };
        return transporter.sendMail(mailOptions)
          .then((emailResult) => {
            console.log(emailResult);
            User.updateOne({ email }, { $set: { otp: resetToken } })
              .then(result => {
                console.log(result);
                res.status(200).json({ message: 'Email sent successful', status: true });
              }).catch(() => {
                res.status(500).json({ message: 'Error occur while updating Model', status: false });
              });
          }).catch((error) => {
            console.log(error);
            res.status(500).json({ message: 'Error occur while sending email', status: false });
          });
      }
    }).catch((err) => {
      console.log(err);
      console.error('Error in sendResetEmail:', err);
      res.status(500).json({ message: '❌ Internal server error', status: false });
    });

};


const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);
  try {
      const user = await userModel.findOne({ email });
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      user.otp = otp;
      await user.save();
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.USER,
          pass: process.env.PASS, 
        },
      });
  
      const mailOptions = {
        from: process.env.USER, 
        to: email,
        subject: 'Reset Password',
        text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
      };
  
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'OTP sent successfully', otp });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const user = await userModel.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.otp !== otp) {
    logger.error('Invalid OTP');
    return res.status(400).json({ message: 'Invalid OTP' });
  }
  user.otp = null;
  await user.save();

  res.status(200).json({ message: 'OTP verified successfully' });
};



const resetPassword = (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'Missing required data' });
  }
  console.log('missing data');
  console.log(email, otp, newPassword);

  User.findOne({ email, otp })
    .then(async (user) => {
      if (!user) {
        return res.status(500).json({ message: 'User not found' });
      }
      console.log('is ok');
      const hashPassword = await bcryptjs.hash(newPassword, 10);
      userModel.updateOne({ _id: user._id }, { password: hashPassword })
        .then(user => {
          res.status(200).json({ message: 'Password reset successful' });
          console.log('Password reset successful');
        }).catch((error) => {
          res.status(500).json({ message: 'Internal server error' });
          console.log('internal server error');
        })

    }).catch((error) => {
      console.log(error);
    })
}
/** ===== OTP PASSWORD RESET FLOW =====
 * 1) POST /forgotPassword  -> generate OTP, save + expiry, email
 * 2) POST /verifyOtp       -> verify OTP & expiry (✅ we DO NOT clear it here)
 * 3) POST /resetPassword   -> verify OTP again, set new pwd, clear OTP
 */

// Step 1: request OTP
// const forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email) return res.status(400).json({ message: "Email is required", status: false });

//     const user = await Usermodel.findOne({ email });
//     if (!user) return res.status(404).json({ message: "User not found", status: false });

//     const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit
//     const expires = new Date(Date.now() + OTP_EXP_MINUTES * 60 * 1000);

//     user.otp = otp;
//     user.otpExpires = expires;
//     await user.save();

//     await sendMailSafe({
//       from: MAIL_USER,
//       to: email,
//       subject: "Reset Password",
//       text: `Your OTP code is: ${otp}. It will expire in ${OTP_EXP_MINUTES} minutes.`,
//     });

//     return res.status(200).json({ message: "OTP sent successfully", status: true });
//   } catch (error) {
//     console.error("Error sending OTP:", error);
//     return res.status(500).json({ message: "Internal server error", status: false });
//   }
// };

// // Step 2: verify OTP (DO NOT clear it here)
// const verifyOtp = async (req, res) => {
//   try {
//     const { otp } = req.body;

//     if (!otp) {
//       return res.status(400).json({ message: "OTP is required", status: false });
//     }

//     // Find user by OTP
//     const user = await Usermodel.findOne({ otp });
//     if (!user || user.otp == null) {
//       return res.status(404).json({ message: "Invalid OTP", status: false });
//     }

//     const now = new Date();
//     if (user.otpExpires && now > user.otpExpires) {
//       return res.status(410).json({ message: "OTP expired, request a new one", status: false });
//     }

//     if (String(user.otp) !== String(otp)) {
//       return res.status(404).json({ message: "Invalid OTP", status: false });
//     }

//     // Mark OTP as verified (set a flag in DB)
//     user.isOtpVerified = true;
//     await user.save();

//     return res.status(200).json({ message: "OTP verified successfully", status: true });
//   } catch (error) {
//     console.error("Error verifying OTP:", error);
//     return res.status(500).json({ message: "Internal server error", status: false });
//   }
// };


// // Step 3: reset password (verifies OTP again and clears it)
// // ===== resetPassword.js =====
// const resetPassword = async (req, res) => {
//   try {
//     const { email, newPassword } = req.body;

//     if (!email || !newPassword) {
//       return res.status(400).json({ message: "Missing required data", status: false });
//     }

//     const user = await Usermodel.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: "User not found", status: false });
//     }

//     // ✅ OTP must have been verified earlier
//     if (!user.isOtpVerified) {
//       return res.status(403).json({ message: "OTP not verified", status: false });
//     }

//     // Hash new password
//     const hashedPassword = await bcryptjs.hash(newPassword, 10);
//     user.password = hashedPassword;

//     // Clear OTP + verification flag
//     user.otp = null;
//     user.otpExpires = null;
//     user.isOtpVerified = false;

//     await user.save();

//     return res.status(200).json({ success: true, message: "Password reset successful", status: true });
//   } catch (error) {
//     console.error("Error resetting password:", error);
//     return res.status(500).json({ message: "Internal server error", status: false });
//   }
// };



module.exports = {register, userLogin, password, resetPassword, getDashboard, newsletter, verifyOtp, forgotPassword};
