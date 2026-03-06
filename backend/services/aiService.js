const OpenAI = require('openai');
const { run } = require('../database');

async function logAiCall(moduleName, prompt, response) {
  try {
    await run(
      `INSERT INTO AILogs (module, prompt, response, createdAt) VALUES (?, ?, ?, ?)`,
      [moduleName, prompt, response, new Date().toISOString()]
    );
  } catch (error) {
    console.error('Failed to log AI call:', error);
  }
}

function parseJsonContent(raw) {
  try {
    return JSON.parse(raw);
  } catch (_error) {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('AI response is not valid JSON');
    }
    return JSON.parse(match[0]);
  }
}

async function generateStructuredJson({ moduleName, prompt }) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_key') {
    throw new Error('OPENAI_API_KEY is missing or placeholder value');
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let rawResponse = '';

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'You are a strict JSON generator. Return only valid JSON with no markdown.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    rawResponse = completion.choices?.[0]?.message?.content?.trim() || '';
    await logAiCall(moduleName, prompt, rawResponse);

    if (!rawResponse) {
      throw new Error('AI response is empty');
    }

    return parseJsonContent(rawResponse);
  } catch (error) {
    await logAiCall(moduleName, prompt, rawResponse || `ERROR: ${error.message}`);
    throw error;
  }
}

async function generateTextResponse({ moduleName, systemPrompt, userPrompt }) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_key') {
    throw new Error('OPENAI_API_KEY is missing or placeholder value');
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const promptForLog = `SYSTEM:\n${systemPrompt}\n\nUSER:\n${userPrompt}`;
  let rawResponse = '';

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    rawResponse = completion.choices?.[0]?.message?.content?.trim() || '';
    await logAiCall(moduleName, promptForLog, rawResponse);

    if (!rawResponse) {
      throw new Error('AI response is empty');
    }

    return rawResponse;
  } catch (error) {
    await logAiCall(moduleName, promptForLog, rawResponse || `ERROR: ${error.message}`);
    throw error;
  }
}

module.exports = {
  generateStructuredJson,
  generateTextResponse,
  logAiCall,
};
