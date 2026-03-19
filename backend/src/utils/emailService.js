const nodemailer = require('nodemailer');

/**
 * Sends a 6-digit verification code to the user's email.
 * @param {string} email User's email address.
 * @param {string} otp The plain-text 6-digit OTP.
 */
const sendOTP = async (email, otp) => {
  console.log(`[EmailService] Attempting to send OTP to: ${email}`);
  
  // 🚀 Development Fallback: Always log OTP to console
  console.log('-----------------------------------------');
  console.log(`🔑 OTP for ${email}: [ ${otp} ]`);
  console.log('-----------------------------------------');

  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.error('[EmailService] ❌ ERROR: GMAIL_USER or GMAIL_PASS is missing in environment variables!');
      console.error('Please add them to your Railway dashboard "Variables" tab.');
      throw new Error('Email configuration is missing');
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, 
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
      family: 4, // Force IPv4 routing on Railway as it struggles with Google's IPv6
      connectionTimeout: 10000, 
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      }
    });

    const mailOptions = {
      from: `"Bizcollab Security" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Security Verification: ${otp}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #030712; font-family: 'Inter', -apple-system, sans-serif;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #030712; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" maxWidth="500px" border="0" cellspacing="0" cellpadding="0" style="background-color: #111827; border-radius: 24px; border: 1px solid rgba(59, 130, 246, 0.2); overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                  
                  <!-- Top Accent Bar -->
                  <tr>
                    <td height="4" style="background: linear-gradient(to right, #2563EB, #3B82F6, #60A5FA);"></td>
                  </tr>

                  <tr>
                    <td style="padding: 64px 40px;">
                      
                      <!-- Secure Access Header -->
                      <div style="text-align: center; margin-bottom: 8px;">
                        <span style="color: #3B82F6; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 3px;">SYSTEM ACCESS</span>
                      </div>

                      <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: 800; text-align: center; letter-spacing: -0.05em; text-transform: uppercase;">Identity Verification</h1>
                      
                      <p style="margin-top: 24px; margin-bottom: 40px; color: #9CA3AF; font-size: 15px; line-height: 1.6; text-align: center; max-width: 400px; margin-left: auto; margin-right: auto;">
                        A login attempt was detected for your account. Please use the following authorization code to confirm your session.
                      </p>

                      <!-- Clean OTP Box (No distractions) -->
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 40px;">
                        <tr>
                          <td align="center" style="background: rgba(59, 130, 246, 0.03); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 16px; padding: 32px;">
                            <span style="font-family: 'Inter', 'Courier New', monospace; font-size: 56px; font-weight: 800; color: #3B82F6; letter-spacing: 14px; margin-left: 14px; display: block;">${otp}</span>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 0; color: #6B7280; font-size: 13px; text-align: center; line-height: 20px;">
                        This code expires in <strong style="color: #F3F4F6;">3 minutes</strong>.
                      </p>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #030712; padding: 24px 40px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="center" style="color: #4B5563; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">
                            © 2026 BIZCOLLAB ERP • SECURE AUTHORIZATION GATEWAY
                          </td>
                        </tr>
                      </table>
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

    const info = await transporter.sendMail(mailOptions);
    console.log('[EmailService] Email sent successfully:', info.messageId);
    console.log('[EmailService] SMTP Response:', info.response);

  } catch (err) {
    console.error('[EmailService] SMTP Dispatch Failed:', err.message);
    
    // 🛡️ EMERGENCY RECOVERY: In production, if SMTP is blocked, we still let the login proceed.
    // The OTP is already securely printed in the logs above. The admin can find it there.
    // This prevents a total system lockout due to email provider issues.
    console.warn('----------------------------------------------------------------------');
    console.warn(`⚠️  RECOVERY MODE ACTIVE: Verification email did not send!`);
    console.warn(`🔗 FIND YOUR OTP IN THE CONSOLE LOG ABOVE: Search for "🔑 OTP for ${email}"`);
    console.warn('----------------------------------------------------------------------');
    
    return; // Return without throwing so the auth flow proceeds to the OTP screen
  }
};

module.exports = { sendOTP };
