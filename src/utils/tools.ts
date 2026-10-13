import type { ImageMetadata } from "astro";

const toolCoverImages = import.meta.glob<ImageMetadata>(
  "/src/data/tools/**/*.{jpg,jpeg,png,webp,avif,gif,svg}",
  { eager: true, import: "default" }
);
const toolCoverImagesByPath = new Map(
  Object.entries(toolCoverImages).map(([path, image]) => [
    path.toLocaleLowerCase(),
    image,
  ])
);

const warnAboutCover = (message: string) => {
  // Missing optional covers should fall back visually but remain visible to the author.
  // eslint-disable-next-line no-console
  console.warn(message);
};

export const getToolSlug = (id: string) =>
  id.replace(/\/(en|es)(?:\.(md|mdx))?$/, "").replace(/\.(md|mdx)$/, "");

export const isToolEntryForLocale = (id: string, locale: string) =>
  id.endsWith(`/${locale}`) ||
  id.endsWith(`/${locale}.md`) ||
  id.endsWith(`/${locale}.mdx`);

export const getToolCoverImage = (
  id: string,
  coverImagePath?: string
): ImageMetadata | string | undefined => {
  if (!coverImagePath) return undefined;
  if (/^https?:\/\//i.test(coverImagePath)) return coverImagePath;

  const relativePath = coverImagePath
    .replaceAll("\\", "/")
    .replace(/^\.\/+/, "");
  if (relativePath.startsWith("/") || relativePath.split("/").includes("..")) {
    warnAboutCover(
      `[tools] Invalid coverImage path "${coverImagePath}" for "${id}".`
    );
    return undefined;
  }

  const image = toolCoverImagesByPath.get(
    `/src/data/tools/${getToolSlug(id)}/${relativePath}`.toLocaleLowerCase()
  );
  if (!image) {
    warnAboutCover(
      `[tools] Cover image "${coverImagePath}" for "${id}" was not found; using the text fallback.`
    );
  }
  return image;
};
