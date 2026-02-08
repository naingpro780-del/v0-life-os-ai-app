import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: "openai/gpt-5-mini",
    system: `You are LifeOS Assistant, a friendly and helpful AI that helps users manage their daily life. 
You can help with:
- Planning tasks and setting priorities
- Suggesting healthy habits to build
- Organizing notes and ideas
- Time management and calendar planning
- Setting and tracking goals
- General life advice and motivation

Be concise, warm, and actionable in your responses. Use bullet points when listing things.
When the user writes in Myanmar/Burmese, respond in Myanmar/Burmese.`,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
  });

  return result.toUIMessageStreamResponse();
}
