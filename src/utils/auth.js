import { cookies } from 'next/headers';
import * as jose from 'jose';

export async function verifyToken() {
  try {
    // First try to get token from cookies (server-side)
    const token = (await cookies()).get('token')?.value;

    if (!token) {
      console.log('No token found in cookies');
      return null;
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    console.log('Token verified successfully for user:', payload.userId);
    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    console.error('Error details:', error);
    return null;
  }
}

export async function verifyAdminToken() {
  const token = (await cookies()).get('adminToken')?.value;

  if (!token) {
    console.log('No admin token found');
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    if (payload.role !== 'admin') {
      console.error('Admin JWT verification failed: User is not an admin');
      return null;
    }
    console.log('Admin token verified successfully');
    return payload;
  } catch (error) {
    console.error('Admin JWT verification failed:', error);
    return null;
  }
}

// Client-side token helper for debugging
export function getClientToken() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    console.log('🔍 Client token check:', token ? 'Present' : 'Not found');
    return token;
  }
  return null;
}

// Helper to check if user is authenticated
export async function isAuthenticated() {
  try {
    const response = await fetch('/api/auth/profile');
    return response.ok;
  } catch (error) {
    console.error('Authentication check failed:', error);
    return false;
  }
}