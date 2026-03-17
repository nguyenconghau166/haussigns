import { NextResponse } from 'next/server';
import { saveQAHistory, scoreContent } from '@/lib/content-qa';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title = String(body.title || '').trim();
    const description = String(body.description || '').trim();
    const content = String(body.content || '');
    const metaTitle = String(body.metaTitle || '').trim();
    const metaDescription = String(body.metaDescription || '').trim();
    const contentType = (body.contentType || 'page') as 'material' | 'industry' | 'project' | 'page' | 'product';

    if (!title || !content) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
    }

    const result = scoreContent({
      title,
      description,
      content,
      metaTitle,
      metaDescription,
      contentType,
      entityId: body.entityId,
      entityTable: body.entityTable
    });

    await saveQAHistory({
      title,
      description,
      content,
      metaTitle,
      metaDescription,
      contentType,
      entityId: body.entityId,
      entityTable: body.entityTable
    }, result, 'manual');

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to score content' }, { status: 500 });
  }
}
