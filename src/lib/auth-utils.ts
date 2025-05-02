import { sign, verify, Secret, SignOptions } from "jsonwebtoken";
import { hash, compare } from "bcrypt";
import * as dotenv from "dotenv";
import { cookies } from "next/headers";
import { User } from "@/db/schema";

dotenv.config();

const JWT_SECRET_STRING =
  process.env.JWT_SECRET || "fallback_secret_do_not_use_in_production";
// Create a Buffer from the secret string to ensure compatibility with jsonwebtoken
const JWT_SECRET = Buffer.from(JWT_SECRET_STRING, "utf-8");
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const SALT_ROUNDS = 10;

export type TokenPayload = {
  id: number;
  email: string;
  role: string;
  name?: string;
  iat?: number;
  exp?: number;
};

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await compare(plainPassword, hashedPassword);
}

export function generateToken(user: Omit<User, "password">): string {
  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  return sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// These functions should be used in server components or API routes
export function setAuthCookie(token: string): void {
  try {
    (cookies() as any).set("auth_token", token, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
  } catch (error) {
    console.error("Error setting auth cookie:", error);
  }
}

export function getAuthCookie(): string | undefined {
  try {
    return (cookies() as any).get("auth_token")?.value;
  } catch (error) {
    console.error("Error getting auth cookie:", error);
    return undefined;
  }
}

export function removeAuthCookie(): void {
  try {
    (cookies() as any).delete("auth_token");
  } catch (error) {
    console.error("Error removing auth cookie:", error);
  }
}
