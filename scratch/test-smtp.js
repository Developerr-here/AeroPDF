import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'flagwear1@gmail.com',
    pass: process.env.SMTP_PASS || 'wizq hzwp uqgh fcwn'
  }
});

console.log('Testing SMTP connection with:');
console.log('Host:', process.env.SMTP_HOST);
console.log('Port:', process.env.SMTP_PORT);
console.log('User:', process.env.SMTP_USER);

transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Verification Failed:', error);
    process.exit(1);
  } else {
    console.log('SMTP server is ready to take our messages!');
    
    const mailOptions = {
      from: `"pdfbundles Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: 'SMTP Credentials Test Connection',
      text: 'Your SMTP configuration is working perfectly!'
    };
    
    transporter.sendMail(mailOptions, (sendErr, info) => {
      if (sendErr) {
        console.error('Failed to send test email:', sendErr);
        process.exit(1);
      } else {
        console.log('Test email sent successfully! Message ID:', info.messageId);
        process.exit(0);
      }
    });
  }
});
