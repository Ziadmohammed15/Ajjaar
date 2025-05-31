import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { phoneNumber } = await req.json()

    if (!phoneNumber) {
      throw new Error('Phone number is required')
    }

    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // For testing purposes, we'll consider certain numbers as test phones
    const isTestPhone = phoneNumber === '+966500000000' || phoneNumber === '+966500000001'

    // Store the verification code
    const { error: insertError } = await supabaseClient
      .from('phone_verification_codes')
      .insert({
        phone: phoneNumber,
        code: code,
        verified: false,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes expiry
      })

    if (insertError) {
      throw new Error('Failed to store verification code')
    }

    // For test phones, we'll return success without actually sending SMS
    if (isTestPhone) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Verification code sent successfully',
          isTestPhone: true,
          testCode: code // Only sent for test phones
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // TODO: Implement actual SMS sending here
    // For now, we'll simulate success
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verification code sent successfully',
        isTestPhone: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})