const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");
require("dotenv").config({});

module.exports = class Email {
  constructor(user, token) {
    this.to = user.email;
    this.firstName = user.firstName;
    this.token = token;
    this.from = `Ahmed Shehab <${process.env.EMAIL_FROM}>`;
  }

  _newTransport() {
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.GOOGLE_PASS,
      },
      tls: {
        ciphers: "SSLv3",
      },
    });
  }

  async _send(template, subject) {
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      token: this.token,
    });

    const text = htmlToText.convert(html);

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text,
    };

    await this._newTransport().sendMail(mailOptions);
  }

  async sendVerification() {
    await this._send("verification", "Welcome to the gp family!");
  }

  async sendPasswordReset() {
    await this._send(
      "passwordReset",
      "Your password reset token (valid for only 10 minutes)"
    );
  }
};
