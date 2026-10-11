import crypto from 'crypto';

/**
 * Meta WhatsApp Webhook Handler for Vercel Serverless Functions
 * 
 * Handles:
 * - GET: Webhook verification during Meta setup
 * - POST: Incoming WhatsApp messages and status updates
 */

export default async function handler(req, res) {
  const { method, query, headers } = req;

  // GET: Webhook verification
  if (method === 'GET') {
    return handleVerification(query, res);
  }

  // POST: Webhook events
  if (method === 'POST') {
    return handleWebhookEvent(req, headers, res);
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * Handle GET verification request from Meta
 */
function handleVerification(query, res) {
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!VERIFY_TOKEN) {
    console.error('[Webhook] WHATSAPP_VERIFY_TOKEN not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Check if mode and token match
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Webhook] Verification successful');
    // Return challenge as plain text
    return res.status(200).send(challenge);
  }

  console.warn('[Webhook] Verification failed:', { mode, tokenMatch: token === VERIFY_TOKEN });
  return res.status(403).json({ error: 'Verification failed' });
}

/**
 * Handle POST webhook event
 */
async function handleWebhookEvent(req, headers, res) {
  const signature = headers['x-hub-signature-256'];
  const META_APP_SECRET = process.env.META_APP_SECRET;

  if (!META_APP_SECRET) {
    console.error('[Webhook] META_APP_SECRET not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Get raw body for signature verification
  let rawBody;
  if (typeof req.body === 'string') {
    rawBody = req.body;
  } else if (Buffer.isBuffer(req.body)) {
    rawBody = req.body.toString('utf8');
  } else {
    // Body is already parsed as JSON
    rawBody = JSON.stringify(req.body);
  }

  // Verify signature
  if (!verifySignature(rawBody, signature, META_APP_SECRET)) {
    console.warn('[Webhook] Invalid signature');
    return res.status(403).json({ error: 'Invalid signature' });
  }

  // Parse body if not already parsed
  const body = typeof req.body === 'string' ? JSON.parse(rawBody) : req.body;

  // Log webhook received (without sensitive data)
  console.log('[Webhook] Event received:', {
    object: body.object,
    entryCount: body.entry?.length || 0
  });

  // Acknowledge receipt immediately
  res.status(200).json({ status: 'received' });

  // Process webhook asynchronously (don't block response)
  processWebhookAsync(body).catch(error => {
    console.error('[Webhook] Processing error:', error.message);
  });
}

/**
 * Verify HMAC-SHA256 signature
 */
function verifySignature(payload, signature, secret) {
  if (!signature) {
    return false;
  }

  // Remove 'sha256=' prefix
  const signatureHash = signature.replace('sha256=', '');

  // Calculate expected signature
  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signatureHash, 'hex'),
    Buffer.from(expectedHash, 'hex')
  );
}

/**
 * Process webhook events asynchronously
 */
async function processWebhookAsync(body) {
  try {
    // Check if it's a WhatsApp Business API event
    if (body.object !== 'whatsapp_business_account') {
      console.log('[Webhook] Ignoring non-WhatsApp event:', body.object);
      return;
    }

    // Process each entry
    for (const entry of body.entry || []) {
      // Process changes in this entry
      for (const change of entry.changes || []) {
        if (change.field === 'messages') {
          await handleMessagesChange(change.value);
        }
      }
    }
  } catch (error) {
    console.error('[Webhook] Async processing error:', error);
    throw error;
  }
}

/**
 * Handle messages change event
 */
async function handleMessagesChange(value) {
  // Handle incoming messages
  if (value.messages) {
    for (const message of value.messages) {
      await handleIncomingMessage(message, value.metadata);
    }
  }

  // Handle message status updates (sent, delivered, read, failed)
  if (value.statuses) {
    for (const status of value.statuses) {
      await handleMessageStatus(status, value.metadata);
    }
  }
}

/**
 * Handle incoming message from user
 */
async function handleIncomingMessage(message, metadata) {
  console.log('[Webhook] Incoming message:', {
    from: message.from,
    type: message.type,
    timestamp: message.timestamp,
    phoneNumberId: metadata.phone_number_id
  });

  // Extract message content based on type
  let messageContent = '';
  switch (message.type) {
    case 'text':
      messageContent = message.text?.body || '';
      break;
    case 'image':
      messageContent = `[Image: ${message.image?.id}]`;
      break;
    case 'video':
      messageContent = `[Video: ${message.video?.id}]`;
      break;
    case 'audio':
      messageContent = `[Audio: ${message.audio?.id}]`;
      break;
    case 'document':
      messageContent = `[Document: ${message.document?.filename}]`;
      break;
    case 'location':
      messageContent = `[Location: ${message.location?.latitude}, ${message.location?.longitude}]`;
      break;
    default:
      messageContent = `[${message.type}]`;
  }

  // TODO: Store message in database or process as needed
  // For now, just log it
  console.log('[Webhook] Message content:', messageContent);
}

/**
 * Handle message status update
 */
async function handleMessageStatus(status, metadata) {
  console.log('[Webhook] Status update:', {
    messageId: status.id,
    status: status.status,
    recipient: status.recipient_id,
    timestamp: status.timestamp,
    phoneNumberId: metadata.phone_number_id
  });

  // TODO: Update campaign delivery status in database
  // Status values: sent, delivered, read, failed
  
  // Handle errors
  if (status.errors && status.errors.length > 0) {
    console.error('[Webhook] Message delivery errors:', {
      messageId: status.id,
      errors: status.errors.map(e => ({
        code: e.code,
        title: e.title
      }))
    });
  }
}
