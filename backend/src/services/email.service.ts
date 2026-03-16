import nodemailer, { Transporter } from 'nodemailer';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { Lead, Car } from '../types';

interface SmtpSecret {
  username: string;
  password: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Cache SMTP credentials
let cachedSmtpSecret: SmtpSecret | null = null;

// Transporter initialized outside handler for reuse
let transporter: Transporter | null = null;

const SMTP_HOST = 'mail.primedealauto.co.za';
const SMTP_PORT = 465;
const RECIPIENT_EMAIL = 'sales@primedealauto.co.za';

async function getSmtpSecret(): Promise<SmtpSecret> {
  if (cachedSmtpSecret) {
    return cachedSmtpSecret;
  }

  const secretArn = process.env.SMTP_SECRET_ARN;
  if (!secretArn) {
    throw new Error('SMTP_SECRET_ARN environment variable is not set');
  }

  try {
    const client = new SecretsManagerClient({});
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretArn })
    );

    if (!response.SecretString) {
      throw new Error('SMTP secret value is empty');
    }

    cachedSmtpSecret = JSON.parse(response.SecretString);
    return cachedSmtpSecret!;
  } catch (error) {
    console.error('Failed to retrieve SMTP credentials:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      secretArn,
    });
    throw new Error('Failed to retrieve SMTP credentials');
  }
}

async function getTransporter(): Promise<Transporter> {
  if (transporter) {
    return transporter;
  }

  const secret = await getSmtpSecret();

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true, // SSL
    auth: {
      user: secret.username,
      pass: secret.password,
    },
  });

  return transporter;
}


/**
 * Generate email subject based on enquiry type and car details
 */
export function generateEmailSubject(
  enquiryType: string,
  subject?: string,
  car?: Pick<Car, 'year' | 'make' | 'model'>
): string {
  if (enquiryType === 'test_drive' && car) {
    return `Test Drive Request: ${car.year} ${car.make} ${car.model}`;
  }

  if (enquiryType === 'car_enquiry' && car) {
    return `New Enquiry: ${car.year} ${car.make} ${car.model}`;
  }

  // General enquiry
  return `New Contact Form Enquiry: ${subject || 'General Enquiry'}`;
}

/**
 * Generate email body with customer and car details
 */
export function generateEmailBody(
  lead: Pick<Lead, 'first_name' | 'last_name' | 'email' | 'phone' | 'enquiry'> & {
    whatsapp_number?: string;
    enquiry_type?: string;
  },
  car?: Pick<Car, 'id' | 'year' | 'make' | 'model' | 'variant' | 'price'>
): string {
  const lines: string[] = [];

  lines.push('New Lead Received');
  lines.push('=================');
  lines.push('');

  // Customer details
  lines.push('Customer Details:');
  lines.push('-----------------');
  if (lead.first_name || lead.last_name) {
    lines.push(`Name: ${lead.first_name || ''} ${lead.last_name || ''}`.trim());
  }
  lines.push(`Email: ${lead.email}`);
  if (lead.phone) {
    lines.push(`Phone: ${lead.phone}`);
  }
  if (lead.whatsapp_number) {
    lines.push(`WhatsApp: ${lead.whatsapp_number}`);
  }
  lines.push('');

  // Enquiry type
  if (lead.enquiry_type) {
    const typeLabels: Record<string, string> = {
      general: 'General Enquiry',
      test_drive: 'Test Drive Request',
      car_enquiry: 'Car Enquiry',
    };
    lines.push(`Enquiry Type: ${typeLabels[lead.enquiry_type] || lead.enquiry_type}`);
    lines.push('');
  }

  // Car details if present
  if (car) {
    lines.push('Car Details:');
    lines.push('------------');
    lines.push(`${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ''}`);
    lines.push(`Price: R${car.price.toLocaleString('en-ZA')}`);
    lines.push(`View: ${process.env.FRONTEND_URL || 'https://primedealauto.co.za'}/cars/${car.id}`);
    lines.push('');
  }

  // Message
  if (lead.enquiry) {
    lines.push('Message:');
    lines.push('--------');
    lines.push(lead.enquiry);
    lines.push('');
  }

  lines.push('---');
  lines.push('This email was sent from the Prime Deal Auto website.');

  return lines.join('\n');
}


/**
 * Generate HTML email body
 */
export function generateEmailHtml(
  lead: Pick<Lead, 'first_name' | 'last_name' | 'email' | 'phone' | 'enquiry'> & {
    whatsapp_number?: string;
    enquiry_type?: string;
  },
  car?: Pick<Car, 'id' | 'year' | 'make' | 'model' | 'variant' | 'price'>
): string {
  const typeLabels: Record<string, string> = {
    general: 'General Enquiry',
    test_drive: 'Test Drive Request',
    car_enquiry: 'Car Enquiry',
  };

  const frontendUrl = process.env.FRONTEND_URL || 'https://primedealauto.co.za';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'DM Sans', Arial, sans-serif; line-height: 1.6; color: #050B20; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #050B20; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #F9FBFC; padding: 20px; border: 1px solid #E1E1E1; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: 600; color: #405FF2; margin-bottom: 8px; }
    .car-card { background: white; border: 1px solid #E1E1E1; border-radius: 8px; padding: 15px; }
    .price { color: #3D923A; font-weight: 700; font-size: 18px; }
    .footer { background: #050B20; color: white; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; }
    a { color: #405FF2; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">New Lead Received</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.8;">${typeLabels[lead.enquiry_type || 'general'] || 'General Enquiry'}</p>
    </div>
    <div class="content">
      <div class="section">
        <div class="section-title">Customer Details</div>
        <p style="margin: 0;">
          ${lead.first_name || lead.last_name ? `<strong>Name:</strong> ${lead.first_name || ''} ${lead.last_name || ''}<br>` : ''}
          <strong>Email:</strong> <a href="mailto:${lead.email}">${lead.email}</a><br>
          ${lead.phone ? `<strong>Phone:</strong> <a href="tel:${lead.phone}">${lead.phone}</a><br>` : ''}
          ${lead.whatsapp_number ? `<strong>WhatsApp:</strong> <a href="https://wa.me/${lead.whatsapp_number.replace(/[^0-9]/g, '')}">${lead.whatsapp_number}</a>` : ''}
        </p>
      </div>
      ${car ? `
      <div class="section">
        <div class="section-title">Car Interested In</div>
        <div class="car-card">
          <strong>${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ''}</strong><br>
          <span class="price">R${car.price.toLocaleString('en-ZA')}</span><br>
          <a href="${frontendUrl}/cars/${car.id}">View Listing →</a>
        </div>
      </div>
      ` : ''}
      ${lead.enquiry ? `
      <div class="section">
        <div class="section-title">Message</div>
        <p style="margin: 0; white-space: pre-wrap;">${lead.enquiry}</p>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      This email was sent from the Prime Deal Auto website.
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send an email via SMTP
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    const transport = await getTransporter();

    await transport.sendMail({
      from: `"Prime Deal Auto" <${RECIPIENT_EMAIL}>`,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    console.log('Email sent successfully:', { to: params.to, subject: params.subject });
    return true;
  } catch (error) {
    console.error('Failed to send email:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      to: params.to,
      subject: params.subject,
    });
    return false;
  }
}

/**
 * Send lead notification email to sales team
 * Returns true if email was sent, false if it failed (does not throw)
 */
export async function sendLeadNotification(
  lead: Lead & { whatsapp_number?: string; enquiry_type?: string; subject?: string },
  car?: Pick<Car, 'id' | 'year' | 'make' | 'model' | 'variant' | 'price'>
): Promise<boolean> {
  const subject = generateEmailSubject(
    lead.enquiry_type || 'general',
    lead.subject,
    car
  );

  const text = generateEmailBody(lead, car);
  const html = generateEmailHtml(lead, car);

  return sendEmail({
    to: RECIPIENT_EMAIL,
    subject,
    text,
    html,
  });
}
