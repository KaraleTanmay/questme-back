const nodemailer = require('nodemailer');

const sendEmail = async options => {

    // 1) Create a transporter
    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.NODEMAILER_AUTH,
            pass: process.env.NODEMAILER_PASSWORD
        }
    });

    // 2) Define the email options
    const mailOptions = {
        from: 'QuestionMe',
        to: options.email || "tanmaykarale8112@gmail.com",
        subject: options.subject,
        text: options.text
    };

    // 3) Actually send the email
    transport.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

module.exports = sendEmail;