import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const jwt = cookieHeader
    .split("; ")
    .find((row) => row.startsWith("sb_custom_jwt="))
    ?.split("=")[1];

  if (!jwt) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const supabase = supabaseServer(jwt);

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ message: "No file uploaded" }, { status: 400 });

  const ext = file.name.split(".").pop();
  const filename = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("avatars").upload(filename, file);
  if (error)
    return NextResponse.json({ message: "Upload failed", details: error }, { status: 400 });

  const { data } = supabase.storage.from("avatars").getPublicUrl(filename);
  return NextResponse.json({ image_url: data.publicUrl });
}
