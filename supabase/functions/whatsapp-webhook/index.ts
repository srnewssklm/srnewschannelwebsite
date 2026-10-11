// WhatsApp Webhook Handler Edge Function
// Receives delivery status updates from Meta WhatsApp Cloud API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://srnewschannelwebsite.vercel.app',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-auth, accept',
  'Access-Control-Max-Age': '86400',
}

// Webhook verification token (set this in Supabase secrets)
const VERIFY_TOKEN = Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN') || 'your_verify_token_here'

// Status mapping from WhatsApp to our database
const STATUS_MAPPING: Record<string, string> = {
  'sent': 'sent',
  'delivered': 'delivered',
  'read': 'read',
  'failed': 'failed',
  'deleted': 'failed'
}

serve(async (req) => {
  // Handle CORS preflight - MUST be first
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    const url = new URL(req.url)
    
    // Handle webhook verification (GET request)
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      console.log('Webhook verification request:', { mode, token })

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verified successfully')
        return new Response(challenge, { 
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        })
      } else {
        console.error('Webhook verification failed')
        return new Response('Forbidden', { status: 403 })
      }
    }

    // Handle webhook events (POST request)
    if (req.method === 'POST') {
      const body = await req.json()
      
      console.log('Webhook event received:', JSON.stringify(body, null, 2))

      // Acknowledge receipt immediately
      const responsePromise = new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

      // Process webhook asynchronously (don't block response)
      processWebhook(body).catch(error => {
        console.error('Error processing webhook:', error)
      })

      return responsePromise
    }

    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('Webhook handler error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function processWebhook(body: any) {
  try {
    // Get Supabase credentials
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Extract status updates from webhook payload
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    if (!value) {
      console.log('No value in webhook payload')
      return
    }

    // Process status updates
    const statuses = value.statuses || []
    
    for (const status of statuses) {
      const messageId = status.id
      const statusValue = status.status
      const timestamp = status.timestamp
      
      console.log('Processing status update:', {
        messageId,
        status: statusValue,
        timestamp
      })

      // Map WhatsApp status to our database status
      const dbStatus = STATUS_MAPPING[statusValue] || statusValue

      // Find recipient by WhatsApp message ID
      const { data: recipient, error: findError } = await supabase
        .from('whatsapp_campaign_recipients')
        .select('*')
        .eq('whatsapp_message_id', messageId)
        .single()

      if (findError || !recipient) {
        console.log('Recipient not found for message ID:', messageId)
        continue
      }

      // Prepare update data
      const updateData: any = {
        status: dbStatus,
        updated_at: new Date().toISOString()
      }

      // Set timestamp for status
      if (dbStatus === 'sent') {
        updateData.sent_at = new Date(parseInt(timestamp) * 1000).toISOString()
      } else if (dbStatus === 'delivered') {
        updateData.delivered_at = new Date(parseInt(timestamp) * 1000).toISOString()
      } else if (dbStatus === 'read') {
        updateData.read_at = new Date(parseInt(timestamp) * 1000).toISOString()
      } else if (dbStatus === 'failed') {
        updateData.failed_at = new Date(parseInt(timestamp) * 1000).toISOString()
        
        // Extract error information if present
        if (status.errors && status.errors.length > 0) {
          const error = status.errors[0]
          updateData.error_code = error.code?.toString()
          updateData.error_message = error.title || error.message
        }
      }

      // Update recipient status
      const { error: updateError } = await supabase
        .from('whatsapp_campaign_recipients')
        .update(updateData)
        .eq('id', recipient.id)

      if (updateError) {
        console.error('Error updating recipient status:', updateError)
      } else {
        console.log('Updated recipient status:', {
          recipientId: recipient.id,
          newStatus: dbStatus
        })
      }

      // Note: Campaign counters will be updated automatically by the trigger
    }

  } catch (error) {
    console.error('Error in processWebhook:', error)
    throw error
  }
}
