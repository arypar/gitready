import { NextRequest, NextResponse } from 'next/server';

// Simple debug endpoint to test things
export async function GET(request: NextRequest) {
  // Just return the current time and a success message
  return NextResponse.json({
    success: true,
    message: 'Debug endpoint is working',
    timestamp: new Date().toISOString(),
    info: 'Check your server console for Claude response logs'
  });
} 