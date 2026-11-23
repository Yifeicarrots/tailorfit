"use server";

import { z } from "zod";
import { callClaude } from "@/lib/claude";
import {
  selectExperiences,
  type SelectionOutcome,
} from "@/lib/pipeline/experienceSelector";
import { experienceLibrarySchema, type ExperienceLibrary } from "@/lib/types";

const jobDescriptionSchema = z.string().trim().min(1);

// Server Actions are reachable by direct POST, so the arguments are checked
// at runtime despite their types, before anything is sent to Claude. The
// library comes from the browser's storage, which the server can't read.
export async function selectExperiencesAction(
  library: ExperienceLibrary,
  jobDescription: string,
): Promise<SelectionOutcome> {
  const parsedLibrary = experienceLibrarySchema.safeParse(library);
  const parsedJob = jobDescriptionSchema.safeParse(jobDescription);
  if (!parsedLibrary.success || !parsedJob.success) {
    return { ok: false, error: "The library or job description is invalid" };
  }
  return selectExperiences(
    { library: parsedLibrary.data, jobDescription: parsedJob.data },
    callClaude,
  );
}
