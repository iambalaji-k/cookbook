import { NextResponse } from 'next/server';
import { getCommentsByEntityId, addComment } from '@/modules/content/services/comment-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const commentsList = await getCommentsByEntityId(id);
    return NextResponse.json(commentsList);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { author, commentText } = body;

    if (!commentText || typeof commentText !== 'string') {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
    }

    const commentsList = await addComment(id, author || 'Anonymous Chef', commentText);
    return NextResponse.json({ success: true, comments: commentsList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add comment' }, { status: 500 });
  }
}
