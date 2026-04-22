import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // In a real app with auth, we'd get the userId from the session.
    // Here we'll just fetch all bookmarks for demonstration, or assume a hardcoded user.
    const bookmarks = await prisma.bookmark.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error("Failed to fetch bookmarks:", error);
    return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, content, url, imageUrl, source, publishedAt } = body;

    if (!url || !title) {
      return NextResponse.json({ error: "URL and title are required" }, { status: 400 });
    }

    // Upsert a default user if it doesn't exist just for the demo
    let defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: {
          email: "demo@example.com",
          name: "Demo User",
        }
      });
    }

    // Check if it already exists
    const existing = await prisma.bookmark.findUnique({
      where: { url }
    });

    if (existing) {
      // Un-bookmark if it exists (toggle behavior)
      await prisma.bookmark.delete({ where: { url } });
      return NextResponse.json({ message: "Bookmark removed", bookmarked: false });
    }

    // Create bookmark
    const bookmark = await prisma.bookmark.create({
      data: {
        title,
        description,
        content,
        url,
        imageUrl,
        source: source?.name || source,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        userId: defaultUser.id,
      }
    });

    return NextResponse.json({ message: "Bookmark added", bookmark, bookmarked: true });
  } catch (error) {
    console.error("Failed to save bookmark:", error);
    return NextResponse.json({ error: "Failed to save bookmark" }, { status: 500 });
  }
}
