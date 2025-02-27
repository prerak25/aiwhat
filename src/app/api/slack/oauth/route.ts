import { NextResponse } from 'next/server';
import { WebClient } from '@slack/web-api';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    const client = new WebClient();
    const result = await client.oauth.v2.access({
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      code
    });

    // Here you would typically store the tokens in your database
    // For now, we'll just redirect to a success page
    return NextResponse.redirect('/slack/success');
  } catch (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect('/slack/error');
  }
} 