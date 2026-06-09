import type { Metadata } from "next";
import {
  ResourcesHub,
  hubMetadata,
  type ResourceRouteConfig,
} from "@/components/resources/ResourcePages";

export const revalidate = 600;

const CONFIG: ResourceRouteConfig = { locale: "en", basePath: "/resources" };

export const metadata: Metadata = hubMetadata(CONFIG);

export default function ResourcesIndexPage() {
  return ResourcesHub(CONFIG);
}
