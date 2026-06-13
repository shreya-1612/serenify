import nodemailer from 'nodemailer'

const isSmtpConfigured = Boolean(
  process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_USER !== 'placeholder@gmail.com',
)

if (!isSmtpConfigured) {
  console.warn(
    'WARNING: SMTP not configured. Emails will be logged to console only. ' +
      'Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env to enable real emails.',
  )
}

const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER as string,
        pass: process.env.SMTP_PASS as string,
      },
    })
  : null

export const sendMail = async ({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<boolean> => {
  if (!isSmtpConfigured || !transporter) {
    console.log('EMAIL NOT SENT (SMTP not configured)')
    console.log(`  To: ${to}`)
    console.log(`  Subject: ${subject}`)
    return true
  }

  try {
    await transporter.sendMail({
      from: `Serenify <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })
    return true
  } catch (error) {
    console.error('Email sending failed:', error)
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Failed to send email to ${to}`)
    }
    return false
  }
}
