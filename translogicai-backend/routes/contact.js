const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');

// POST /api/contact — Save a contact message (from customer or driver)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message, senderType, senderId } = req.body;
    if (!name || !subject || !message) {
      return res.status(400).json({ error: 'Name, subject, and message are required' });
    }
    const msg = new ContactMessage({
      name: name.trim(),
      email: (email || '').trim(),
      phone: (phone || '').trim(),
      subject: subject.trim(),
      message: message.trim(),
      senderType: senderType || 'customer',
      senderId: senderId || null,
    });
    await msg.save();
    console.log(`📬 New contact message from ${senderType || 'customer'}: "${subject}" by ${name}`);
    res.status(201).json({ success: true, message: 'Message sent successfully', id: msg._id });
  } catch (err) {
    console.error('Contact message error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/contact — List all messages (for admin dashboard)
router.get('/', async (req, res) => {
  try {
    const messages = await ContactMessage.find({}).sort({ createdAt: -1 }).limit(100);
    const unreadCount = await ContactMessage.countDocuments({ read: false });
    res.json({ messages, unreadCount });
  } catch (err) {
    console.error('Fetch messages error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/contact/:id/read — Mark a message as read
router.put('/:id/read', async (req, res) => {
  try {
    const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
