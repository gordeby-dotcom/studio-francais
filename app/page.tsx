import { getRole } from "@/lib/access";
import { AccessForm } from "./access-form";
import { Tutor } from "./tutor";

export const dynamic = "force-dynamic";

export default async function Page() {
  return await getRole() ? <Tutor /> : <AccessForm />;
}
