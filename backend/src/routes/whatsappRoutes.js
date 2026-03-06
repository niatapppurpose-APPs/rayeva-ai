const express = require('express');
const {
	handleWhatsAppWebhook,
	previewWhatsAppReply,
} = require('../controllers/whatsappController');

const router = express.Router();

router.post('/whatsapp', handleWhatsAppWebhook);
router.post('/api/whatsapp/preview', previewWhatsAppReply);

module.exports = router;
