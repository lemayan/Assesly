import { Router } from 'express';

const router = Router();

// POST /api/ai/image { prompt: string, size?: '256x256'|'512x512'|'1024x1024' }
router.post('/image', async (req, res) => {
  const { prompt, size } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  const requestedSize = (size as string) || '512x512';
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  try {
    if (!OPENAI_API_KEY) {
      // Graceful fallback: return placeholder image URL when no key is configured
      const url = `https://picsum.photos/seed/${encodeURIComponent(prompt)}/1024/576`;
      return res.json({ placeholder: true, url });
    }

    // Use OpenAI Images API to generate a base64 image
    const resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ prompt, size: requestedSize, response_format: 'b64_json' })
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(502).json({ error: 'Upstream error', detail: text });
    }
    const data = await resp.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return res.status(500).json({ error: 'No image returned' });
    const mime = 'image/png';
    return res.json({ image: `data:${mime};base64,${b64}` });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Failed to generate image' });
  }
});

export default router;
