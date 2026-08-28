export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { state, treatment } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured on server.' });
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert legal and medical spa compliance officer. Return a JSON array of string requirements for running a medical spa safely and legally based on the user state and treatment.'
                    },
                    {
                        role: 'user',
                        content: `Provide 5 specific compliance and audit readiness requirements for a medical spa performing ${treatment} in the state of ${state}. Return ONLY a valid JSON array of strings.`
                    }
                ],
                temperature: 0.3
            })
        });

        const data = await response.json();
        const aiText = data.choices[0].message.content;
        
        // Clean up formatting blocks if model returns markdown ticks
        const cleanedJSON = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        const requirements = JSON.parse(cleanedJSON);

        return res.status(200).json({ requirements });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to generate AI compliance report.' });
    }
}
