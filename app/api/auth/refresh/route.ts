import { NextRequest, NextResponse } from 'next/server';

// Simple JWT creation (for demo only)
function createToken(userId: string, organizationId: string, role: string, email: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: userId,
    org: organizationId,
    role: role,
    email: email,
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900, // 15 minutes
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = Buffer.from(`${base64Header}.${base64Payload}.secret`).toString('base64url');
  
  return `${base64Header}.${base64Payload}.${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refresh_token } = body;

    // For demo, create new tokens
    const userId = '550e8400-e29b-41d4-a716-446655440001';
    const organizationId = '550e8400-e29b-41d4-a716-446655440001';
    const role = 'admin';
    const email = 'admin@quantumshield.com';

    const accessToken = createToken(userId, organizationId, role, email);

    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refresh_token,
      token_type: 'bearer',
      expires_in: 900,
      user: {
        id: userId,
        organization_id: organizationId,
        email: email,
        role: role,
        status: 'active',
        mfa_enabled: false,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { detail: 'Invalid token' },
      { status: 401 }
    );
  }
}
