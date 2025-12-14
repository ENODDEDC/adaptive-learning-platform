import { NextResponse } from 'next/server';
import connectMongoDB from '@/config/mongoConfig';
import User from '@/models/User';
import nodemailer from 'nodemailer';
import { checkRateLimit, rateLimitResponse } from '@/utils/rateLimiter';
import { validateEmail, getClientIP } from '@/utils/inputValidator';
import { generateResetToken, hashToken } from '@/utils/secureOTP';

export async function POST(req) {
  try {
    await connectMongoDB();

    const body = await req.json();
    const email = body.email?.toLowerCase().trim();

    // Input validation
    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    }

    // Get client IP for rate limiting
    const clientIP = getClientIP(req);

    // Check rate limiting
    const rateLimit = checkRateLimit(clientIP, 'forgotPassword');
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter);
    }

    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      return NextResponse.json({ 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      }, { status: 200 });
    }

    // Generate secure reset token (32 bytes = 64 hex characters)
    const resetToken = generateResetToken(32);
    const passwordResetToken = hashToken(resetToken);
    const passwordResetExpires = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = passwordResetToken;
    user.resetPasswordExpires = passwordResetExpires;

    await user.save();

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    // Skip email sending if SMTP is not configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: email,
        subject: 'Password Reset Request - Intelevo',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
          </head>
          <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
              <tr>
                <td style="padding: 40px 20px;">
                  <table role="presentation" style="max-width: 600px; margin: 0 auto; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); overflow: hidden;">
                    
                    <!-- Header with gradient -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 40px 30px; text-align: center;">
                        <div style="width: 80px; height: 80px; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; border: 2px solid rgba(255, 255, 255, 0.3);">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zm3 8H9V7c0-1.654 1.346-3 3-3s3 1.346 3 3v3z" fill="white"/>
                          </svg>
                        </div>
                        <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Password Reset Request</h1>
                        <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Secure your account with Intelevo</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px; color: rgba(255, 255, 255, 0.9);">
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">Hello,</p>
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">We received a request to reset the password for your Intelevo account. If you made this request, click the button below to reset your password:</p>
                        
                        <!-- Reset Button -->
                        <table role="presentation" style="margin: 30px 0;">
                          <tr>
                            <td style="text-align: center;">
                              <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3); transition: all 0.3s ease;">
                                Reset Password
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: rgba(255, 255, 255, 0.7);">Or copy and paste this link into your browser:</p>
                        <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 12px; word-break: break-all; font-size: 13px; color: #60a5fa;">
                          ${resetUrl}
                        </div>
                        
                        <!-- Security Notice -->
                        <div style="margin-top: 30px; padding: 16px; background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; border-radius: 8px;">
                          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: rgba(255, 255, 255, 0.9);">
                            <strong>⚠️ Security Notice:</strong><br>
                            This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background: rgba(0, 0, 0, 0.2); border-top: 1px solid rgba(255, 255, 255, 0.1);">
                        <p style="margin: 0 0 10px; font-size: 14px; color: rgba(255, 255, 255, 0.7); text-align: center;">
                          This email was sent by <strong style="color: white;">Intelevo</strong>
                        </p>
                        <p style="margin: 0; font-size: 12px; color: rgba(255, 255, 255, 0.5); text-align: center;">
                          © ${new Date().getFullYear()} Intelevo. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Bottom spacing -->
                  <table role="presentation" style="max-width: 600px; margin: 20px auto 0;">
                    <tr>
                      <td style="text-align: center; padding: 0 20px;">
                        <p style="margin: 0; font-size: 12px; color: rgba(255, 255, 255, 0.4); line-height: 1.6;">
                          If you're having trouble clicking the button, copy and paste the URL above into your web browser.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent to:', email);
    } else {
      console.log('SMTP not configured, skipping email. Reset URL:', resetUrl);
    }

    // Always return success message (prevent email enumeration)
    return NextResponse.json({ 
      message: 'If an account exists with this email, a password reset link has been sent.' 
    }, { status: 200 });
  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    return NextResponse.json({ message: 'An error occurred. Please try again later.' }, { status: 500 });
  }
}