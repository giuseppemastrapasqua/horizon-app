import { readFile } from "node:fs/promises";
import path from "node:path";

import { getStorageConfig } from "@/lib/storage/storage-config";

export type ResolvedBillingIssuerLogo = {
  data: Uint8Array;
  contentType: "image/png" | "image/jpeg";
};

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const LOCAL_PREFIX = "/uploads/billing-issuers/";

export async function resolveBillingIssuerLogo(
  logoPath: string | null,
): Promise<ResolvedBillingIssuerLogo | null> {
  if (!logoPath) return null;

  const config = getStorageConfig();

  if (config.provider === "local") {
    return resolveLocalLogo(logoPath);
  }

  return resolveRemoteLogo(logoPath, config.url);
}

async function resolveLocalLogo(
  logoPath: string,
): Promise<ResolvedBillingIssuerLogo | null> {
  if (!logoPath.startsWith(LOCAL_PREFIX)) return null;

  const relativeKey = decodeURIComponent(
    logoPath.slice("/uploads/".length),
  );
  const root = path.join(process.cwd(), "public", "uploads");
  const absolutePath = path.resolve(root, ...relativeKey.split("/"));
  const relativePath = path.relative(root, absolutePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return null;
  }

  const contentType = contentTypeFromPath(absolutePath);
  if (!contentType) return null;

  try {
    const data = await readFile(absolutePath);
    if (data.byteLength > MAX_FILE_SIZE) return null;
    return { data: new Uint8Array(data), contentType };
  } catch {
    return null;
  }
}

async function resolveRemoteLogo(
  logoPath: string,
  storageUrl: string,
): Promise<ResolvedBillingIssuerLogo | null> {
  try {
    const logoUrl = new URL(logoPath);
    const allowedUrl = new URL(storageUrl);

    if (logoUrl.protocol !== "https:" || logoUrl.origin !== allowedUrl.origin) {
      return null;
    }

    const response = await fetch(logoUrl, { cache: "no-store" });
    if (!response.ok) return null;

    const contentType = normalizeContentType(
      response.headers.get("content-type"),
    );
    if (!contentType) return null;

    const data = new Uint8Array(await response.arrayBuffer());
    if (data.byteLength > MAX_FILE_SIZE) return null;

    return { data, contentType };
  } catch {
    return null;
  }
}

function contentTypeFromPath(
  value: string,
): ResolvedBillingIssuerLogo["contentType"] | null {
  const extension = path.extname(value).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  return null;
}

function normalizeContentType(
  value: string | null,
): ResolvedBillingIssuerLogo["contentType"] | null {
  const normalized = value?.split(";")[0]?.trim().toLowerCase();
  if (normalized === "image/png") return "image/png";
  if (normalized === "image/jpeg") return "image/jpeg";
  return null;
}
