const sgMail = require('@sendgrid/mail');
const dotenv = require("dotenv");

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const mailer = {
  /**
   * @description This method is used to send custom emails
   * @param {String} emailAddress
   * @param {Object} emailContent
   * @returns {Boolen} Status of sent email
   */
  sendCustomMail(emailAddress, emailContent) {
    const { emailSubject, emailBody } = emailContent;

    const msg = {
      to: emailAddress,
      from: 'Bewla <assistance@bewla.com>',
      subject: emailSubject,
      html: emailBody
    };

    return sgMail
      .send(msg)
      .then(() => ({ success: true, message: 'email sent' }))
      .catch(() => ({ success: false, message: 'email not sent' }));
  },
  /**
   * @description This method is used to send a verification mail to a user
   * @param {String} emailAddress
   * @param {string} username
   * @param {string} link
   * @returns {Boolen} Status of sent email
   */
  sendVerificationMail(emailAddress, username, link) {
    const emailSubject = 'Verify your email on Authors Haven';

    const emailBody = `
      <div>
        <h2 style="color: grey">Hello ${username}, Thanks for signing up on Heimdal</h2>
        Please click <a style="color: blue" href="${link}">here</a> to verify your email address, this link expires in two days.
        Alternatively you can copy out the link below and paste in your browser <a href="${link}">${link}</a>
      </div>
    `;

    const emailContent = { emailSubject, emailBody };
    mailer.sendCustomMail(emailAddress, emailContent);
  },
  /**
   * @description This method is used to send a verification mail to a user
   * @param {String} emailAddress
   * @param {string} username
   * @param {string} link
   * @returns {Boolen} Status of sent email
   */
  sendPasswordResetMail(emailAddress, fullname, resetCode) {
    const emailSubject = 'Reset Your Password';

    const emailBody = `
      <div>
        <h2 style="color: grey">Hello ${fullname}, You requested to reset your Bewla Password</h2>
        <h2 style="color: red">Please delete this email immediately if this request wasn't made by you</h2>
        Your Password Reset Code is ${resetCode}
      </div>
    `;

    const emailContent = { emailSubject, emailBody };
    mailer.sendCustomMail(emailAddress, emailContent);
  },
  /**
   * @description This method is used to send a verification mail to a user
   * @param {String} emailAddress
   * @param {string} username
   * @param {string} link
   * @returns {Boolen} Status of sent email
   */
  sendPinResetMail(emailAddress, fullname, resetCode) {
    const emailSubject = 'Reset Your Transaction Pin';

    const emailBody = `
      <div>
        <h2 style="color: grey">Hello ${fullname}, You requested to reset your transaction pin</h2>
        <h2 style="color: red">Please delete this email immediately if this request wasn't made by you</h2>
        Your Transaction Pin Reset Code is ${resetCode}
      </div>
    `;

    const emailContent = { emailSubject, emailBody };
    mailer.sendCustomMail(emailAddress, emailContent);
  }
};

module.exports = mailer;
