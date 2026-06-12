import type { Metadata } from "next";
import CmsPage, { cmsPageMetadata } from "@/components/marketing/CmsPage";

export const revalidate = 600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return cmsPageMetadata("es", slug);
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <CmsPage locale="es" slug={slug} />;
}
