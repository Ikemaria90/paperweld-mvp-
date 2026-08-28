export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { state, treatment } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key is missing' });
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert regulatory compliance assistant for medical spas. Return a strict JSON array containing 5 compliance requirements for the given state and treatment. Each item must have "item", "description", and "status" fields.'
                    },
                    {
                        role: 'user',
                        content: `Provide compliance requirements for ${treatment} in ${state}.`
                    }
                ],
                temperature: 0.3
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'OpenAI API error');
        }

        const aiText = data.choices[0].message.content;
        const cleanedJSON = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        const requirements = JSON.parse(cleanedJSON);

        return res.status(200).json({ requirements });
    } catch (error) {
        console.error("DETAILED ERROR:", error);
        return res.status(500).json({ error: error.message });
    }
}
