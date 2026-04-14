import { BillingClient } from "@/components/dashboard/billing-client";

export default function FacturacionPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Facturación</h2>
      <p className="text-zinc-400">Plan actual, consumo y visión comercial de upgrade.</p>
      <BillingClient />
    </section>
  );
}
