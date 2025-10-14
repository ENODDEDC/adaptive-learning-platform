import { cookies } from 'next/headers';
import * as jose from 'jose';

export async function getUserIdFromToken(request) {
  try {
    // First try to get token from Authorization header
    const authHeader = request.headers.get('authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Fallback to cookie-based token
      const cookieStore = await cookies();
      token = cookieStore.get('token')?.value;
    }

    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    
    // Return userId from payload (could be 'id' or 'userId' depending on your JWT structure)
    return payload.userId || payload.id || null;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export async function getUserFromToken(request) {
  try {
    // First try to get token from Authorization header
    const authHeader = request.headers.get('authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Fallback to cookie-based token
      const cookieStore = await cookies();
      // Check both 'token' and 'adminToken' cookies
      token = cookieStore.get('adminToken')?.value || cookieStore.get('token')?.value;
    }

    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    
    // Return full user info from payload
    return {
      userId: payload.userId || payload.id || null,
      role: payload.role || null,
      email: payload.email || null,
      name: payload.name || null
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}
