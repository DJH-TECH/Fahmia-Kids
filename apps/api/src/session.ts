import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const COOKIE = "fahmia_session";
const CLIENT = "fahmia_client";
const WEEK = 60 * 60 * 24 * 14;
const YEAR = 60 * 60 * 24 * 365;

function secret() {
  return process.env.SESSION_SECRET || "fahmia-kids-dev-secret";
}

export function seal(token: string) {
  const mac = crypto.createHmac("sha256", secret()).update(token).digest("base64url");
  return `${token}.${mac}`;
}

export function openSeal(value: string) {
  const i = value.lastIndexOf(".");
  if (i <= 0) return null;
  const token = value.slice(0, i);
  const mac = value.slice(i + 1);
  const expected = crypto.createHmac("sha256", secret()).update(token).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return token;
}

function readCookie(req: Request) {
  const raw = req.headers.cookie || "";
  const hit = raw.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`));
  return hit ? decodeURIComponent(hit.slice(COOKIE.length + 1)) : null;
}

export function setSessionCookie(res: Response, token: string) {
  const sealed = encodeURIComponent(seal(token));
  res.setHeader("Set-Cookie", `${COOKIE}=${sealed}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${WEEK}`);
}

export function clearSessionCookie(res: Response) {
  res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

export function readClientId(req: Request) {
  const raw = req.headers.cookie || "";
  const hit = raw.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${CLIENT}=`));
  return hit ? decodeURIComponent(hit.slice(CLIENT.length + 1)) : null;
}

export function setClientCookie(res: Response, id: string) {
  res.append("Set-Cookie", `${CLIENT}=${encodeURIComponent(id)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${YEAR}`);
}

export function clearClientCookie(res: Response) {
  res.append("Set-Cookie", `${CLIENT}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

export type AuthUser = { id: string; name: string; email: string; isDemo: boolean };

export async function currentUser(req: Request): Promise<AuthUser | null> {
  const sealed = readCookie(req);
  if (!sealed) return null;
  const token = openSeal(sealed);
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  return { id: session.user.id, name: session.user.name, email: session.user.email, isDemo: session.user.isDemo };
}

export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const user = await currentUser(req);
  if (!user) {
    res.status(401).json({ error: "Connexion requise." });
    return;
  }
  res.locals.user = user;
  next();
}

export async function startSession(res: Response, userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.session.create({
    data: { token, userId, expiresAt: new Date(Date.now() + WEEK * 1000) },
  });
  setSessionCookie(res, token);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function checkPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
