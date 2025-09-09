import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const response = NextResponse.json({ message: 'Logout successful' }, { status: 200 });
    cookies().set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0), // Expire the cookie immediately
      path: '/',
      sameSite: 'Lax',
    });
    return response;
  } catch (error) {
    console.error('Logout Error:', error.message);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}