import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  try {
    const accessToken = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser(accessToken);

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, avatar_url")
      .eq("id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: data });
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const accessToken = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser(accessToken);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();

    const name = String(form.get("name"));
    const email = String(form.get("email"));
    const avatar = form.get("avatar") as File | null;

    let avatarUrl: string | null = null;

    // Upload avatar jika ada
    if (avatar) {
      const ext = avatar.name.split(".").pop();
      const path = `avatars/${user.id}_${Date.now()}.${ext}`;

      const { data: upload, error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, avatar, { upsert: true });

      if (uploadErr) {
        return NextResponse.json(
          { error: "Upload failed" },
          { status: 500 }
        );
      }

      const { data: publicUrl } = supabase.storage
        .from("avatars")
        .getPublicUrl(upload.path);

      avatarUrl = publicUrl.publicUrl;
    }

    const update = {
      name,
      email,
      ...(avatarUrl && { avatar_url: avatarUrl }),
    };

    const { error: updateErr } = await supabase
      .from("users")
      .update(update)
      .eq("id", user.id);

    if (updateErr) {
      return NextResponse.json(
        { error: "Update failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
