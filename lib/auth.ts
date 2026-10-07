import "server-only";
import { createHash, pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { cache } from "react";
import { getDb } from "@/lib/db";
const derive = promisify(pbkdf2), rounds = 600000;
const hashSessionToken = (token: string) => createHash("sha256").update(token).digest("hex");
export async function hashPassword(value:string) { const salt=randomBytes(16), hash=await derive(value,salt,rounds,32,"sha512"); return `pbkdf2_sha512$${rounds}$${salt.toString("base64url")}$${hash.toString("base64url")}`; }
export async function verifyPassword(value:string, stored:string) { const [kind, count, salt, hash]=stored.split("$"); if(kind!=="pbkdf2_sha512"||!count||!salt||!hash)return false; const expected=Buffer.from(hash,"base64url"), actual=await derive(value,Buffer.from(salt,"base64url"),Number(count),expected.length,"sha512"); return timingSafeEqual(expected,actual); }
export async function createSession(userId:string) { const token=randomBytes(32).toString("base64url"); await getDb()`insert into policyboard.user_sessions (user_id,token_hash,expires_at) values (${userId},${hashSessionToken(token)},now()+interval '12 hours')`; (await cookies()).set("policyboard_session",token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:43200}); }

// Deduplicate layout/page checks only within one render, never across users or requests.
export const getCurrentUser = cache(async function getCurrentUser() { const token=(await cookies()).get("policyboard_session")?.value; if(!token)return null; const rows=await getDb()<{id:string;first_name:string;role:string}[]>`select u.id,p.first_name,r.code as role from policyboard.user_sessions s join policyboard.users u on u.id=s.user_id join policyboard.profiles p on p.user_id=u.id join policyboard.roles r on r.id=u.role_id where s.token_hash=${hashSessionToken(token)} and s.revoked_at is null and s.expires_at>now() and u.active`; return rows[0]??null; });

export async function endSession() { const token=(await cookies()).get("policyboard_session")?.value; if(token) await getDb()`update policyboard.user_sessions set revoked_at=now() where token_hash=${hashSessionToken(token)} and revoked_at is null`; (await cookies()).delete("policyboard_session"); }
