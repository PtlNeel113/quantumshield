import { NextRequest, NextResponse } from 'next/server';

// Demo users
const DEMO_USERS: Record<string, any> = {
  'admin@quantumshield.com': {
    id: '550e8400-e29b-41d4-a716-446655440001',
    organization_id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'admin@quantumshield.com',
    password: 'admin123',
    role: 'admin',
    status: 'active',
    mfa_enabled: false,
  },
  'analyst@quantumshield.com': {
    id: '550e8400-e29b-41d4-a716-446655440002',
    organization_id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'analyst@quantumshield.com',
    password: 'analyst123',
    role: 'analyst',
    status: 'active',
    mfa_enabled: false,
  },
  'viewer@quantumshield.com': {
    id: '550e8400-e29b-41d4-a716-446655440003',
    organization_id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'viewer@quantumshield.com',
    password: 'viewer123',
    role: 'viewer',
    status: 'active',
    mfa_enabled: false,
  },
  'nil1032007@gmail.com': {
    id: '550e8400-e29b-41d4-a716-446655440004',
    organization_id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'nil1032007@gmail.com',
    password: 'password123',
    role: 'admin',
    status: 'active',
    mfa_enabled: false,
  },
};

// Simple JWT creation (for demo only - use proper library in production)
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
  
  // For demo, using simple signature (in production, use proper crypto)
  const signature = Buffer.from(`${base64Header}.${base64Payload}.secret`).toString('base64url');
  
  return `${base64Header}.${base64Payload}.${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('Login attempt:', email);

    // Accept ANY email and password - create user on the fly
    let user = DEMO_USERS[email];

    // If user doesn't exist, create a new one with admin role
    if (!user) {
      user = {
        id: `user-${Date.now()}`,
        organization_id: '550e8400-e29b-41d4-a716-446655440001',
        email: email,
        password: password,
        role: 'admin',
        status: 'active',
        mfa_enabled: false,
      };
    }

    // Create tokens
    const accessToken = createToken(
      user.id,
      user.organization_id,
      user.role,
      user.email
    );

    const refreshToken = createToken(
      user.id,
      user.organization_id,
      user.role,
      user.email
    );

    // Response
    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
      expires_in: 900,
      user: {
        id: user.id,
        organization_id: user.organization_id,
        email: user.email,
        role: user.role,
        status: user.status,
        mfa_enabled: user.mfa_enabled,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
