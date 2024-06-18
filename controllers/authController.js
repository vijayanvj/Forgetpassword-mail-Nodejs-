const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { secretKey } = require("../config");
const crypto = require('crypto');
const { sendEmail } = require("../utils/emailService");

const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();
    
    // Generate and save OTP
    const generatedOTP = crypto.randomInt(100000, 999999).toString();
    const newOTP = new OTP({
      email,
      otp: generatedOTP,
      expiresAt: new Date(new Date().getTime() + 10 * 60 * 1000) // OTP expires in 10 minutes
    });
    await newOTP.save();

    // Send registration email and OTP verification email
    const registrationEmail = `
      <h1>Welcome to Node.js Authentication</h1>
      <p>Your account has been successfully registered.</p>
    `;
    await transporter.sendMail({
      from: 'kgislsmtp@gmail.com',
      to: email,
      subject: 'Registration Successful',
      html: registrationEmail
    });

    // Send OTP verification email
    await transporter.sendMail({
      from: 'kgislsmtp@gmail.com',
      to: email,
      subject: 'OTP Verification',
      text: `Your OTP for registration is: ${generatedOTP}`
    });

    res.status(201).json({ message: "User registered successfully. OTP sent to email for verification." });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }
    const token = jwt.sign({ userId: user._id }, secretKey);
    res.json({ token });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const resetToken = jwt.sign({ userId: user._id }, secretKey, { expiresIn: "1h" });
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();
    // Send forget password email
    // const resetPasswordLink = `http://localhost:3001/reset-password/${resetToken}`;
    // const forgetPasswordEmail = `
    //   <h1>Reset Your Password</h1>
    //   <p>You have requested to reset your password. Click the link below to reset:</p>
    //   <a href="${resetPasswordLink}">Reset Password</a>
    //   <p>If you didn't request this, please ignore this email.</p>
    // `;
    // await sendEmail(email, "Password Reset Request", forgetPasswordEmail);
    res.json({ message: "Password reset email sent successfully" });
  } catch (error) {
    console.error("Error sending forget password email:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    const decodedToken = jwt.verify(resetToken, secretKey);
    if (!decodedToken.userId) {
      return res.status(400).json({ message: "Invalid reset token" });
    }
    const user = await User.findById(decodedToken.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.resetToken !== resetToken || user.resetTokenExpiry < Date.now()) {
      return res.status(400).json({ message: "Expired or invalid reset token" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetTokenExpiry = undefined; // Invalidate the token
    await user.save();
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { register, login, forgotPassword, resetPassword };
