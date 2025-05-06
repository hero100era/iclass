import { SignJWT, jwtVerify } from 'jose';
import {getEnvOrDie } from './env.server';

interface AuthConfig {
    jwt: {
        expiresIn: number;
        algorithm: 'HS256';
    };
}

interface UserPayload {
    email: string;
    role: string;
    category: string;
    [key: string]: unknown; // For additional user data
}

const AUTH_CONFIG: AuthConfig = {
    jwt: {
        expiresIn: 60 * 60 * 1000, // 1 hour in seconds
        algorithm: 'HS256',
    },
};

async function encrypt(payload: UserPayload): Promise<string> {
    try {
        const expires_ms = Date.now() + AUTH_CONFIG.jwt.expiresIn;
        const expires = new Date(expires_ms);
        const exp = Math.floor(expires_ms / 1000);
        if (!process.env.SECRET_KEY) {
            throw new Error('SECRET_KEY environment variable is not set');
        }
        const secretKey = getEnvOrDie('SECRET_KEY');
        const key = new TextEncoder().encode(secretKey);
        return await new SignJWT({ ...payload, exp })
            .setProtectedHeader({ alg: AUTH_CONFIG.jwt.algorithm, typ: 'JWT' })
            .setIssuedAt()
            .setExpirationTime(expires)
            .sign(key);
    } catch (error) {
        console.error('Encryption error:', error instanceof Error ? error.message : 'Unknown error occurred');
        throw new Error('Failed to create session token');
    }
}

async function decrypt(token: string | undefined): Promise<UserPayload | null> {
    if (!token) return null;
    if (!process.env.SECRET_KEY) {
        throw new Error('SECRET_KEY environment variable is not set');
    }
    const key = new TextEncoder().encode(process.env.SECRET_KEY);
    try {
        const { payload } = await jwtVerify(token, key, {
            algorithms: [AUTH_CONFIG.jwt.algorithm],
        });
        return payload as UserPayload;
    } catch (error) {
        console.error('Decryption error:', error instanceof Error ? error.message : 'Unknown error occurred');
        return null;
    }
}

export { AUTH_CONFIG, encrypt, decrypt };