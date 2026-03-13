import type { SupabaseClient } from "@supabase/supabase-js";

type ClientInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  preferredContactMethod?: string | null;
  city?: string | null;
  state?: string | null;
  source?: string | null;
};

type ActivityInput = {
  entityType: "client" | "inquiry" | "contract" | "payment";
  entityId: string;
  action: string;
  summary?: string | null;
  metadata?: Record<string, unknown>;
  actorId?: string | null;
};

export async function upsertClientByEmail(
  supabase: SupabaseClient,
  input: ClientInput
) {
  const email = input.email.trim().toLowerCase();

  const { data: existing, error: lookupError } = await supabase
    .from("clients")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("clients")
      .update({
        first_name: input.firstName,
        last_name: input.lastName,
        phone: input.phone ?? null,
        preferred_contact_method: input.preferredContactMethod ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        source: input.source ?? null,
      })
      .eq("id", existing.id)
      .select("id")
      .single();

    if (updateError || !updated) {
      throw new Error(updateError?.message || "Failed to update client");
    }

    return updated;
  }

  const { data: created, error: insertError } = await supabase
    .from("clients")
    .insert({
      first_name: input.firstName,
      last_name: input.lastName,
      email,
      phone: input.phone ?? null,
      preferred_contact_method: input.preferredContactMethod ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      source: input.source ?? null,
    })
    .select("id")
    .single();

  if (insertError || !created) {
    throw new Error(insertError?.message || "Failed to create client");
  }

  return created;
}

export async function logActivity(
  supabase: SupabaseClient,
  input: ActivityInput
) {
  const { error } = await supabase.from("activity_log").insert({
    actor_id: input.actorId ?? null,
    entity_type: input.entityType,
    entity_id: input.entityId,
    action: input.action,
    summary: input.summary ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("Failed to write activity log:", error.message);
  }
}
