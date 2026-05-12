import { prisma } from "@/lib/prisma";
import { ExportsClient } from "./exports-client";

export default async function ExportsPage() {
  const [products, causes, categories, sources] = await Promise.all([
    prisma.review.findMany({
      distinct: ["product"],
      where: { product: { not: null } },
      orderBy: { product: "asc" },
      select: { product: true },
    }),
    prisma.prediction.findMany({
      distinct: ["primaryCause"],
      orderBy: { primaryCause: "asc" },
      select: { primaryCause: true },
    }),
    prisma.review.findMany({
      distinct: ["category"],
      orderBy: { category: "asc" },
      select: { category: true },
    }),
    prisma.review.findMany({
      distinct: ["source"],
      where: { source: { not: null } },
      orderBy: { source: "asc" },
      select: { source: true },
    }),
  ]);

  return (
    <ExportsClient
      filterOptions={{
        products: products.map((item) => item.product).filter(Boolean) as string[],
        causes: causes.map((item) => item.primaryCause),
        categories: categories.map((item) => item.category),
        sources: sources.map((item) => item.source).filter(Boolean) as string[],
      }}
    />
  );
}
