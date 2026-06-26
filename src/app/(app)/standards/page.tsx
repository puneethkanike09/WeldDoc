import { requireSession } from "@/lib/auth";
import { StandardsHub } from "@/components/standards/standards-hub";

export default async function StandardsPage() {
  const { profile, email } = await requireSession();
  const userName = profile.full_name || email || "Engineer";

  return <StandardsHub userName={userName} />;
}
