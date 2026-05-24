import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import { getEventProjectByInquiryId } from "@/lib/event-projects";
import { supabaseAdmin } from "@/lib/supabase/admin-client";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi("crm");
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const action = typeof body.action === "string" ? body.action : "complete";
    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (action !== "complete") {
      return NextResponse.json(
        { error: "Unsupported follow-up action." },
        { status: 400 }
      );
    }

    const { data: task, error: lookupError } = await supabaseAdmin
      .from("crm_follow_up_tasks")
      .select("id, inquiry_id, client_id, title, detail, task_kind, status")
      .eq("id", id)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }

    if (!task) {
      return NextResponse.json(
        { error: "Follow-up task not found." },
        { status: 404 }
      );
    }

    if (task.status === "completed") {
      return NextResponse.json({ success: true, status: "completed" });
    }

    const completedAt = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("crm_follow_up_tasks")
      .update({
        status: "completed",
        completed_at: completedAt,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const project = await getEventProjectByInquiryId(
      supabaseAdmin,
      task.inquiry_id
    );
    const summary = note
      ? `Completed follow-up: ${task.title}. ${note}`
      : `Completed follow-up: ${task.title}.`;
    const metadata = {
      task_id: task.id,
      task_kind: task.task_kind,
      inquiry_id: task.inquiry_id,
      client_id: task.client_id,
      note: note || null,
      completed_at: completedAt,
    };

    await logActivity(supabaseAdmin, {
      entityType: project?.id ? "event_project" : "inquiry",
      entityId: project?.id ?? task.inquiry_id,
      actorId: auth.user?.id ?? null,
      action: "follow_up.completed",
      summary,
      metadata: project?.id ? { ...metadata, event_project_id: project.id } : metadata,
    });

    if (project?.id) {
      await logActivity(supabaseAdmin, {
        entityType: "inquiry",
        entityId: task.inquiry_id,
        actorId: auth.user?.id ?? null,
        action: "follow_up.completed",
        summary,
        metadata: { ...metadata, event_project_id: project.id },
      });
    }

    return NextResponse.json({
      success: true,
      status: "completed",
      completed_at: completedAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to complete follow-up task.",
      },
      { status: 500 }
    );
  }
}
