import { JobPageContent } from "../_components/JobPageContent";
import { JobsPageShell } from "../_components/JobsPageShell";

export default function ActiveBidsPage() {
  return (
    <JobsPageShell showTitleBlock={false}>
      <JobPageContent job="active-bids" />
    </JobsPageShell>
  );
}
