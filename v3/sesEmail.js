import { SESClient, SendEmailCommand }  from '@aws-sdk/client-ses';
import {initAws, region} from './init.js';

// setup AWS SDK
const awsConfigEnv = initAws();
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
  return new SESClient({region, credentials: awsConfigEnv}).send( new SendEmailCommand(params) );
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
