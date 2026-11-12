import { NextRequest, NextResponse } from 'next/server';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  messages: Message[];
  role?: 'buyer' | 'seller';
  user?: { name?: string; email?: string };
}

const SYSTEM_PROMPT = `You are Meowrie, a friendly AI assistant for Kasafide — a verified property rental platform in Sta. Maria, Bulacan, Philippines. You help users with:
- Property listings and search
- Payments (QR Ph, GCash, Maya)
- Seller verification process
- Viewing requests and scheduling
- Security deposits
- Two-factor authentication (2FA) setup

Keep your replies short, helpful, and friendly. Bring Filipino warmth — say "Kumusta!" sometimes. Never invent policies or make up information not provided to you. If unsure, direct users to support@kasafide.ph.`;

function buildMistralPrompt(messages: Message[]): string {
  let prompt = `<s>[INST] ${SYSTEM_PROMPT}\n\n`;

  const history = messages.slice(0, -1);
  const lastMessage = messages[messages.length - 1];

  for (let i = 0; i < history.length; i++) {
    const msg = history[i];
    if (msg.role === 'user') {
      prompt += `${msg.content} [/INST]`;
    } else if (msg.role === 'assistant') {
      prompt += ` ${msg.content} </s><s>[INST] `;
    }
  }

  if (lastMessage) {
    if (history.length === 0) {
      prompt += `${lastMessage.content} [/INST]`;
    } else {
      prompt += `${lastMessage.content} [/INST]`;
    }
  }

  return prompt;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: RequestBody = await request.json();
    const { messages, role, user } = body;

    const apiKey = process.env.HUGGING_FACE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        reply: "I'm Meowrie! I'm still setting up — please contact support@kasafide.ph for help.",
      });
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({
        reply: "Kumusta! I'm Meowrie, Kasafide's assistant. How can I help you today? 🐾",
      });
    }

    // Optionally personalize if user info provided
    const contextNote = user?.name
      ? `The user's name is ${user.name}${role ? ` and they are a ${role}` : ''}.`
      : role
      ? `The user is a ${role}.`
      : '';

    const messagesWithContext: Message[] = contextNote
      ? [{ role: 'system' as const, content: contextNote }, ...messages]
      : messages;

    const prompt = buildMistralPrompt(messagesWithContext);

    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 300,
            temperature: 0.7,
            return_full_text: false,
          },
        }),
      }
    );

    if (!hfResponse.ok) {
      throw new Error(`HuggingFace API error: ${hfResponse.status}`);
    }

    const data = await hfResponse.json();

    // HF returns an array: [{ generated_text: "..." }]
    const generatedText: string =
      Array.isArray(data) && data[0]?.generated_text
        ? (data[0].generated_text as string).trim()
        : typeof data?.generated_text === 'string'
        ? (data.generated_text as string).trim()
        : '';

    if (!generatedText) {
      throw new Error('Empty response from model');
    }

    return NextResponse.json({ reply: generatedText });
  } catch (error) {
    console.error('[Meowrie] Error:', error);
    return NextResponse.json({
      reply: "Sorry, I'm having trouble right now 🐾. Please reach support@kasafide.ph!",
    });
  }
}
