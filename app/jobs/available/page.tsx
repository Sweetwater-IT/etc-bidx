import { JobPageContent } from "../_components/JobPageContent";
import { JobsPageShell } from "../_components/JobsPageShell";

export default function AvailableJobsPage() {
  return (
    <JobsPageShell showTitleBlock={false}>
      <JobPageContent job="available" />
    </JobsPageShell>
  );
}
