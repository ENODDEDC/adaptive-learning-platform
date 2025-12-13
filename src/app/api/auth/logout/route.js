import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    
    // Clear authentication cookies
    cookieStore.delete('token');
    cookieStore.delete('adminToken');

    return NextResponse.json({ 
      message: 'Logged out successfully' 
    }, { status: 200 });
  } catch (error) {
    console.error('Logout Error:', error.message);
    return NextResponse.json({ 
      message: 'An error occurred during logout' 
    }, { status: 500 });
  }
}
