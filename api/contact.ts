import type {
  VercelRequest,
  VercelResponse,
} from '@vercel/node';

import { Resend } from 'resend';

interface ContactRequest {
  name?: string;
  email?: string;
  message?: string;
  website?: string;
}

const resend = new Resend(
  process.env['RESEND_API_KEY']
);

/**
 * Vercel Serverless Function
 *
 * Endpoint:
 * POST /api/contact
 */
export default async function handler(
  request: VercelRequest,
  response: VercelResponse
): Promise<void> {
  // --------------------------------------------------
  // Method check
  // --------------------------------------------------

  if (request.method !== 'POST') {
    response.status(405).json({
      message: 'Method not allowed.',
    });

    return;
  }

  // --------------------------------------------------
  // Parse request body
  // --------------------------------------------------

  try {
    const body =
      request.body as ContactRequest;

    // ------------------------------------------------
    // Honeypot spam protection
    // ------------------------------------------------

    // This field should be invisible to normal users.
    // Bots that automatically fill every field will
    // often populate it.
    if (body.website?.trim()) {
      response.status(200).json({
        message: 'Message sent successfully.',
      });

      return;
    }

    // ------------------------------------------------
    // Normalize values
    // ------------------------------------------------

    const name = body.name?.trim() ?? '';
    const email = body.email?.trim() ?? '';
    const message = body.message?.trim() ?? '';

    // ------------------------------------------------
    // Required fields
    // ------------------------------------------------

    if (!name || !email || !message) {
      response.status(400).json({
        message:
          'Please complete all required fields.',
      });

      return;
    }

    // ------------------------------------------------
    // Length validation
    // ------------------------------------------------

    if (name.length > 100) {
      response.status(400).json({
        message:
          'Name must be 100 characters or less.',
      });

      return;
    }

    if (email.length > 254) {
      response.status(400).json({
        message:
          'Email address is too long.',
      });

      return;
    }

    if (message.length > 5000) {
      response.status(400).json({
        message:
          'Message must be 5000 characters or less.',
      });

      return;
    }

    // ------------------------------------------------
    // Email validation
    // ------------------------------------------------

    if (!isValidEmail(email)) {
      response.status(400).json({
        message:
          'Please provide a valid email address.',
      });

      return;
    }

    // ------------------------------------------------
    // Environment variable check
    // ------------------------------------------------

    const apiKey =
      process.env['RESEND_API_KEY'];

    if (!apiKey) {
      console.error(
        'RESEND_API_KEY is not configured.'
      );

      response.status(500).json({
        message:
          'Email service is not configured.',
      });

      return;
    }

    // ------------------------------------------------
    // Create Resend client
    // ------------------------------------------------

    const resendClient =
      new Resend(apiKey);

    // ------------------------------------------------
    // Send email
    // ------------------------------------------------

    const { data, error } =
      await resendClient.emails.send({
        from:
          'Portfolio <onboarding@resend.dev>',

        to: [
          'jhaime.jose.cando@gmail.com',
        ],

        // Allows you to reply directly to the
        // person who submitted the contact form.
        replyTo: email,

        subject:
          `Portfolio Contact — ${name}`,

        html: `
          <!DOCTYPE html>

          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
              />
              <title>Portfolio Contact</title>
            </head>

            <body
              style="
                margin: 0;
                padding: 32px 16px;
                background-color: #120c0e;
                color: #f4ece9;
                font-family:
                  Arial,
                  Helvetica,
                  sans-serif;
              "
            >
              <div
                style="
                  width: 100%;
                  max-width: 640px;
                  margin: 0 auto;
                "
              >
                <div
                  style="
                    padding: 32px;
                    border: 1px solid #2e1f23;
                    border-radius: 20px;
                    background-color: #1d1417;
                  "
                >
                  <h1
                    style="
                      margin: 0 0 24px;
                      font-size: 24px;
                      line-height: 1.3;
                      color: #f4ece9;
                    "
                  >
                    New Portfolio Message
                  </h1>

                  <div
                    style="
                      margin-bottom: 24px;
                    "
                  >
                    <p
                      style="
                        margin: 0 0 8px;
                        color: #a68d92;
                        font-size: 13px;
                      "
                    >
                      Name
                    </p>

                    <p
                      style="
                        margin: 0;
                        font-size: 16px;
                        color: #f4ece9;
                      "
                    >
                      ${escapeHtml(name)}
                    </p>
                  </div>

                  <div
                    style="
                      margin-bottom: 24px;
                    "
                  >
                    <p
                      style="
                        margin: 0 0 8px;
                        color: #a68d92;
                        font-size: 13px;
                      "
                    >
                      Email
                    </p>

                    <p
                      style="
                        margin: 0;
                        font-size: 16px;
                        color: #f4ece9;
                      "
                    >
                      ${escapeHtml(email)}
                    </p>
                  </div>

                  <div
                    style="
                      padding-top: 20px;
                      border-top:
                        1px solid #2e1f23;
                    "
                  >
                    <p
                      style="
                        margin: 0 0 12px;
                        color: #a68d92;
                        font-size: 13px;
                      "
                    >
                      Message
                    </p>

                    <p
                      style="
                        margin: 0;
                        color: #f4ece9;
                        font-size: 15px;
                        line-height: 1.7;
                      "
                    >
                      ${escapeHtml(message).replace(
                        /\n/g,
                        '<br />'
                      )}
                    </p>
                  </div>
                </div>

                <p
                  style="
                    margin: 16px 0 0;
                    text-align: center;
                    color: #a68d92;
                    font-size: 11px;
                  "
                >
                  Sent from your portfolio contact form.
                </p>
              </div>
            </body>
          </html>
        `,
      });

    // ------------------------------------------------
    // Resend error
    // ------------------------------------------------

    if (error) {
      console.error(
        'Resend error:',
        error
      );

      response.status(500).json({
        message:
          'Failed to send your message.',
      });

      return;
    }

    // ------------------------------------------------
    // Success
    // ------------------------------------------------

    response.status(200).json({
      message:
        'Your message has been sent successfully.',
      id: data?.id,
    });
  } catch (error) {
    // ------------------------------------------------
    // Unexpected error
    // ------------------------------------------------

    console.error(
      'Contact endpoint error:',
      error
    );

    response.status(500).json({
      message:
        'Something went wrong while processing your message.',
    });
  }
}

/**
 * Basic email validation.
 */
function isValidEmail(
  email: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

/**
 * Escape user-controlled content before putting it
 * into the HTML email.
 */
function escapeHtml(
  value: string
): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(
      /'/g,
      '&#039;'
    );
}
