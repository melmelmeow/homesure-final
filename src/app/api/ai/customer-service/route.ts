import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Fallback intelligent domain response engine for HomeSure when HF key is missing or model is queueing
function generateHomeSureKnowledgeResponse(userMessage: string, role: string, userName?: string): string {
  const q = userMessage.toLowerCase();
  const name = userName ? userName.split(' ')[0] : 'there';

  // 1. Viewing / Site visit
  if (q.includes('view') || q.includes('visit') || q.includes('schedule') || q.includes('appointment')) {
    if (role === 'seller' || role === 'landlord') {
      return `Hi ${name}! As a seller, you can review and manage viewing requests from prospective buyers under your **Viewing Requests** dashboard (\`seller/viewing-requests.html\`).\n\n• You can click **Accept** to confirm the date and time, or propose a new schedule.\n• Once accepted, the buyer receives an automated SMS and email notification confirming the viewing.\n• Make sure your property details and contact phone number are up to date!`;
    }
    return `Hi ${name}! Scheduling a property viewing is simple and secure on HomeSure:\n\n1. Browse to any property listing you like in the **Browse Properties** page.\n2. Click on the property card to view the full details.\n3. Click the **"Schedule Viewing"** button on the listing page.\n4. Select your preferred date, time slot, and add any specific questions.\n5. Once submitted, the verified seller will confirm or reschedule. You'll receive real-time notifications in your dashboard and via email/SMS!`;
  }

  // 2. Escrow & Payments
  if (q.includes('payment') || q.includes('escrow') || q.includes('pay') || q.includes('deposit') || q.includes('money') || q.includes('xendit') || q.includes('gcash') || q.includes('refund')) {
    if (role === 'seller' || role === 'landlord') {
      return `Hi ${name}! Here is how payments work for HomeSure sellers:\n\n• **Escrow Protection**: Buyer deposits (reservation fees or security deposits) are held safely in HomeSure Escrow powered by Xendit.\n• **Payout Release**: Once the viewing is completed, the contract or Memorandum of Agreement (MOA) is signed, and both parties approve, funds are disbursed directly to your designated bank account or e-wallet.\n• You can track all incoming transactions and payout disbursements under **Payments & Earnings** (\`seller/payments.html\`).`;
    }
    return `Hi ${name}! HomeSure protects all buyer payments with **Bank-Grade Escrow** powered by Xendit:\n\n• **Reservation & Deposits**: When you place a deposit on a property, your funds are NOT immediately given to the seller. Instead, they are held safely in our regulated escrow account.\n• **Inspection Guarantee**: You have time to inspect the property and sign the lease/deed. Funds are only released once terms are verified.\n• **Supported Methods**: GCash, Maya, GrabPay, Visa/Mastercard, and Online Banking.\n• **Refunds**: If the seller misrepresents the listing or cancels, you can easily request a full refund via your Payments tab.`;
  }

  // 3. Post a property / Pin location
  if (q.includes('post') || q.includes('list') || q.includes('publish') || q.includes('pin') || q.includes('map') || q.includes('location')) {
    if (role === 'seller' || role === 'landlord') {
      return `Hi ${name}! To post a new property and pin its location:\n\n1. Go to **Post Property** (\`seller/post.html\`) in your sidebar navigation.\n2. Fill in the title, price, property type (House, Apartment, Condo), floor area, and description.\n3. Upload clear, high-resolution photos of the exterior, living spaces, and rooms.\n4. In the **Property Location on Google Maps** section, enter your street address and click **"Pin on Map"** to verify the exact Google Maps coordinates.\n5. Click **Submit Listing**. Your listing will be reviewed and published to thousands of buyers!`;
    }
    return `Looking for a property location? On any listing page, scroll down to the **Property Location** section to explore the interactive Google Map, zoom in on the neighborhood, and check nearby landmarks or commute routes!`;
  }

  // 4. Verification & Requirements
  if (q.includes('verify') || q.includes('verification') || q.includes('document') || q.includes('id') || q.includes('title') || q.includes('legit') || q.includes('fake')) {
    if (role === 'seller' || role === 'landlord') {
      return `Hi ${name}! Verified sellers receive up to 4x more buyer inquiries and a trusted badge:\n\n• Go to **Verification** (\`seller/verification.html\`).\n• **Required Documents**:\n  1. Government-issued Photo ID (Passport, UMID, Driver's License, or National ID).\n  2. Proof of Property Ownership (Transfer Certificate of Title [TCT], Condominium Certificate of Title [CCT], or Notarized Authority to Sell).\n• HomeSure admins review and verify documents within 24 to 48 business hours.`;
    }
    return `Every verified seller on HomeSure displays a blue/green **"Verified Seller"** badge.\n\n• Before a seller receives this badge, our compliance team inspects their government ID and legal proof of ownership (TCT or CCT).\n• We recommend prioritizing listings with the Verified badge for maximum safety.`;
  }

  // 5. Account, Profile & 2FA
  if (q.includes('2fa') || q.includes('two factor') || q.includes('auth') || q.includes('password') || q.includes('security') || q.includes('avatar') || q.includes('profile')) {
    return `Hi ${name}! Here are key security and profile features on HomeSure:\n\n• **Profile Picture**: Go to your **Profile** page, click the avatar camera/upload button, select a photo, and click Save. It saves instantly to secure cloud storage.\n• **Two-Factor Authentication (2FA)**: Visit **Settings**, enable Two-Factor Authentication, and choose either Brevo SMS/Email verification or one-click Google Client authentication.\n• **Password & Notifications**: You can update your password and toggle instant email/SMS alerts directly inside Settings.`;
  }

  // 6. Contact Human Support
  if (q.includes('human') || q.includes('agent') || q.includes('person') || q.includes('call') || q.includes('email support') || q.includes('hotline') || q.includes('contact')) {
    return `You can connect directly with our Human Support Team at HomeSure:\n\n• 📧 **Email Support**: support@homesure.ph\n• 📞 **Customer Hotline**: +63 (02) 8123-4567 / +63 917 123 4567\n• 🏢 **Office Hours**: Monday to Saturday, 8:00 AM – 7:00 PM PHT\n• 📝 You can also submit a direct ticket through your **Help & Support** page, and an agent will respond within 2 hours.`;
  }

  // 7. Greetings
  if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q === 'good morning' || q === 'good afternoon' || q === 'good evening') {
    const roleTitle = role === 'seller' ? 'Seller/Landlord' : 'Buyer';
    return `Hello ${name}! 👋 Welcome to HomeSure Customer Care. I am your 24/7 AI Assistant.\n\nAs a ${roleTitle}, how can I help you today? You can ask me about:\n• ${role === 'seller' ? 'Posting listings & pinning locations on Google Maps' : 'Browsing verified properties & booking site visits'}\n• Secure payments and escrow protection\n• Document verification & safety checks\n• Account settings, notifications & 2FA`;
  }

  // Default fallback
  const roleHelp = role === 'seller'
    ? 'I can assist you with posting properties, pinning map locations, verification documents, managing viewing requests, and receiving escrow payouts.'
    : 'I can assist you with property viewings, verified seller checks, escrow payment protection, saving listings, and account settings.';

  return `Thank you for reaching out to HomeSure Customer Support, ${name}! ${roleHelp}\n\nCould you please provide a few more details about your inquiry? You can also reach our live support desk at **support@homesure.ph** or call **+63 (02) 8123-4567**.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], role = 'buyer', user = {} } = body;

    const lastMessage = Array.isArray(messages) && messages.length > 0 
      ? messages[messages.length - 1].content 
      : '';

    const userName = user?.name || user?.email || 'HomeSure User';
    const userRole = role === 'seller' || role === 'landlord' ? 'seller' : 'buyer';

    const hfApiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || '';
    const hfModel = process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.3';

    // System prompt tailored to HomeSure customer service
    const systemPrompt = `You are the HomeSure AI Customer Support Specialist, a warm, professional, and knowledgeable AI assistant for HomeSure, the premier Philippine real estate and rental marketplace.
Current user: ${userName} (Role: ${userRole.toUpperCase()}).
Platform Guidelines:
1. Philippine Real Estate Context: Reference Philippine terms (Barangays, PHP currency ₱, TCT/CCT titles, Pag-IBIG/bank financing, GCash/Maya/Xendit payments).
2. Escrow & Safety: Emphasize that HomeSure holds reservation fees and deposits in secure Xendit Escrow until contracts are signed and site inspections are approved.
3. For Buyers: Help them browse listings, schedule site viewings, check verified landlord badges, and make secure escrow payments.
4. For Sellers: Guide them on publishing listings, pinning coordinates on Google Maps, uploading TCT/IDs for verification, and managing viewing schedules.
5. Tone: Polite, helpful, reassuring, concise, and structured with bullet points.
If you do not know a specific account detail, advise contacting human support at support@homesure.ph or +63 (02) 8123-4567.`;

    if (hfApiKey) {
      try {
        // Attempt 1: Hugging Face Router Chat Completions API
        const formattedMessages = [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-6).map((m: ChatMessage) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          }))
        ];

        const hfResponse = await fetch('https://router.huggingface.co/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${hfApiKey}`
          },
          body: JSON.stringify({
            model: hfModel,
            messages: formattedMessages,
            max_tokens: 500,
            temperature: 0.7
          }),
          signal: AbortSignal.timeout(12000)
        });

        if (hfResponse.ok) {
          const data = await hfResponse.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply && reply.trim().length > 0) {
            return NextResponse.json({
              reply: reply.trim(),
              source: 'huggingface_router',
              model: hfModel
            });
          }
        }

        // Attempt 2: Serverless Inference API fallback (api-inference.huggingface.co)
        const directHfResponse = await fetch(`https://api-inference.huggingface.co/models/${encodeURIComponent(hfModel)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${hfApiKey}`
          },
          body: JSON.stringify({
            inputs: `<s>[INST] ${systemPrompt}\n\nUser Question: ${lastMessage} [/INST]`,
            parameters: { max_new_tokens: 400, temperature: 0.7 }
          }),
          signal: AbortSignal.timeout(12000)
        });

        if (directHfResponse.ok) {
          const raw = await directHfResponse.json();
          let generated = '';
          if (Array.isArray(raw) && raw[0]?.generated_text) {
            generated = raw[0].generated_text;
            // Clean prompt echo if present
            if (generated.includes('[/INST]')) {
              generated = generated.split('[/INST]')[1];
            }
          }
          if (generated.trim()) {
            return NextResponse.json({
              reply: generated.trim(),
              source: 'huggingface_inference',
              model: hfModel
            });
          }
        }
      } catch (hfErr) {
        console.warn('[HuggingFace API] Notice, falling back to HomeSure knowledge engine:', hfErr);
      }
    }

    // Fallback: HomeSure Expert Domain Knowledge Engine
    const smartReply = generateHomeSureKnowledgeResponse(lastMessage, userRole, userName);
    return NextResponse.json({
      reply: smartReply,
      source: 'homesure_knowledge_engine',
      huggingface_ready: !!hfApiKey
    });

  } catch (error: any) {
    console.error('Customer service API error:', error);
    return NextResponse.json(
      { error: 'Failed to process customer service request', details: error?.message },
      { status: 500 }
    );
  }
}
