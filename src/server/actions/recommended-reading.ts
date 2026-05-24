"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createServiceRoleClient } from "@/lib/supabase/service";

const BUCKET = "recommended-documents";
const SLOT = "echonx_pick";
const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_COVER_SIZE_BYTES = 5 * 1024 * 1024;
const COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type RecommendedReadingItem = {
  slot: string;
  title: string;
  author: string | null;
  description: string | null;
  coverUrl: string | null;
  documentUrl: string;
  documentType: "pdf" | "text";
  updatedAt: string | null;
};

type RecommendationRow = {
  slot: string;
  title: string;
  author: string | null;
  description: string | null;
  cover_url: string | null;
  document_url: string;
  document_type: "pdf" | "text";
  updated_at: string | null;
};

function toItem(row: RecommendationRow): RecommendedReadingItem {
  return {
    slot: row.slot,
    title: row.title,
    author: row.author,
    description: row.description,
    coverUrl: row.cover_url,
    documentUrl: row.document_url,
    documentType: row.document_type,
    updatedAt: row.updated_at,
  };
}

function normalizeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function formFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

function publicUrl(path: string) {
  const supabase = createServiceRoleClient();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function getEchonXReadingRecommendation() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("app_recommendations")
    .select("slot, title, author, description, cover_url, document_url, document_type, updated_at")
    .eq("slot", SLOT)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    console.warn("Unable to load EchonX reading recommendation", error.message);
    return null;
  }

  return data ? toItem(data as RecommendationRow) : null;
}

export async function saveEchonXReadingRecommendation(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "admin") {
    return { ok: false, error: "Only admins can update the EchonX reading recommendation." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const pdf = formFile(formData, "pdf");
  const cover = formFile(formData, "cover");

  if (!title) return { ok: false, error: "Add a title for the recommendation." };

  const supabase = createServiceRoleClient();
  const { data: current } = await supabase
    .from("app_recommendations")
    .select("document_path, document_url, cover_path, cover_url")
    .eq("slot", SLOT)
    .maybeSingle();

  let documentPath = (current?.document_path as string | null) ?? null;
  let documentUrl = (current?.document_url as string | null) ?? null;
  let coverPath = (current?.cover_path as string | null) ?? null;
  let coverUrl = (current?.cover_url as string | null) ?? null;

  if (!pdf && !documentPath) {
    return { ok: false, error: "Upload a PDF for the first EchonX recommendation." };
  }

  if (pdf) {
    if (pdf.type !== "application/pdf" && !pdf.name.toLowerCase().endsWith(".pdf")) {
      return { ok: false, error: "The recommendation document must be a PDF." };
    }
    if (pdf.size > MAX_PDF_SIZE_BYTES) {
      return { ok: false, error: "The PDF is too large. Use a file up to 25 MB." };
    }
    const bytes = new Uint8Array(await pdf.arrayBuffer());
    documentPath = `echonx-pick/${Date.now()}-${normalizeFileName(pdf.name || "recommendation.pdf")}`;
    const { error } = await supabase.storage.from(BUCKET).upload(documentPath, bytes, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (error) return { ok: false, error: error.message };
    documentUrl = publicUrl(documentPath);
  }

  if (cover) {
    if (!COVER_TYPES.has(cover.type)) {
      return { ok: false, error: "The cover must be JPG, PNG, or WebP." };
    }
    if (cover.size > MAX_COVER_SIZE_BYTES) {
      return { ok: false, error: "The cover is too large. Use an image up to 5 MB." };
    }
    const bytes = new Uint8Array(await cover.arrayBuffer());
    coverPath = `echonx-pick/covers/${Date.now()}-${normalizeFileName(cover.name || "cover.webp")}`;
    const { error } = await supabase.storage.from(BUCKET).upload(coverPath, bytes, {
      contentType: cover.type,
      upsert: true,
    });
    if (error) return { ok: false, error: error.message };
    coverUrl = publicUrl(coverPath);
  }

  const { error } = await supabase.from("app_recommendations").upsert({
    slot: SLOT,
    title,
    author: author || null,
    description: description || null,
    cover_url: coverUrl,
    cover_path: coverPath,
    document_url: documentUrl,
    document_path: documentPath,
    document_type: "pdf",
    active: true,
    updated_at: new Date().toISOString(),
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app");
  revalidatePath("/admin");
  return { ok: true, message: "EchonX reading recommendation updated." };
}
