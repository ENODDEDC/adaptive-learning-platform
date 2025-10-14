import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const response = NextResponse.json({ message: 'Logout successful' }, { status: 200 });
    
    // Clear both token and adminToken cookies
    cookieStore.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0),
      path: '/',
      sameSite: 'Lax',
    });
    
    cookieStore.set('adminToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0),
      path: '/',
      sameSite: 'Lax',
    });
    
    return response;
  } catch (error) {
    console.error('Logout Error:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}