import { chat } from '../services/chatService.js';

export const sendMessage = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const messages = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message.trim() },
    ];

    const content = await chat(messages);
    res.json({ content: content.trim() });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get response',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
