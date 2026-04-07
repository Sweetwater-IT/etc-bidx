import { JobPageContent } from "../_components/JobPageContent";
import { JobsPageShell } from "../_components/JobsPageShell";

export default function ActiveJobsPage() {
  return (
    <JobsPageShell>
      <JobPageContent job="active-jobs" />
    </JobsPageShell>
  );
}
