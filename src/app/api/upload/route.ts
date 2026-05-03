import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. You must be logged in to upload images." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary as a stream
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "promptgpt/prompts",
              resource_type: "image",
              transformation: [
                { quality: "auto:good" },
                { fetch_format: "auto" },
              ],
            },
            (error, result) => {
              if (error || !result) {
                reject(error ?? new Error("Upload failed"));
              } else {
                resolve(result as { secure_url: string; public_id: string });
              }
            }
          )
          .end(buffer);
      }
    );

    return NextResponse.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err: unknown) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Upload failed" },
      { status: 500 }
    );
  }
}
