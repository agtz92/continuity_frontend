import type { Metadata } from "next";
import {
  ResourcesCategory,
  categoryMetadata,
  type ResourceRouteConfig,
} from "@/components/resources/ResourcePages";

export const revalidate = 600;

const CONFIG: ResourceRouteConfig = { locale: "es", basePath: "/recursos" };

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  return categoryMetadata(CONFIG, category);
}

export default async function RecursosCategoryPage({ params }: Props) {
  const { category } = await params;
  return ResourcesCategory(CONFIG, category);
}
