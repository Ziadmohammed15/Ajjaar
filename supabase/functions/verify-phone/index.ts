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
    const { phoneNumber, code } = await req.json()

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

    // If it's a test phone or the code is 123456, bypass verification
    const phoneWithoutPlus = phoneNumber.replace('+', '')
    if ((testPhones[phoneWithoutPlus] && code === testPhones[phoneWithoutPlus]) || code === '123456') {
      console.log(`Test verification for ${phoneNumber}`)
      
      // Check if user exists with this phone number
      const { data: existingUser } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('phone', phoneNumber)
        .single()
      
      if (existingUser) {
        // Update existing user
        await supabaseClient
          .from('profiles')
          .update({ phone_verified: true })
          .eq('id', existingUser.id)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'تم التحقق من رقم الهاتف بنجاح'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Try Twilio Verify API first
    try {
      const verificationCheck = await twilioClient.verify.v2
        .services(Deno.env.get('TWILIO_VERIFY_SERVICE_SID') || 'VAc55f994b18f0b1588d462702dceedb84')
        .verificationChecks
        .create({ to: phoneNumber, code })

      if (verificationCheck.status === 'approved') {
        // Check if user exists with this phone number
        const { data: existingUser } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('phone', phoneNumber)
          .single()
        
        if (existingUser) {
          // Update existing user
          await supabaseClient
            .from('profiles')
            .update({ phone_verified: true })
            .eq('id', existingUser.id)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'تم التحقق من رقم الهاتف بنجاح'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      } else {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'رمز التحقق غير صحيح أو منتهي الصلاحية'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
    } catch (verifyError) {
      console.error('Error using Verify API:', verifyError)
      
      // Fallback to checking against stored code
      const { data: storedCode, error: codeError } = await supabaseClient
        .from('phone_verification_codes')
        .select('*')
        .eq('phone', phoneNumber)
        .eq('verified', false)
        .lt('attempts', 3)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (codeError || !storedCode) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'لم يتم العثور على رمز تحقق صالح أو انتهت صلاحيته'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      
      // Increment attempts
      await supabaseClient
        .from('phone_verification_codes')
        .update({ attempts: storedCode.attempts + 1 })
        .eq('id', storedCode.id)
      
      // Check if code matches
      if (storedCode.code !== code) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'رمز التحقق غير صحيح'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      
      // Mark code as verified
      await supabaseClient
        .from('phone_verification_codes')
        .update({ verified: true })
        .eq('id', storedCode.id)
      
      // Check if user exists with this phone number
      const { data: existingUser } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('phone', phoneNumber)
        .single()
      
      if (existingUser) {
        // Update existing user
        await supabaseClient
          .from('profiles')
          .update({ phone_verified: true })
          .eq('id', existingUser.id)
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'تم التحقق من رقم الهاتف بنجاح'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})