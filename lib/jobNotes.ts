export type JobTimelineNote = {
  id: string;
  text: string;
  timestamp: number;
  user_email?: string;
};

type StoredJobNotesPayload = {
  contractNotes?: string;
  projectLog?: JobTimelineNote[];
};

function isTimelineNote(value: unknown): value is JobTimelineNote {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.text === "string" && typeof candidate.timestamp === "number";
}

export function parseJobNotes(raw: string | null | undefined): {
  contractNotes: string;
  projectLog: JobTimelineNote[];
} {
  if (!raw) {
    return { contractNotes: "", projectLog: [] };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (Array.isArray(parsed)) {
      const projectLog = parsed.filter(isTimelineNote);
      return { contractNotes: "", projectLog };
    }

    if (parsed && typeof parsed === "object") {
      const payload = parsed as StoredJobNotesPayload;
      const projectLog = Array.isArray(payload.projectLog)
        ? payload.projectLog.filter(isTimelineNote)
        : [];
      return {
        contractNotes: typeof payload.contractNotes === "string" ? payload.contractNotes : "",
        projectLog,
      };
    }
  } catch {
    // Legacy plain-text notes fall through below.
  }

  return {
    contractNotes: raw,
    projectLog: [],
  };
}

export function stringifyJobNotes(contractNotes: string, projectLog: JobTimelineNote[]): string {
  return JSON.stringify({
    contractNotes,
    projectLog,
  });
}
