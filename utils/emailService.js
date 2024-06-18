const nodemailer = require("nodemailer");
const { email: emailConfig } = require("../config");

const transporter = nodemailer.createTransport(emailConfig);

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: emailConfig.auth.user,
      to,
      subject,
      html,
    });
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = { sendEmail };
