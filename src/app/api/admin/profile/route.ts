import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function PUT(req: Request) {
  const jwt = req.headers.get("x-user-jwt");
  if (!jwt) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const supabase = supabaseServer(jwt);
  const body = await req.json();

  const { data: admin, error: fErr } = await supabase
    .from("users")
    .select("id")
    .eq("role", "admin")
    .single();

  if (fErr || !admin) {
    return NextResponse.json({ message: "Admin not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("users")
    .update({
      name: body.name,
      email: body.email,
      image_url: body.image_url,
    })
    .eq("id", admin.id);

  if (error) return NextResponse.json({ message: "Update failed", details: error }, { status: 400 });

  return NextResponse.json({ message: "Profile updated" });
}
