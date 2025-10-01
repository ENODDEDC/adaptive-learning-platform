import { cookies } from 'next/headers';
import * as jose from 'jose';

export async function verifyToken() {
  try {
    // First try to get token from cookies (server-side)
    const token = (await cookies()).get('token')?.value;

    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function verifyAdminToken() {
  const token = (await cookies()).get('adminToken')?.value;

  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    if (payload.role !== 'admin') {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}

// Client-side token helper for debugging
export function getClientToken() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
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
    return false;
  }
}