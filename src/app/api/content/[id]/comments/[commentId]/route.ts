import { NextResponse } from 'next/server';
import { deleteComment } from '@/modules/content/services/comment-service';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id, commentId } = await params;
    const commentsList = await deleteComment(commentId, id);
    return NextResponse.json({ success: true, comments: commentsList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete comment' }, { status: 500 });
  }
}
