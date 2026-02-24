import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import {
  uploadFile,
  generateFileKey,
  MAX_FILE_SIZE,
  ACCEPTED_IMAGE_TYPES,
} from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non accepté. Utilisez JPEG, PNG, WebP ou GIF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop volumineux. Maximum 5 Mo." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Optimisation : conversion en WebP + redimensionnement max 1920px
    const optimizedBuffer = await sharp(inputBuffer)
      .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const key = generateFileKey(file.name.replace(/\.[^.]+$/, ".webp"));
    const url = await uploadFile(optimizedBuffer, key, "image/webp");

    return NextResponse.json({ url, key });
  } catch (error) {
    console.error("[upload] Erreur :", error);
    return NextResponse.json({ error: "Erreur lors de l'upload." }, { status: 500 });
  }
}
