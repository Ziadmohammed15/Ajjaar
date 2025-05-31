// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2.39.7"
import { Twilio } from "npm:twilio@4.23.0"

// Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Twilio API credentials
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') || '';
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
const TWILIO_VERIFY_SERVICE_SID = Deno.env.get('TWILIO_VERIFY_SERVICE_SID') || '';
const TEST_PHONE_NUMBERS = (Deno.env.get('TEST_PHONE_NUMBERS') || '').split(',').reduce((acc, pair) => {
  const [phone, code] = pair.split('=');
  if (phone && code) acc[phone] = code;
  return acc;
}, {} as Record<string, string>);

// Create Twilio client
const twilioClient = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

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

    // Parse request URL to get action
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    // Parse request body
    const body = await req.json();

    // Handle different actions
    if (action === 'send') {
      return await handleSendVerification(body, headers);
    } else if (action === 'verify') {
      return await handleVerifyCode(body, headers);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in Twilio verification service:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Handle sending verification code
async function handleSendVerification(body: any, headers: HeadersInit) {
  const { phoneNumber, userId } = body;

  // Validate phone number
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return new Response(
      JSON.stringify({ error: 'رقم الهاتف مطلوب' }),
      { headers: { ...headers, 'Content-Type': 'application/json' }, status: 400 }
    );
  }

  // Format phone number to E.164 format if needed
  let formattedPhoneNumber = phoneNumber;
  if (!phoneNumber.startsWith('+')) {
    formattedPhoneNumber = `+${phoneNumber}`;
  }

  try {
    // Check if this is a test phone number
    const isTestPhone = formattedPhoneNumber in TEST_PHONE_NUMBERS;
    let verificationStatus = 'pending';

    if (isTestPhone) {
      // For test numbers, don't actually send SMS
      console.log(`Test phone number detected: ${formattedPhoneNumber}`);
      verificationStatus = 'pending';
    } else {
      // Send verification code via Twilio Verify
      try {
        const verification = await twilioClient.verify.v2
          .services(TWILIO_VERIFY_SERVICE_SID)
          .verifications.create({
            to: formattedPhoneNumber,
            channel: 'sms'
          });
        verificationStatus = verification.status;
      } catch (twilioError) {
        console.error('Twilio API Error:', twilioError);
        
        // Check for specific Twilio error codes
        if (twilioError.code === 20003) {
          return new Response(
            JSON.stringify({ 
              error: 'حدث خطأ في خدمة التحقق. يرجى المحاولة مرة أخرى لاحقاً.',
              details: 'Authentication error with verification service'
            }),
            { headers: { ...headers, 'Content-Type': 'application/json' }, status: 503 }
          );
        }
        
        throw twilioError;
      }
    }

    // Log verification in database
    await supabase
      .from('phone_verification_codes')
      .insert({
        user_id: userId,
        phone: formattedPhoneNumber,
        code: isTestPhone ? TEST_PHONE_NUMBERS[formattedPhoneNumber] : 'twilio-verify',
        attempts: 0,
        verified: false,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes expiry
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: verificationStatus,
        isTestPhone,
        message: 'تم إرسال رمز التحقق بنجاح'
      }),
      { headers: { ...headers, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error sending verification code:', error);
    
    // Provide more specific error messages based on the error type
    let errorMessage = 'حدث خطأ أثناء إرسال رمز التحقق';
    let statusCode = 500;
    
    if (error.code === 60200) { // Invalid parameter
      errorMessage = 'رقم الهاتف غير صالح';
      statusCode = 400;
    } else if (error.code === 60203) { // Max send attempts reached
      errorMessage = 'تم تجاوز الحد الأقصى لمحاولات إرسال الرمز. يرجى المحاولة لاحقاً';
      statusCode = 429;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage, 
        details: error.message,
        code: error.code 
      }),
      { headers: { ...headers, 'Content-Type': 'application/json' }, status: statusCode }
    );
  }
}

// Handle verifying code
async function handleVerifyCode(body: any, headers: HeadersInit) {
  const { phoneNumber, code, userId } = body;

  // Validate input
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

  try {
    let isVerified = false;
    
    // Check if this is a test phone number
    if (formattedPhoneNumber in TEST_PHONE_NUMBERS) {
      isVerified = code === TEST_PHONE_NUMBERS[formattedPhoneNumber];
    } else {
      // Verify the code with Twilio
      try {
        const verificationCheck = await twilioClient.verify.v2
          .services(TWILIO_VERIFY_SERVICE_SID)
          .verificationChecks.create({
            to: formattedPhoneNumber,
            code
          });
        
        isVerified = verificationCheck.status === 'approved';
      } catch (twilioError) {
        console.error('Twilio Verification Check Error:', twilioError);
        
        if (twilioError.code === 20003) {
          return new Response(
            JSON.stringify({ 
              error: 'حدث خطأ في خدمة التحقق. يرجى المحاولة مرة أخرى لاحقاً.',
              details: 'Authentication error with verification service'
            }),
            { headers: { ...headers, 'Content-Type': 'application/json' }, status: 503 }
          );
        }
        
        throw twilioError;
      }
    }

    if (isVerified) {
      // Update verification status in database
      await supabase
        .from('phone_verification_codes')
        .update({ 
          verified: true 
        })
        .eq('phone', formattedPhoneNumber)
        .is('verified', false);

      // Find user with this phone number
      let userIdToUpdate = userId;
      
      if (!userIdToUpdate) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', formattedPhoneNumber)
          .single();
          
        if (userError) {
          console.error('Error finding user:', userError);
        } else {
          userIdToUpdate = userData.id;
        }
      }

      // Update user's profile
      if (userIdToUpdate) {
        await supabase
          .from('profiles')
          .update({ 
            phone: formattedPhoneNumber,
            phone_verified: true 
          })
          .eq('id', userIdToUpdate);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          verified: true,
          message: 'تم التحقق من رقم الهاتف بنجاح'
        }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 200 }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false, 
          message: 'رمز التحقق غير صحيح أو منتهي الصلاحية'
        }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying code:', error);
    
    let errorMessage = 'حدث خطأ أثناء التحقق من الرمز';
    let statusCode = 500;
    
    if (error.code === 60200) { // Invalid parameter
      errorMessage = 'رمز التحقق غير صالح';
      statusCode = 400;
    } else if (error.code === 60202) { // Max check attempts reached
      errorMessage = 'تم تجاوز الحد الأقصى لمحاولات التحقق. يرجى طلب رمز جديد';
      statusCode = 429;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage, 
        details: error.message,
        code: error.code 
      }),
      { headers: { ...headers, 'Content-Type': 'application/json' }, status: statusCode }
    );
  }
}