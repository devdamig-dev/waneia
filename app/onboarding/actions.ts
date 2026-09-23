"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42);
}

export async function createWorkspace(formData: FormData) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) redirect("/login");

  const userId = String(claimsData.claims.sub);
  const email = typeof claimsData.claims.email === "string" ? claimsData.claims.email : null;
  const name = String(formData.get("name") || "").trim();
  const industry = String(formData.get("industry") || "").trim();
  const fullName = String(formData.get("fullName") || "").trim();

  if (!name) redirect("/onboarding?error=business");

  const slug = `${slugify(name) || "negocio"}-${userId.slice(0, 8)}`;

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert({
      name,
      slug,
      industry: industry || null,
      created_by: userId,
    })
    .select("id")
    .single();

  if (workspaceError || !workspace) redirect("/onboarding?error=workspace");

  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: userId,
    role: "owner",
    full_name: fullName || (typeof claimsData.claims.user_metadata === "object" && claimsData.claims.user_metadata && "full_name" in claimsData.claims.user_metadata
      ? String((claimsData.claims.user_metadata as { full_name?: string }).full_name || "")
      : null),
    email,
  });

  if (memberError) {
    await supabase.from("workspaces").delete().eq("id", workspace.id);
    redirect("/onboarding?error=member");
  }

  await supabase.from("automations").insert([
    {
      workspace_id: workspace.id,
      name: "Sin respuesta 15 min",
      description: "Avisa al equipo cuando una conversación queda esperando.",
      status: "borrador",
      category: "consulta",
      trigger_type: "sin respuesta",
      trigger_value: { value: "15 minutos" },
      actions: [
        { id: "notify", type: "notificar equipo", value: "Supervisor comercial" },
        { id: "task", type: "crear tarea", value: "Retomar conversación" },
      ],
    },
    {
      workspace_id: workspace.id,
      name: "Seguimiento de presupuesto",
      description: "Retoma automáticamente presupuestos sin respuesta.",
      status: "borrador",
      category: "presupuesto",
      trigger_type: "sin respuesta",
      trigger_value: { value: "48 horas después de cotizar" },
      actions: [
        { id: "task", type: "crear tarea", value: "Retomar presupuesto" },
        { id: "reply", type: "responder", value: "Mensaje de seguimiento" },
      ],
      response_message: "Hola, ¿pudiste revisar el presupuesto? Si querés, te ayudo con cualquier duda.",
    },
    {
      workspace_id: workspace.id,
      name: "Fuera de horario",
      description: "Responde y deja la consulta lista para el equipo.",
      status: "borrador",
      category: "consulta",
      trigger_type: "horario",
      trigger_value: { value: "Fuera del horario comercial" },
      actions: [
        { id: "reply", type: "responder", value: "Mensaje fuera de horario" },
        { id: "task", type: "crear tarea", value: "Responder al iniciar la jornada" },
      ],
      response_message: "Recibimos tu mensaje. Estamos fuera de horario y te respondemos apenas volvamos.",
    },
  ]);

  redirect("/dashboard");
}
