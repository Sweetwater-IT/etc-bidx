# Deferred Skill Spec: `etc-bidx-jobs-projects`

Reserve this skill ID for a future operational skill covering jobs and project workflows.

Do not promote this into `.codex/skills/` until the chat tool surface has executable support for job lookup and related operations. At minimum, that means `search_jobs` and `get_job` must no longer be `planned_not_executable`.

Intended future scope:

- Find jobs
- Load job details
- Answer job and project questions
- Expand later into schedules, inventory, equipment levels, and related operational workflows once those surfaces exist

Current reason for deferral:

- The repo registers job tools in `lib/chat/tools/index.ts`
- The executor treats them as unsupported because no action handlers are wired
- The current operational skill set should state this clearly rather than faking job results
