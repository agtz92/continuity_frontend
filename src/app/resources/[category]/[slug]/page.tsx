import type { Metadata } from "next";
import {
  ResourceDetail,
  resourceMetadata,
  type ResourceRouteConfig,
} from "@/components/resources/ResourcePages";

export const revalidate = 600;

const CONFIG: ResourceRouteConfig = { locale: "en", basePath: "/resources" };

type Props = { params: Promise<{ category: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return resourceMetadata(CONFIG, slug);
}

export default async function ResourceDetailPage({ params }: Props) {
  const { category, slug } = await params;
  return ResourceDetail(CONFIG, category, slug);
}
