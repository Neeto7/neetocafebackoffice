import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// ===============================
// 🔥 DELETE MENU
// ===============================
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json(
      { message: "Slug tidak ditemukan" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("menu")
    .delete()
    .eq("slug", slug);

  if (error) {
    return NextResponse.json(
      { message: "Delete gagal", error },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Delete berhasil" });
}


// ===============================
// 🔥 UPDATE MENU
// ===============================
export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json(
      { message: "Slug tidak ditemukan" },
      { status: 400 }
    );
  }

  const body = await req.json();

  const { error } = await supabaseAdmin
    .from("menu")
    .update(body)
    .eq("slug", slug);

  if (error) {
    return NextResponse.json(
      { message: "Update gagal", error },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Update berhasil" });
}
