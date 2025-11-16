//lib/auth/jwt.ts
import jwt from "jsonwebtoken";

export function signUserToken(userId: string) {
  return jwt.sign(
    {
      sub: userId,
      role: "authenticated",
    },
    process.env.SUPABASE_JWT_SECRET!,  
    { expiresIn: "3h" }
  );
}
