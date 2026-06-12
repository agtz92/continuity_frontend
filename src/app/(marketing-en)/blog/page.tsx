import type { Metadata } from "next";
import BlogIndex, { blogIndexMetadata } from "@/components/marketing/BlogIndex";

export const revalidate = 600;

export const metadata: Metadata = blogIndexMetadata("en");

export default function Page() {
  return <BlogIndex locale="en" />;
}
