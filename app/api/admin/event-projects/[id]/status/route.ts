import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { logActivity } from "@/lib/crm";
import {
  getEventProjectById,
  getEventProjectByInquiryId,
  syncEventProjectLifecycleForInquiryId,
} from "@/lib/event-projects";
import {
  EVENT_PROJECT_STATUSES,
  humanizeEventProjectStatus,
  normalizeEventProjectStatus,
} from "@/lib/project-lifecycle";
import { supabaseAdmin } from "@/lib/supabase/admin-client";
import { syncInquiryWorkflowStage } from "@/lib/workflow-write";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi("operations");
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const nextStatus = normalizeEventProjectStatus(body.status);

    if (!nextStatus) {
      return NextResponse.json(
        {
          error: "Valid project status is required",
          allowed_statuses: EVENT_PROJECT_STATUSES,
        },
        { status: 400 }
      );
    }

    const existingProject =
      (await getEventProjectById(supabaseAdmin, id)) ??
      (await getEventProjectByInquiryId(supabaseAdmin, id));

    const inquiryId = existingProject?.inquiry_id ?? id;
    const previousStatus = existingProject?.status ?? null;
    const synced = await syncEventProjectLifecycleForInquiryId(
      supabaseAdmin,
      inquiryId,
      { explicitStatus: nextStatus }
    );

    if (!synced.projectId) {
      return NextResponse.json(
        { error: "Event project not found or not linked to an inquiry yet" },
        { status: 404 }
      );
    }

    await logActivity(supabaseAdmin, {
      entityType: "event_project",
      entityId: synced.projectId,
      actorId: auth.user?.id ?? null,
      action: "event_project.status_updated",
      summary: `Project status changed from ${humanizeEventProjectStatus(previousStatus)} to ${humanizeEventProjectStatus(nextStatus)}`,
      metadata: {
        previous_status: previousStatus,
        next_status: nextStatus,
        inquiry_id: inquiryId,
      },
    });

    await syncInquiryWorkflowStage(supabaseAdmin, {
      inquiryId,
      actorId: auth.user?.id ?? null,
      sourceAction: "event_project.status_updated",
      note: `Project status updated to ${humanizeEventProjectStatus(nextStatus)}`,
      metadata: {
        previous_status: previousStatus,
        next_status: nextStatus,
        event_project_id: synced.projectId,
      },
    });

    return NextResponse.json({
      success: true,
      project_id: synced.projectId,
      inquiry_id: inquiryId,
      status: nextStatus,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update project status",
      },
      { status: 500 }
    );
  }
}
