import type { Metadata } from "next";
import { getGuides } from "@/lib/data";
import { Editor } from "./editor";

export const metadata: Metadata = { title: "Content Editor", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function EditorPage() {
  const guides = (await getGuides()).map((g) => ({ slug: g.slug, title: g.title, excerpt: g.excerpt, body: g.body }));
  return <Editor guides={guides} />;
}
