import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin"; // pakai service role

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    // 🔧 ubah File ke Buffer dulu
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = file.name.split(".").pop();
    const filename = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from("menu-images")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) {
      console.error("🔥 Upload error:", uploadErr);
      return NextResponse.json({ message: "Upload failed", details: uploadErr }, { status: 400 });
    }

    const { data } = supabaseAdmin.storage
      .from("menu-images")
      .getPublicUrl(filename);

    return NextResponse.json({ image_url: data.publicUrl });
  } catch (err) {
    console.error("🔥 POST /api/admin/upload error:", err);
    return NextResponse.json({ message: "Upload failed", error: String(err) }, { status: 500 });
  }
}
