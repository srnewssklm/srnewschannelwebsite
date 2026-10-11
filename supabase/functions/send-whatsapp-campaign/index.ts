// WhatsApp Campaign Sender Edge Function
// Securely sends bulk WhatsApp messages using Meta WhatsApp Cloud API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers - properly configured for frontend origin
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://srnewschannelwebsite.vercel.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-auth, accept',
  'Access-Control-Max-Age': '86400',
}

// Type definitions
interface Recipient {
  name: string
  phone?: string
  num?: string
}

interface CampaignRequest {
  campaignName: string
  message: string
  recipients: Recipient[]
  mode: 'test' | 'production'
}

interface RecipientResult {
  name: string
  phone: string
  status: 'sent' | 'failed'
  whatsappMessageId?: string
  error?: string
  errorCode?: string
}

// Verify admin privileges
async function verifyAdmin(supabaseClient: any): Promise<{ isAdmin: boolean; userId: string | null; error?: string }> {
  try {
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return { isAdmin: false, userId: null, error: 'Authentication required' }
    }

    // Check if user has admin role in JWT metadata
    const role = user.user_metadata?.role || user.app_metadata?.role
    
    // Also check against whitelist of admin emails
    const adminEmails = [
      'sailendrakondapalli@gmail.com',
      'adduriaswani@gmail.com',
      'susmithajewlaries@gmail.com',
      'nashejewels@gmail.com'
    ]
    
    const isAdmin = role === 'admin' || adminEmails.includes(user.email || '')
    
    if (!isAdmin) {
      return { isAdmin: false, userId: user.id, error: 'Admin privileges required' }
    }

    return { isAdmin: true, userId: user.id }
  } catch (error) {
    console.error('Admin verification error:', error)
    return { isAdmin: false, userId: null, error: 'Verification failed' }
  }
}

// Normalize phone number to international format
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Already in international format (starts with country code)
  if (cleaned.length >= 10 && cleaned.length <= 15) {
    return cleaned
  }
  
  throw new Error('Invalid phone number format')
}

// Validate recipient data
function validateRecipient(recipient: Recipient): { isValid: boolean; phone?: string; error?: string } {
  // Support both 'phone' and 'num' field names
  const phoneValue = recipient.phone || recipient.num
  
  if (!recipient.name || !recipient.name.trim()) {
    return { isValid: false, error: 'Missing recipient name' }
  }
  
  if (!phoneValue) {
    return { isValid: false, error: 'Missing phone number' }
  }
  
  try {
    const normalized = normalizePhoneNumber(phoneValue)
    
    // Validate length (international format: 10-15 digits)
    if (normalized.length < 10 || normalized.length > 15) {
      return { isValid: false, error: 'Invalid phone number length' }
    }
    
    return { isValid: true, phone: normalized }
  } catch (error) {
    return { isValid: false, error: 'Invalid phone number format' }
  }
}

// Replace placeholders in message
function personalizeMessage(template: string, recipient: Recipient): string {
  let message = template
  
  // Replace {{name}} with actual name
  message = message.replace(/\{\{name\}\}/gi, recipient.name)
  
  // Check for unresolved placeholders
  const unresolvedPlaceholders = message.match(/\{\{[^}]+\}\}/g)
  if (unresolvedPlaceholders) {
    console.warn('Unresolved placeholders detected:', unresolvedPlaceholders)
  }
  
  return message
}

// Send WhatsApp message via Meta Cloud API
async function sendWhatsAppMessage(
  phone: string,
  message: string,
  accessToken: string,
  phoneNumberId: string
): Promise<{ success: boolean; messageId?: string; error?: string; errorCode?: string }> {
  const apiUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'text',
        text: {
          preview_url: false,
          body: message
        }
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('WhatsApp API error:', data)
      return {
        success: false,
        error: data.error?.message || 'Failed to send message',
        errorCode: data.error?.code?.toString() || 'UNKNOWN_ERROR'
      }
    }

    // Extract message ID from response
    const messageId = data.messages?.[0]?.id
    
    if (!messageId) {
      return {
        success: false,
        error: 'No message ID received from WhatsApp API'
      }
    }

    return {
      success: true,
      messageId: messageId
    }
  } catch (error) {
    console.error('Network error sending WhatsApp message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      errorCode: 'NETWORK_ERROR'
    }
  }
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight - MUST be first, before any other logic
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create Supabase client with user's auth token
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    // Verify admin privileges
    const { isAdmin, userId, error: adminError } = await verifyAdmin(supabaseClient)
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: adminError || 'Unauthorized' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get WhatsApp credentials from secrets
    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
    
    if (!accessToken || !phoneNumberId) {
      return new Response(
        JSON.stringify({ 
          error: 'WhatsApp API configuration missing',
          details: 'Required secrets: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const body: CampaignRequest = await req.json()
    const { campaignName, message, recipients, mode = 'test' } = body

    // Validate request
    if (!campaignName || !campaignName.trim()) {
      return new Response(
        JSON.stringify({ error: 'Campaign name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!message || !message.trim()) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one recipient is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Limit batch size to prevent timeout
    if (recipients.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Maximum 100 recipients per batch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('whatsapp_campaigns')
      .insert({
        name: campaignName,
        message: message,
        created_by: userId,
        status: 'processing',
        total_recipients: recipients.length,
        mode: mode,
        metadata: {
          startedAt: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (campaignError) {
      console.error('Campaign creation error:', campaignError)
      return new Response(
        JSON.stringify({ error: 'Failed to create campaign', details: campaignError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const campaignId = campaign.id

    // Process recipients
    const results: RecipientResult[] = []
    const recipientRecords = []

    for (const recipient of recipients) {
      // Validate recipient
      const validation = validateRecipient(recipient)
      
      if (!validation.isValid) {
        results.push({
          name: recipient.name || 'Unknown',
          phone: recipient.phone || recipient.num || '',
          status: 'failed',
          error: validation.error
        })
        
        recipientRecords.push({
          campaign_id: campaignId,
          name: recipient.name || 'Unknown',
          phone: recipient.phone || recipient.num || '',
          status: 'failed',
          error_message: validation.error,
          failed_at: new Date().toISOString()
        })
        continue
      }

      const phone = validation.phone!
      
      // Personalize message
      const personalizedMessage = personalizeMessage(message, recipient)

      // Send message
      const sendResult = await sendWhatsAppMessage(
        phone,
        personalizedMessage,
        accessToken,
        phoneNumberId
      )

      if (sendResult.success) {
        results.push({
          name: recipient.name,
          phone: phone,
          status: 'sent',
          whatsappMessageId: sendResult.messageId
        })
        
        recipientRecords.push({
          campaign_id: campaignId,
          name: recipient.name,
          phone: phone,
          status: 'sent',
          whatsapp_message_id: sendResult.messageId,
          personalized_message: personalizedMessage,
          sent_at: new Date().toISOString()
        })
      } else {
        results.push({
          name: recipient.name,
          phone: phone,
          status: 'failed',
          error: sendResult.error,
          errorCode: sendResult.errorCode
        })
        
        recipientRecords.push({
          campaign_id: campaignId,
          name: recipient.name,
          phone: phone,
          status: 'failed',
          personalized_message: personalizedMessage,
          error_code: sendResult.errorCode,
          error_message: sendResult.error,
          failed_at: new Date().toISOString()
        })
      }

      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Save all recipient records
    const { error: recipientsError } = await supabaseClient
      .from('whatsapp_campaign_recipients')
      .insert(recipientRecords)

    if (recipientsError) {
      console.error('Error saving recipients:', recipientsError)
    }

    // Calculate final counts
    const sentCount = results.filter(r => r.status === 'sent').length
    const failedCount = results.filter(r => r.status === 'failed').length

    // Update campaign status
    await supabaseClient
      .from('whatsapp_campaigns')
      .update({
        status: 'completed',
        sent_count: sentCount,
        failed_count: failedCount,
        pending_count: 0,
        completed_at: new Date().toISOString(),
        metadata: {
          startedAt: campaign.metadata.startedAt,
          completedAt: new Date().toISOString()
        }
      })
      .eq('id', campaignId)

    // Return results
    return new Response(
      JSON.stringify({
        success: true,
        campaignId: campaignId,
        results: results,
        summary: {
          total: recipients.length,
          sent: sentCount,
          failed: failedCount
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
