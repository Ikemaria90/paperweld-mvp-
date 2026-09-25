export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { state, treatment } = req.body;

  if (!state || !treatment) {
    return res.status(400).json({ error: 'State and treatment are required.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key is not configured on Vercel.' });
  }

  try {
    const prompt = `You are a strict medical spa regulatory and compliance expert for the United States. 
Generate a JSON object with a key named "requirements" containing an array of 5 specific compliance audit requirements for ${treatment} practices in the state of ${state}.
Each object in the array must have three keys:
1. "item": A short title for the requirement (e.g., "Medical Director Supervision").
2. "description": A clear explanation of what the regulation demands in ${state}.
3. "risk": Exactly one of these three string values: "Critical", "Operational", or "Best Practice".

Return ONLY valid JSON with no markdown formatting, no code blocks, and no extra text. Example format:
{
  "requirements": [
    {
      "item": "Medical Supervision",
      "description": "A licensed physician must oversee treatments.",
      "risk": "Critical"
    }
  ]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API Error Response:', data);
      return res.status(500).json({ error: data.error?.message || 'OpenAI API error.' });
    }

    const content = data.choices[0].message.content.trim();
    // Clean up potential markdown code blocks if the model includes them anyway
    const cleanedContent = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
    const parsedData = JSON.parse(cleanedContent);

    return res.status(200).json(parsedData);
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Failed to generate requirements from AI.' });
  }
}
