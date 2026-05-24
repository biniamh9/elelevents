const { createClient } = require("@supabase/supabase-js");
const { createServerClient } = require("@supabase/ssr");

const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:3001";
const QA_EMAIL = process.env.QA_ADMIN_EMAIL || "qa-admin@elelevents.local";
const QA_PASSWORD = process.env.QA_ADMIN_PASSWORD || "QA-Admin-2026!";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getAdminCookieHeader() {
  const cookies = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookies;
        },
        setAll(nextCookies) {
          for (const cookie of nextCookies) {
            const index = cookies.findIndex((item) => item.name === cookie.name);
            if (index >= 0) cookies[index] = cookie;
            else cookies.push(cookie);
          }
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email: QA_EMAIL,
    password: QA_PASSWORD,
  });

  if (error || !data.user) {
    throw new Error(`Admin sign-in failed: ${error?.message || "No user"}`);
  }

  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

async function assertPageContains(path, cookieHeader, labels) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { cookie: cookieHeader },
  });
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}: ${body.slice(0, 240)}`);
  }

  for (const label of labels) {
    if (!body.includes(label)) {
      throw new Error(`${path} did not render expected label: ${label}`);
    }
  }
}

async function run() {
  const cookieHeader = await getAdminCookieHeader();
  const { data: inquiry, error: inquiryError } = await supabaseAdmin
    .from("event_inquiries")
    .select("id, client_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (inquiryError || !inquiry) {
    throw new Error(`Could not find inquiry for follow-up QA: ${inquiryError?.message || "none"}`);
  }

  const { data: project } = await supabaseAdmin
    .from("event_projects")
    .select("id")
    .eq("inquiry_id", inquiry.id)
    .maybeSingle();

  const title = `QA follow-up completion ${Date.now()}`;
  const { data: task, error: taskError } = await supabaseAdmin
    .from("crm_follow_up_tasks")
    .insert({
      inquiry_id: inquiry.id,
      client_id: inquiry.client_id ?? null,
      title,
      detail: "Temporary QA task for inline completion verification.",
      task_kind: "general",
      status: "open",
      due_at: new Date(Date.now() - 60_000).toISOString(),
      owner_name: "QA Admin",
      source_action: "follow_up_detail_action_check",
      ...(project?.id ? { event_project_id: project.id } : {}),
    })
    .select("id")
    .single();

  if (taskError || !task) {
    throw new Error(`Could not create QA follow-up task: ${taskError?.message || "none"}`);
  }

  try {
    await assertPageContains(`/admin/inquiries/${inquiry.id}`, cookieHeader, [
      "Follow-Ups",
      "Follow-up tasks",
      title,
      "Mark Complete",
    ]);

    if (project?.id) {
      await assertPageContains(`/admin/events/projects/${project.id}`, cookieHeader, [
        "Follow-Ups",
        "Open owner tasks",
        title,
        "Mark Complete",
      ]);
    }

    const response = await fetch(`${BASE_URL}/api/admin/follow-up-tasks/${task.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: cookieHeader,
      },
      body: JSON.stringify({
        action: "complete",
        note: "QA verified inline follow-up completion.",
      }),
    });
    const payload = await response.json();

    if (!response.ok || payload.status !== "completed") {
      throw new Error(`Follow-up completion failed: ${JSON.stringify(payload)}`);
    }

    const { data: completed, error: completedError } = await supabaseAdmin
      .from("crm_follow_up_tasks")
      .select("status, completed_at")
      .eq("id", task.id)
      .single();

    if (completedError || completed?.status !== "completed" || !completed.completed_at) {
      throw new Error(`Task did not persist as completed: ${completedError?.message || JSON.stringify(completed)}`);
    }

    const { data: activities, error: activityError } = await supabaseAdmin
      .from("activity_log")
      .select("id, action, summary, metadata")
      .eq("action", "follow_up.completed")
      .contains("metadata", { task_id: task.id });

    if (activityError || !activities?.length) {
      throw new Error(`Activity log was not written: ${activityError?.message || "none"}`);
    }

    console.log(
      JSON.stringify(
        {
          result: "PASS",
          inquiry_id: inquiry.id,
          project_id: project?.id ?? null,
          task_id: task.id,
          activities: activities.length,
        },
        null,
        2
      )
    );

    await supabaseAdmin
      .from("activity_log")
      .delete()
      .contains("metadata", { task_id: task.id });
    await supabaseAdmin.from("crm_follow_up_tasks").delete().eq("id", task.id);
  } catch (error) {
    await supabaseAdmin
      .from("activity_log")
      .delete()
      .contains("metadata", { task_id: task.id });
    await supabaseAdmin.from("crm_follow_up_tasks").delete().eq("id", task.id);
    throw error;
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
