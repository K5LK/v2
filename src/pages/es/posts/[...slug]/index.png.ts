import { getCollection, type CollectionEntry } from "astro:content";
import { getPath } from "@/utils/getPath";
import { SITE } from "@/config";

export { GET } from "../../../posts/[...slug]/index.png";

export async function getStaticPaths() {
  if (!SITE.dynamicOgImage) {
    return [];
  }

  const posts = await getCollection("blog").then(p =>
    p.filter(
      ({ id, data }) => !data.draft && !data.ogImage && id.startsWith("es/")
    )
  );

  return posts.map(post => ({
    params: { slug: getPath(post.id, post.filePath, false) },
    props: post as CollectionEntry<"blog">,
  }));
}
