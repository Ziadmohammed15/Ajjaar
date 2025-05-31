// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2.39.7"

// Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  try {
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    };

    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers });
    }

    // Parse request body
    const { phoneNumber, code } = await req.json();

    // Validate inputs
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return new Response(
        JSON.stringify({ error: 'رقم الهاتف مطلوب' }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!code || typeof code !== 'string') {
      return new Response(
        JSON.stringify({ error: 'رمز التحقق مطلوب' }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Format phone number to E.164 format if needed
    let formattedPhoneNumber = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      formattedPhoneNumber = `+${phoneNumber}`;
    }

    // Check if this is a test phone number
    const testPhoneNumbers = Deno.env.get('TEST_PHONE_NUMBERS') || '967779777358=123456,967774846214=123456';
    const testPhones = testPhoneNumbers.split(',').reduce((acc, pair) => {
      const [phone, testCode] = pair.split('=');
      if (phone && testCode) {
        acc[phone] = testCode;
      }
      return acc;
    }, {} as Record<string, string>);

    // If it's a test phone, check against the test code
    const phoneWithoutPlus = formattedPhoneNumber.replace('+', '');
    if (testPhones[phoneWithoutPlus]) {
      if (code === testPhones[phoneWithoutPlus] || code === '123456') {
        // Get user from auth token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: 'Authorization header is required' }),
            { headers: { ...headers, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        
        if (userError || !user) {
          return new Response(
            JSON.stringify({ error: 'Invalid or expired token' }),
            { headers: { ...headers, 'Content-Type': 'application/json' }, status: 401 }
          );
        }

        // Update user's profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            phone: formattedPhoneNumber,
            phone_verified: true 
          })
          .eq('id', user.id);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: 'Failed to update profile', details: updateError.message }),
            { headers: { ...headers, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'تم التحقق من رقم الهاتف بنجاح'
          }),
          { headers: { ...headers, 'Content-Type': 'application/json' }, status: 200 }
        );
      } else {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'رمز التحقق غير صحيح'
          }),
          { headers: { ...headers, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    // Get user from auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Get the verification code from the database
    const { data: verificationData, error: verificationError } = await supabase
      .from('phone_verification_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('phone', formattedPhoneNumber)
      .eq('verified', false)
      .lt('attempts', 3)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (verificationError || !verificationData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'لم يتم العثور على رمز تحقق صالح أو انتهت صلاحيته'
        }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Increment attempts
    await supabase
      .from('phone_verification_codes')
      .update({ attempts: verificationData.attempts + 1 })
      .eq('id', verificationData.id);

    // Check if code matches
    if (verificationData.code !== code) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'رمز التحقق غير صحيح'
        }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Mark code as verified
    await supabase
      .from('phone_verification_codes')
      .update({ verified: true })
      .eq('id', verificationData.id);

    // Update user's profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        phone: formattedPhoneNumber,
        phone_verified: true 
      })
      .eq('id', user.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update profile', details: updateError.message }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'تم التحقق من رقم الهاتف بنجاح'
      }),
      { headers: { ...headers, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error verifying code:', error);
    
    return new Response(
      JSON.stringify({ error: 'حدث خطأ أثناء التحقق من الرمز', details: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});