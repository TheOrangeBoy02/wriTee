// supabase/functions/send-feedback/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const RESEND_API_URL = 'https://api.resend.com/emails';

interface FeedbackRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    // Initialize Supabase client with user's auth context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { name, email, subject, message }: FeedbackRequest = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, email, subject, message' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate field lengths
    if (name.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Name must be at least 2 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (subject.trim().length < 3 || subject.trim().length > 100) {
      return new Response(
        JSON.stringify({ error: 'Subject must be between 3 and 100 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (message.trim().length < 10 || message.trim().length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Message must be between 10 and 1000 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format (basic validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const feedbackEmail = Deno.env.get('FEEDBACK_EMAIL') || 'Writee@tkanjaye.com';

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare email content
    const timestamp = new Date().toISOString();
    const emailHtml = `
      <h2>New Feedback from WriTee App</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <h3>Message:</h3>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p style="color: #666; font-size: 12px;">
        Sent via WriTee Feedback Form<br>
        User ID: ${user.id}<br>
        Timestamp: ${timestamp}
      </p>
    `;

    const emailText = `
New Feedback from WriTee App

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
Sent via WriTee Feedback Form
User ID: ${user.id}
Timestamp: ${timestamp}
    `;

    console.log(`Sending feedback email from ${email} to ${feedbackEmail}`);

    // Send email via Resend API
    const resendResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'WriTee Feedback <onboarding@resend.dev>', // Update this to your verified domain
        to: [feedbackEmail],
        reply_to: email,
        subject: `WriTee Feedback: ${subject}`,
        html: emailHtml,
        text: emailText,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('Resend API error:', errorText);
      return new Response(
        JSON.stringify({
          error: 'Failed to send feedback email',
          details: errorText
        }),
        {
          status: resendResponse.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await resendResponse.json();
    console.log('Feedback email sent successfully:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Feedback sent successfully',
        emailId: result.id,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
