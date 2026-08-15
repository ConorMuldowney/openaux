import { redirect } from "next/navigation";
import { NewShowcaseForm } from "@/components/showcases/new-showcase-form";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { auth0 } from "@/src/auth/auth0";

export default async function NewShowcasePage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <StandardPageLayout
      eyebrow="Showcases"
      title="Create New Showcase"
      description="Configure the settings and schedule for your new showcase."
    >
      <NewShowcaseForm alwaysOpen />
    </StandardPageLayout>
  );
}