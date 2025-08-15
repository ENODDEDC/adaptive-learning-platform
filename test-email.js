// Test email configuration
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testEmail() {
  try {
    console.log('Testing email configuration...');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('FROM_EMAIL:', process.env.FROM_EMAIL);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');

    // Send test email
    const testOtp = '123456';
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: process.env.SMTP_USER, // Send to yourself for testing
      subject: 'Test OTP Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Test OTP</h1>
          <p>Your test OTP is: <strong>${testOtp}</strong></p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('Full error:', error);
  }
}

testEmail();