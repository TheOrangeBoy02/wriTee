// supabase/functions/send-push-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

interface PushMessage {
  to: string; // Expo push token
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
  channelId?: string;
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
    const { userId, title, body, data, sound = 'default', badge } = await req.json();

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get push tokens for user
    const { data: tokens, error: tokensError } = await supabaseClient
      .from('push_tokens')
      .select('push_token, device_type')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (tokensError) {
      console.error('Error fetching push tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No active push tokens found for user' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Build push messages for each device
    const messages: PushMessage[] = tokens.map((token) => ({
      to: token.push_token,
      title,
      body,
      data,
      sound,
      badge,
      channelId: token.device_type === 'android' ? 'default' : undefined,
    }));

    console.log(`Sending ${messages.length} push notifications to user ${userId}`);

    // Send to Expo Push Notification service
    const response = await fetch(EXPO_PUSH_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Expo Push API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to send push notifications', details: errorText }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await response.json();

    // Check for any errors in the response
    const errors = result.data?.filter((item: any) => item.status === 'error');
    if (errors && errors.length > 0) {
      console.error('Push notification errors:', errors);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sentCount: messages.length,
        result: result.data,
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
