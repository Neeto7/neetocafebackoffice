// /app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (error || !user) {
      return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ message: "Password salah" }, { status: 401 });
    }

    const payload = {
      sub: String(user.id),
      role: user.role,
      email: user.email,
    };

    const token = jwt.sign(payload, process.env.SUPABASE_JWT_SECRET!, {
      expiresIn: "3h",
    });

    const res = NextResponse.json({
      message: "success",
      role: user.role,
      name: user.name,
    });

    res.cookies.set({
      name: "sb_custom_jwt",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 3,
    });

    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
