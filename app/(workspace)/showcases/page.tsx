import { redirect } from "next/navigation";
import { ShowcasesPageContent } from "@/components/showcases/showcases-page-content";
import { getShowcasesPageData } from "@/src/api/showcases-page";
import { toShowcaseCardViewModels } from "@/src/modules/showcases/public";

export default async function ShowcasesPage() {
  const showcasesPageData = await getShowcasesPageData();

  if (!showcasesPageData) {
    redirect("/");
  }

  const showcaseCards = toShowcaseCardViewModels(
    showcasesPageData.showcases,
    showcasesPageData.userId,
  );

  return <ShowcasesPageContent showcases={showcaseCards} />;
}
