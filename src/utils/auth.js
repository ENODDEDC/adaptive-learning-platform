import { cookies } from 'next/headers';
import * as jose from 'jose';

export async function verifyToken() {
  const token = (await cookies()).get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error);
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
      console.error('Admin JWT verification failed: User is not an admin');
      return null;
    }
    return payload;
  } catch (error) {
    console.error('Admin JWT verification failed:', error);
    return null;
  }
}