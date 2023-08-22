import AWS from 'aws-sdk';
import {initAws} from './init.js';

// setup AWS SDK
initAws();
const SES = new AWS.SES()

const adminMail = "me@example.com>";

const sendEmail = function(mailData) {
  var params = {
    Destination: { 
      CcAddresses: mailData.cc || [],
      ToAddresses: mailData.to
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8", 
          Data: mailData.html || mailData.text
        }, 
        Text: {
          Charset: "UTF-8", 
          Data: mailData.text
        }
      }, 
      Subject: {
        Charset: "UTF-8", 
        Data: mailData.subject
      }
    }, 
    ReplyToAddresses: [],
    Source: mailData.from,
  };
  return SES.send( new SendEmailCommand(params) );
};

const resetPassword = (reqEmail) => {
  return sendEmail({
    from: adminMail,
    to: [reqEmail],
    subject: 'Reset Password',
    text: 'Would you like to reset your email?'
  });
};

export {resetPassword};
