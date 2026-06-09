import type { Metadata } from "next";
import {
  ResourcesHub,
  hubMetadata,
  type ResourceRouteConfig,
} from "@/components/resources/ResourcePages";

export const revalidate = 600;

const CONFIG: ResourceRouteConfig = { locale: "es", basePath: "/recursos" };

export const metadata: Metadata = hubMetadata(CONFIG);

export default async function RecursosIndexPage() {
  return ResourcesHub(CONFIG);
}
