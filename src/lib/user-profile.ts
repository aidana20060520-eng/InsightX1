import { getSupabaseAdmin } from "./supabase-admin";

/**
 * User-supplied profile that personalizes AI responses. All fields optional.
 *
 * `preferredTone` adjusts how the AI talks (friendly / concise / professional).
 * `about` and `goals` are pure free-form text the user can use to tell the AI
 * anything they want it to remember.
 */
export interface UserProfile {
  userId: string;
  displayName: string | null;
  role: string | null;
  about: string | null;
  goals: string | null;
  preferredTone: "friendly" | "concise" | "professional";
}

const EMPTY_PROFILE = (userId: string): UserProfile => ({
  userId,
  displayName: null,
  role: null,
  about: null,
  goals: null,
  preferredTone: "friendly",
});

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  role: string | null;
  about: string | null;
  goals: string | null;
  preferred_tone: string | null;
}

function rowToProfile(row: ProfileRow | null, userId: string): UserProfile {
  if (!row) return EMPTY_PROFILE(userId);
  return {
    userId: row.user_id,
    displayName: row.display_name,
    role: row.role,
    about: row.about,
    goals: row.goals,
    preferredTone:
      row.preferred_tone === "concise" || row.preferred_tone === "professional"
        ? row.preferred_tone
        : "friendly",
  };
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("user_id, display_name, role, about, goals, preferred_tone")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[user-profile] getUserProfile error:", error);
    return EMPTY_PROFILE(userId);
  }
  return rowToProfile(data as ProfileRow | null, userId);
}

export interface ProfileInput {
  displayName?: string | null;
  role?: string | null;
  about?: string | null;
  goals?: string | null;
  preferredTone?: UserProfile["preferredTone"];
}

const MAX_LEN = {
  displayName: 80,
  role: 80,
  about: 1000,
  goals: 1000,
};

function clean(value: string | null | undefined, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

export async function upsertUserProfile(
  userId: string,
  input: ProfileInput
): Promise<UserProfile> {
  const supabase = getSupabaseAdmin();

  const tone =
    input.preferredTone === "concise" ||
    input.preferredTone === "professional" ||
    input.preferredTone === "friendly"
      ? input.preferredTone
      : "friendly";

  const payload = {
    user_id: userId,
    display_name: clean(input.displayName, MAX_LEN.displayName),
    role: clean(input.role, MAX_LEN.role),
    about: clean(input.about, MAX_LEN.about),
    goals: clean(input.goals, MAX_LEN.goals),
    preferred_tone: tone,
  };

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("user_id, display_name, role, about, goals, preferred_tone")
    .single();

  if (error) throw new Error(`Failed to save profile: ${error.message}`);
  return rowToProfile(data as ProfileRow, userId);
}

/**
 * Build a short personalization snippet to inject into the LLM system prompt.
 * Returns an empty string if the user hasn't filled out their profile, so the
 * AI gets nothing extra rather than placeholder text.
 */
export function profileToPromptSnippet(profile: UserProfile): string {
  const lines: string[] = [];
  if (profile.displayName) lines.push(`Name: ${profile.displayName}`);
  if (profile.role) lines.push(`Role: ${profile.role}`);
  if (profile.about) lines.push(`About them: ${profile.about}`);
  if (profile.goals) lines.push(`Goals: ${profile.goals}`);

  const toneInstruction = {
    friendly: "Keep your tone warm and friendly.",
    concise: "Keep your tone tight and to the point. No fluff.",
    professional: "Keep your tone polished and professional.",
  }[profile.preferredTone];

  if (lines.length === 0) {
    return `Tone preference: ${toneInstruction}`;
  }
  return [
    "ABOUT THE USER (use this to personalize answers):",
    ...lines,
    `Tone preference: ${toneInstruction}`,
  ].join("\n");
}
