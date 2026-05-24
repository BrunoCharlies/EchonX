"use server";

import { revalidatePath } from "next/cache";

/** Invalidates the Explore feed server payload before a client router.refresh(). */
export async function refreshExploreFeed() {
  revalidatePath("/app/explore");
}
