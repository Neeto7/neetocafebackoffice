import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// Helper decode JWT
function getUserFromCookie(req: Request) {
  const cookie = req.headers.get("cookie");
  if (!cookie) return null;

  const match = cookie.match(/sb_custom_jwt=([^;]+)/);
  if (!match) return null;

  try {
    const decoded = jwt.verify(match[1], JWT_SECRET) as {
      id: number;
      role: string;
    };
    if (decoded.role !== "cashier") return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const auth = getUserFromCookie(req);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json(
      { message: "No file uploaded" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop();
  const filePath = `cashier-${auth.id}-${Date.now()}.${ext}`;

  // Upload
  const { error: uploadError } = await supabaseAdmin.storage
    .from("avatars")
    .upload(filePath, buffer, { upsert: true });

  if (uploadError) {
    console.error(uploadError);
    return NextResponse.json(
      { message: "Upload failed" },
      { status: 500 }
    );
  }

  // Get public URL
  const { data } = supabaseAdmin.storage
    .from("avatars")
    .getPublicUrl(filePath);

  const imageUrl = data.publicUrl;

  // Update DB
  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({ image_url: imageUrl })
    .eq("id", auth.id);

  if (updateError) {
    return NextResponse.json(
      { message: "Failed updating user avatar" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    image_url: imageUrl,
  });
}
