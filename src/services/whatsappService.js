// WhatsApp Campaign Service
// Handles communication with the WhatsApp Edge Function

import { supabase } from '../lib/supabase'

/**
 * Send a WhatsApp campaign via Edge Function
 * @param {Object} campaignData - Campaign details
 * @param {string} campaignData.campaignName - Name of the campaign
 * @param {string} campaignData.message - Message template with placeholders
 * @param {Array} campaignData.recipients - Array of {name, phone} or {name, num}
 * @param {string} campaignData.mode - 'test' or 'production'
 * @returns {Promise<Object>} Campaign results
 */
export async function sendWhatsAppCampaign(campaignData) {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      throw new Error('Authentication required')
    }

    // Call Edge Function
    const { data, error } = await supabase.functions.invoke('send-whatsapp-campaign', {
      body: campaignData
    })

    if (error) {
      console.error('Edge Function error:', error)
      throw new Error(error.message || 'Failed to send campaign')
    }

    return data
  } catch (error) {
    console.error('sendWhatsAppCampaign error:', error)
    throw error
  }
}

/**
 * Load campaign history from database
 * @returns {Promise<Array>} Array of campaigns
 */
export async function loadCampaignHistory() {
  try {
    const { data, error } = await supabase
      .from('whatsapp_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error loading campaigns:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('loadCampaignHistory error:', error)
    return []
  }
}

/**
 * Load recipients for a specific campaign
 * @param {string} campaignId - Campaign UUID
 * @returns {Promise<Array>} Array of recipients with their status
 */
export async function loadCampaignRecipients(campaignId) {
  try {
    const { data, error } = await supabase
      .from('whatsapp_campaign_recipients')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading recipients:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('loadCampaignRecipients error:', error)
    return []
  }
}

/**
 * Subscribe to real-time campaign updates
 * @param {string} campaignId - Campaign UUID
 * @param {Function} callback - Callback function to handle updates
 * @returns {Object} Subscription object
 */
export function subscribeToCampaignUpdates(campaignId, callback) {
  const channel = supabase
    .channel(`campaign-${campaignId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'whatsapp_campaigns',
        filter: `id=eq.${campaignId}`
      },
      (payload) => {
        callback(payload.new)
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to real-time recipient status updates
 * @param {string} campaignId - Campaign UUID
 * @param {Function} callback - Callback function to handle updates
 * @returns {Object} Subscription object
 */
export function subscribeToRecipientUpdates(campaignId, callback) {
  const channel = supabase
    .channel(`recipients-${campaignId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'whatsapp_campaign_recipients',
        filter: `campaign_id=eq.${campaignId}`
      },
      (payload) => {
        callback(payload.new)
      }
    )
    .subscribe()

  return channel
}

/**
 * Check if WhatsApp integration is configured
 * @returns {Promise<Object>} Configuration status
 */
export async function checkWhatsAppConfiguration() {
  try {
    // Try to call the Edge Function with minimal data to check if it's configured
    const { data, error } = await supabase.functions.invoke('send-whatsapp-campaign', {
      body: { campaignName: '_config_check', message: '', recipients: [] }
    })

    if (error) {
      // Check if error is about missing configuration
      if (error.message && error.message.includes('configuration missing')) {
        return {
          configured: false,
          error: 'WhatsApp API credentials not configured'
        }
      }
      
      // Other errors might mean it's configured but validation failed (expected)
      return {
        configured: true,
        testMode: true
      }
    }

    return {
      configured: true,
      testMode: false
    }
  } catch (error) {
    return {
      configured: false,
      error: error.message
    }
  }
}
