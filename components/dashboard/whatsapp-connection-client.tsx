"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  MessageCircleMore,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Webhook,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Toast } from "@/components/ui/toast";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_URL } from "@/lib/supabase/config";

type AccountState = {
  phone_number_id: string;
  waba_id: string | null;
  display_phone_number: string | null;
  verified_name: string | null;
  status: string;
  webhook_subscribed: boolean;
} | null;

function createVerifyToken() {
  if (typeof crypto === "undefined") return `waneia_${Date.now().toString(36)}`;
  const values = new Uint32Array(4);
  crypto.getRandomValues(values);
  return `waneia_${Array.from(values).map((value) => value.toString(36)).join("")}`;
}

export function WhatsappConnectionClient() {
  const { activeWorkspaceId, activeWorkspace, refreshWorkspaces } = useWorkspace();
  const supabase = useMemo(() => createClient(), []);
  const webhookUrl = `${SUPABASE_URL}/functions/v1/whatsapp-webhook`;

  const [account, setAccount] = useState<AccountState>(null);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [displayPhone, setDisplayPhone] = useState("");
  const [verifiedName, setVerifiedName] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const loadAccount = async () => {
    if (!activeWorkspaceId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("whatsapp_accounts")
      .select("phone_number_id,waba_id,display_phone_number,verified_name,status,webhook_subscribed")
      .eq("workspace_id", activeWorkspaceId)
      .maybeSingle();

    if (error) {
      setToast(error.message);
      setLoading(false);
      return;
    }

    setAccount(data);
    if (data) {
      setPhoneNumberId(data.phone_number_id);
      setWabaId(data.waba_id ?? "");
      setDisplayPhone(data.display_phone_number ?? "");
      setVerifiedName(data.verified_name ?? "");
    }
    if (!verifyToken) setVerifyToken(createVerifyToken());
    setLoading(false);
  };

  useEffect(() => {
    setAccount(null);
    setPhoneNumberId("");
    setWabaId("");
    setDisplayPhone("");
    setVerifiedName("");
    setVerifyToken(createVerifyToken());
    setAppSecret("");
    setAccessToken("");
    void loadAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId]);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setToast(`${label} copiado.`);
    } catch {
      setToast("No se pudo copiar automáticamente.");
    }
  };

  const saveConnection = async () => {
    if (!activeWorkspaceId) return;
    if (!phoneNumberId.trim() || !verifyToken.trim() || !appSecret.trim() || !accessToken.trim()) {
      setToast("Completá Phone Number ID, Verify Token, App Secret y Access Token.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.rpc("configure_whatsapp_credentials", {
      p_workspace_id: activeWorkspaceId,
      p_phone_number_id: phoneNumberId.trim(),
      p_waba_id: wabaId.trim(),
      p_display_phone_number: displayPhone.trim(),
      p_verified_name: verifiedName.trim(),
      p_verify_token: verifyToken.trim(),
      p_app_secret: appSecret.trim(),
      p_access_token: accessToken.trim(),
    });

    if (error) {
      setToast(error.message);
      setSaving(false);
      return;
    }

    setAppSecret("");
    setAccessToken("");
    setToast("Credenciales guardadas. Ahora validá el webhook en Meta.");
    await loadAccount();
    await refreshWorkspaces();
    setSaving(false);
  };

  const connected = account?.status === "connected" && account.webhook_subscribed;

  return (
    <>
      <div className="space-y-4">
        <Card className={`p-5 ${connected ? "border-emerald-300/25 bg-emerald-500/5" : "border-amber-300/20 bg-amber-500/5"}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${connected ? "border-emerald-300/20 bg-emerald-500/10" : "border-amber-300/20 bg-amber-500/10"}`}>
                {connected ? <CheckCircle2 className="h-5 w-5 text-emerald-200" /> : <Smartphone className="h-5 w-5 text-amber-200" />}
              </span>
              <div>
                <p className="font-semibold">{connected ? "WhatsApp conectado" : "WhatsApp pendiente de conexión"}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {connected
                    ? "Los mensajes entrantes llegan al Inbox y las respuestas salen por Meta Cloud API."
                    : "Guardá las credenciales y validá el webhook desde Meta Business."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {account ? (
                <span className={`rounded-full border px-2.5 py-1 text-[11px] ${connected ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-100" : "border-amber-300/30 bg-amber-500/10 text-amber-100"}`}>
                  {connected ? "Conectado" : "Pendiente"}
                </span>
              ) : null}
              <Button onClick={() => void loadAccount()} disabled={loading}>
                <RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-200" />
              <div>
                <p className="font-semibold">1. Credenciales de Meta</p>
                <p className="text-xs text-zinc-500">Se guardan en una tabla privada; Waneia nunca vuelve a mostrar los secretos.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <FormField label="Phone Number ID" hint="ID numérico del teléfono en WhatsApp API Setup.">
                <input
                  value={phoneNumberId}
                  onChange={(event) => setPhoneNumberId(event.target.value)}
                  placeholder="123456789012345"
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm"
                />
              </FormField>
              <FormField label="WhatsApp Business Account ID">
                <input
                  value={wabaId}
                  onChange={(event) => setWabaId(event.target.value)}
                  placeholder="WABA ID"
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm"
                />
              </FormField>
              <FormField label="Número visible" hint="Sólo para mostrarlo en Waneia.">
                <input
                  value={displayPhone}
                  onChange={(event) => setDisplayPhone(event.target.value)}
                  placeholder="+54 11 ..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm"
                />
              </FormField>
              <FormField label="Nombre verificado">
                <input
                  value={verifiedName}
                  onChange={(event) => setVerifiedName(event.target.value)}
                  placeholder={activeWorkspace.name}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm"
                />
              </FormField>
            </div>

            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                <KeyRound className="h-3.5 w-3.5 text-violet-200" />
                Secretos
              </p>
              <div className="mt-3 space-y-3">
                <FormField label="Meta App Secret" hint={account ? "Dejalo vacío si no querés reemplazarlo. Para reconfigurar, cargalo nuevamente junto con el token." : "Configuración de tu Meta App."}>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={appSecret}
                    onChange={(event) => setAppSecret(event.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm"
                  />
                </FormField>
                <FormField label="Access Token permanente" hint="Usá un System User token con permisos de WhatsApp, no el token temporal de prueba.">
                  <textarea
                    value={accessToken}
                    onChange={(event) => setAccessToken(event.target.value)}
                    placeholder="EAAG..."
                    className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-2.5 font-mono text-xs"
                  />
                </FormField>
              </div>
            </div>

            <Button onClick={saveConnection} disabled={saving} className="mt-4 w-full bg-emerald-500/30 hover:bg-emerald-500/40">
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-1 h-4 w-4" />}
              Guardar conexión
            </Button>
          </Card>

          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Webhook className="h-4 w-4 text-emerald-200" />
                <div>
                  <p className="font-semibold">2. Webhook en Meta</p>
                  <p className="text-xs text-zinc-500">Configurá estos dos valores en WhatsApp → Configuration → Webhooks.</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <FormField label="Callback URL">
                  <div className="flex gap-2">
                    <input readOnly value={webhookUrl} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 p-2.5 font-mono text-[11px]" />
                    <Button onClick={() => void copy(webhookUrl, "Callback URL")}><Copy className="h-4 w-4" /></Button>
                  </div>
                </FormField>
                <FormField label="Verify Token" hint="Copialo antes de guardar. Si necesitás cambiarlo, generá otro y guardá de nuevo la conexión.">
                  <div className="flex gap-2">
                    <input
                      value={verifyToken}
                      onChange={(event) => setVerifyToken(event.target.value)}
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 p-2.5 font-mono text-[11px]"
                    />
                    <Button onClick={() => void copy(verifyToken, "Verify Token")}><Copy className="h-4 w-4" /></Button>
                  </div>
                </FormField>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-zinc-400">
                Suscribí el campo <span className="font-mono text-zinc-200">messages</span>. El endpoint valida automáticamente la firma <span className="font-mono text-zinc-200">X-Hub-Signature-256</span> usando tu App Secret.
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2">
                <MessageCircleMore className="h-4 w-4 text-cyan-200" />
                <div>
                  <p className="font-semibold">3. Prueba real</p>
                  <p className="text-xs text-zinc-500">No hay mensaje mock: la prueba usa el número de Meta.</p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                <p>1. Validá Callback URL + Verify Token en Meta.</p>
                <p>2. Suscribí <span className="font-mono">messages</span>.</p>
                <p>3. Mandá “Hola” desde un celular al número conectado.</p>
                <p>4. La conversación aparece en Inbox en tiempo real.</p>
                <p>5. Respondé desde Waneia: el envío sale por Cloud API y se guarda el estado enviado/entregado/leído.</p>
              </div>

              <div className={`mt-4 rounded-xl border p-3 text-xs ${connected ? "border-emerald-300/20 bg-emerald-500/5 text-emerald-100" : "border-amber-300/20 bg-amber-500/5 text-amber-100"}`}>
                {connected
                  ? "Webhook validado. Ya podés hacer la prueba end-to-end."
                  : account
                    ? "Credenciales guardadas. Falta que Meta valide el webhook."
                    : "Todavía no hay credenciales guardadas para este workspace."}
              </div>
            </Card>
          </div>
        </div>

        {account ? (
          <Card className="p-5">
            <p className="text-sm font-semibold">Conexión guardada</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div><p className="text-[10px] uppercase text-zinc-500">Phone Number ID</p><p className="mt-1 text-sm">{account.phone_number_id}</p></div>
              <div><p className="text-[10px] uppercase text-zinc-500">Número</p><p className="mt-1 text-sm">{account.display_phone_number || "—"}</p></div>
              <div><p className="text-[10px] uppercase text-zinc-500">Nombre</p><p className="mt-1 text-sm">{account.verified_name || "—"}</p></div>
              <div><p className="text-[10px] uppercase text-zinc-500">Webhook</p><p className="mt-1 text-sm">{account.webhook_subscribed ? "Validado" : "Pendiente"}</p></div>
            </div>
          </Card>
        ) : null}
      </div>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
