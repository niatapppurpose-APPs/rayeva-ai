const twilio = require('twilio');
const { get, run } = require('../../database');
const { generateTextResponse } = require('../../services/aiService');

const HIGH_PRIORITY_KEYWORDS = ['refund', 'urgent', 'angry', 'complaint', 'cancel order'];

function hasAnyKeyword(message, keywords) {
  return keywords.some((keyword) => message.includes(keyword));
}

async function buildSupportReply({ from, incomingMessage, normalizedMessage }) {
  let escalated = 0;
  let reply = 'Thanks for your message. Our team will get back to you shortly.';

  if (normalizedMessage.includes('order status')) {
    const order = await get(
      `SELECT id, status, createdAt FROM Orders WHERE userPhone = ? ORDER BY id DESC LIMIT 1`,
      [from]
    );

    if (!order) {
      reply = 'No order found for this number yet. Please share your order ID.';
    } else {
      reply = `Your latest order (#${order.id}) is currently: ${order.status}.`;
    }

    return { reply, escalated };
  }

  if (normalizedMessage.includes('return policy') || normalizedMessage.includes('return')) {
    reply =
      'Return policy: You can request a return within 7 days of delivery for unused items in original condition. Refunds are processed after quality check in 3-5 business days.';

    return { reply, escalated };
  }

  if (hasAnyKeyword(normalizedMessage, HIGH_PRIORITY_KEYWORDS)) {
    escalated = 1;
    reply =
      'Your request is marked high priority and has been escalated to a human agent. We will contact you shortly.';

    return { reply, escalated };
  }

  try {
    reply = await generateTextResponse({
      moduleName: 'Module-4 WhatsApp Support',
      systemPrompt:
        'You are a concise WhatsApp support assistant for a sustainable commerce company. Keep answers under 40 words. If user asks account-specific info, ask for order ID politely.',
      userPrompt: `Phone: ${from}\nMessage: ${incomingMessage}`,
    });
  } catch (_error) {
    reply =
      'Thanks for reaching out. Please share your order ID or ask about order status, returns, or refunds, and our team will assist you.';
  }

  return { reply, escalated };
}

async function handleWhatsAppWebhook(req, res) {
  const incomingMessage = (req.body.Body || '').trim();
  const from = req.body.From || req.body.WaId || 'unknown';
  const normalizedMessage = incomingMessage.toLowerCase();

  try {
    const { reply, escalated } = await buildSupportReply({
      from,
      incomingMessage,
      normalizedMessage,
    });

    await run(
      `INSERT INTO Conversations (userPhone, message, aiResponse, escalated, createdAt)
       VALUES (?, ?, ?, ?, ?)`,
      [from, incomingMessage, reply, escalated, new Date().toISOString()]
    );

    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(reply);

    res.type('text/xml');
    return res.status(200).send(twiml.toString());
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process WhatsApp webhook',
      details: error.message,
    });
  }
}

async function previewWhatsAppReply(req, res) {
  const incomingMessage = (req.body.message || '').trim();
  const from = req.body.from || 'preview-user';
  const normalizedMessage = incomingMessage.toLowerCase();

  if (!incomingMessage) {
    return res.status(400).json({
      success: false,
      error: 'message is required',
    });
  }

  try {
    const result = await buildSupportReply({ from, incomingMessage, normalizedMessage });

    return res.status(200).json({
      success: true,
      data: {
        userPhone: from,
        message: incomingMessage,
        reply: result.reply,
        escalated: Boolean(result.escalated),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to generate preview reply',
      details: error.message,
    });
  }
}

module.exports = {
  handleWhatsAppWebhook,
  previewWhatsAppReply,
};
