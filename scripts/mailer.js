"use strict";
const dotenv = require('dotenv');
const nodemailer = require("nodemailer");
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  service: "gmail",
  port: 587,
  secure: false,
  auth: {
    // TODO: replace `user` and `pass` values from <https://forwardemail.net>
    user: process.env.user,
    pass: process.env.password,
  },
});

async function send(toMail, html, subject) {
  try {
    if(toMail === '') return null;
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: process.env.use, // sender address
      to: toMail, // list of receivers
      subject: subject, // Subject line
      text: "", // plain text body
      html: html, // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    //
    // NOTE: You can go to https://forwardemail.net/my-account/emails to see your email delivery status and preview
    //       Or you can use the "preview-email" npm package to preview emails locally in browsers and iOS Simulator
    //       <https://github.com/forwardemail/preview-email>
  //
  } catch (error) {
    console.log(error);
  }
  
}

module.exports = {
  send
}