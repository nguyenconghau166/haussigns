import { NextResponse } from 'next/server';
import { runPipeline } from '@/lib/pipeline';

export const maxDuration = 300;

export async function POST() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (step: string, status: string, message: string, data?: unknown) => {
        const event = JSON.stringify({ step, status, message, data, timestamp: new Date().toISOString() });
        controller.enqueue(encoder.encode(`data: ${event}\n\n`));
      };

      try {
        await runPipeline({
          triggerType: 'manual',
          onEvent: (event) => send(event.step, event.status, event.message, event.data)
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        send('system', 'failed', `Pipeline error: ${errorMsg}`);
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
