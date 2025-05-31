import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import { Twilio } from 'npm:twilio@4.23.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phoneNumber } = await req.json()

    // Initialize Twilio client
    const twilioClient = new Twilio(
      Deno.env.get('TWILIO_ACCOUNT_SID') || 'ACb99e889eaed7a632d5e0bad304d4a5df',
      Deno.env.get('TWILIO_AUTH_TOKEN') || '7d142386bae65d8e1679ca863f81cacf'
    )

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Check if this is a test phone number
    const testPhoneNumbers = Deno.env.get('TEST_PHONE_NUMBERS') || '967779777358=123456,967774846214=123456'
    const testPhones = testPhoneNumbers.split(',').reduce((acc, pair) => {
      const [phone, testCode] = pair.split('=')
      if (phone && testCode) {
        acc[phone] = testCode
      }
      return acc
    }, {} as Record<string, string>)

    // If it's a test phone, return success without sending actual SMS
    const phoneWithoutPlus = phoneNumber.replace('+', '')
    if (testPhones[phoneWithoutPlus]) {
      console.log(`Test phone number detected: ${phoneNumber}. Code: ${testPhones[phoneWithoutPlus]}`)
      
      // Store the verification code in the database
      const { error: codeError } = await supabaseClient
        .from('phone_verification_codes')
        .insert({
          phone: phoneNumber,
          code: testPhones[phoneWithoutPlus],
          attempts: 0,
          verified: false,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes expiry
        })

      if (codeError) {
        console.error('Error storing verification code:', codeError)
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Test verification code sent successfully',
          isTestPhone: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Try to use Twilio Verify API first
    try {
      const verification = await twilioClient.verify.v2
        .services(Deno.env.get('TWILIO_VERIFY_SERVICE_SID') || 'VAc55f994b18f0b1588d462702dceedb84')
        .verifications
        .create({
          to: phoneNumber,
          channel: 'sms'
        })
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: verification.status,
          message: 'Verification code sent successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } catch (verifyError) {
      console.error('Error using Verify API:', verifyError)
      
      // Fallback to regular SMS if Verify API fails
      try {
        // Generate a random 6-digit code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

        // Send SMS via Twilio
        const message = await twilioClient.messages.create({
          body: `رمز التحقق الخاص بك في أجار هو: ${verificationCode}`,
          to: phoneNumber,
          messagingServiceSid: Deno.env.get('TWILIO_MESSAGING_SERVICE_SID') || 'MG24d7598330a7a268857454e0b59462d9'
        })

        // Store verification code in database
        const { error: codeError } = await supabaseClient
          .from('phone_verification_codes')
          .insert({
            phone: phoneNumber,
            code: verificationCode,
            attempts: 0,
            verified: false,
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes expiry
          })

        if (codeError) {
          console.error('Error storing verification code:', codeError)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            messageId: message.sid,
            message: 'Verification code sent successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      } catch (smsError) {
        console.error('Error sending SMS:', smsError)
        throw smsError
      }
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})