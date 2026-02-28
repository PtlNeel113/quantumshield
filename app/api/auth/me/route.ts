import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // For demo, return a default admin user
  return NextResponse.json({
    id: '550e8400-e29b-41d4-a716-446655440001',
    organization_id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'admin@quantumshield.com',
    role: 'admin',
    status: 'active',
    mfa_enabled: false,
    last_login: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });
}
