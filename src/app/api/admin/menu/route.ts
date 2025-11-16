import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("menu")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("🔥 Supabase error:", error);
      return NextResponse.json({ message: "Failed to fetch from Supabase" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("🔥 API /menu error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || !body.slug || !body.price || !body.image_url) {
      return NextResponse.json(
        { message: "Incomplete menu data" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("menu")
      .insert({
        name: body.name,
        slug: body.slug,
        category: body.category,
        price: body.price,
        description: body.description,
        image_url: body.image_url,
        is_available: body.is_available ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("🔥 Supabase insert error:", error);
      return NextResponse.json({ message: "Insert failed" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("🔥 POST /api/admin/menu error:", err);
    return NextResponse.json({ message: "Failed to create menu" }, { status: 500 });
  }
}
