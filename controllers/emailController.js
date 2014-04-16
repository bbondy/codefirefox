"use strict";

let nodemailer = require('nodemailer'),
  configController = require('../controllers/configController');

/**
 * Sends text to the specified email address
 *
 * @param to A comma separated list of email addresses to send to
 * @param subject The subject line for the email address
 * @param html The body of the email to send in HTML format
 *             Text format will also be sent with stripped out markup
 * @param callback The node style callback to call after the email is sent
 */
exports.sendMail = function(to, subject, html, callback) {

  let smtpTransport = nodemailer.createTransport("SMTP",{
      service: configController.config.emailService,
      auth: {
          user: configController.config.smtpUser,
          pass: configController.config.smtpPass
      }
  });

  let text = html.replace(/(<([^>]+)>)/ig,"");
  let mailOptions = {
      from: configController.config.emailFrom,
      to: to,
      subject: subject,
      text: text,
      html: html
  }

  smtpTransport.sendMail(mailOptions, callback);
};


exports.sendMailToAdmins = function(subject, html, callback) {
  return exports.sendMail(configController.config.adminEmails, subject, html, callback);
}
