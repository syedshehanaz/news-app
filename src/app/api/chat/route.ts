import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, context } = await req.json();

    const apiKey = process.env.COMPANY_API_KEY;
    const apiUrl = process.env.COMPANY_API_URL || "https://api.yourcompany.com/v1/chat/completions";

    if (!apiKey) {
      console.warn("No COMPANY_API_KEY found, returning mock response.");
      return NextResponse.json({
        reply: `Mock AI: That's a great question about the news. You asked: "${message}". In a real environment, I would analyze the current headlines: ${context.slice(0, 50)}... and provide a detailed answer. Add your COMPANY_API_KEY to the .env file to activate me!`
      });
    }

    const sys = `You are a sharp AI news assistant for the NEWS app. Today: ${new Date().toLocaleDateString()}.
Current headlines context:
${context}
Be concise (under 4 sentences) unless detail is requested. Be analytical and specific.`;

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.COMPANY_AI_MODEL || "company-model-name",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: message }
        ]
      })
    });

    if (!res.ok) {
      const errData = await res.text();
      console.error("Company API Error:", errData);
      throw new Error(`Company API returned ${res.status}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "I couldn't generate a response.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { reply: "Sorry, I encountered an error connecting to the AI." },
      { status: 500 }
    );
  }
}
