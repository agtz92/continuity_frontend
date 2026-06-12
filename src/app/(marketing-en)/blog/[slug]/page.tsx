import type { Metadata } from "next";
import BlogPost, { blogPostMetadata } from "@/components/marketing/BlogPost";

export const revalidate = 600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return blogPostMetadata("en", slug);
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <BlogPost locale="en" slug={slug} />;
}
