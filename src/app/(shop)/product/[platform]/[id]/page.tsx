import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isPlatformId } from "@/config/platforms";
import { fallbackTo } from "@/lib/errors";
import { getLocation } from "@/lib/location.server";
import { getProduct } from "@/lib/quickcommerce/service";
import {
  ComparisonSection,
  ComparisonSkeleton,
  ProductBreadcrumb,
  ProductHero,
  ProductHeroSkeleton,
  type ProductRouteProps,
} from "./sections";

export async function generateMetadata({ params }: PageProps<"/product/[platform]/[id]">): Promise<Metadata> {
  const { platform, id } = await params;
  if (!isPlatformId(platform)) return {};
  const product = await getProduct(platform, decodeURIComponent(id), await getLocation()).catch(fallbackTo(null));
  if (!product) return { title: "Product" };
  return {
    title: `${product.name}${
      product.quantity && !product.name.includes(product.quantity) ? ` (${product.quantity})` : ""
    } — compare prices`,
    description: `Compare the price of ${product.name} across Blinkit, Zepto, Instamart, BigBasket, JioMart, DMart and Amazon.`,
    openGraph: product.image ? { images: [product.image] } : undefined,
  };
}

export default function ProductPage(props: PageProps<"/product/[platform]/[id]">) {
  const route: ProductRouteProps = {
    params: props.params.then(({ platform, id }) => {
      if (!isPlatformId(platform)) notFound();
      return { platform, id: decodeURIComponent(id) };
    }),
    searchParams: props.searchParams.then(({ q }) => ({ q: typeof q === "string" ? q : undefined })),
  };

  return (
    <div className="container-page space-y-10 py-6 sm:py-8">
      <div className="space-y-6">
        <Suspense fallback={<div className="h-5 w-72 animate-pulse rounded bg-muted" />}>
          <ProductBreadcrumb {...route} />
        </Suspense>
        <Suspense fallback={<ProductHeroSkeleton />}>
          <ProductHero {...route} />
        </Suspense>
      </div>
      <Suspense fallback={<ComparisonSkeleton />}>
        <ComparisonSection {...route} />
      </Suspense>
    </div>
  );
}
