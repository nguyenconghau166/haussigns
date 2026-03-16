import { NextResponse } from 'next/server';
import { executePipeline } from '@/lib/pipeline-runner';

export const maxDuration = 300; // Vercel Hobby limit: 1-300s for serverless functions

export async function POST() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (agent: string, step: string, status: string, message: string, data?: unknown) => {
        const event = JSON.stringify({ agent, step, status, message, data, timestamp: new Date().toISOString() });
        controller.enqueue(encoder.encode(`data: ${event}\n\n`));
      };

      try {
        await executePipeline({
          triggerType: 'manual',
          onEvent: (event) => send(event.agent, event.step, event.status, event.message, event.data)
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        send('System', 'complete', 'failed', `Pipeline lỗi: ${errorMsg}`);
      }

      controller.close();
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
