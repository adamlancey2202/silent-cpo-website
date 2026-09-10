"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Mail,
  CreditCard,
  LogOut,
  ExternalLink,
  FileText,
  LayoutDashboard,
  RefreshCw,
  Layers,
} from "lucide-react";
import { PlatformPanel } from "@/components/admin/PlatformPanel";
import { RevenueCards } from "@/components/admin/RevenueCards";
import { formatMoney } from "@/lib/revenue";

type Tab = "overview" | "contacts" | "payments" | "platform";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  project: string;
  budget: string | null;
  message: string;
  status: string;
  createdAt: string;
}

interface PaymentLink {
  id: string;
  url: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  description: string | null;
  status: string;
  createdAt: string;
}

interface Invoice {
  id: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  status: string;
  hostedUrl: string | null;
  pdfUrl: string | null;
  createdAt: string;
}

interface Revenue {
  currency: string;
  received: number;
  pipeline: number;
  total: number;
  breakdown: {
    receivedInvoices: number;
    receivedLinks: number;
    pipelineInvoices: number;
    pipelineLinks: number;
  };
}

function statusColor(status: string) {
  switch (status.toLowerCase()) {
    case "paid":
      return "text-green";
    case "open":
    case "active":
      return "text-gold";
    case "draft":
      return "text-mist/60";
    case "void":
    case "uncollectible":
      return "text-red-400";
    default:
      return "text-mist/60";
  }
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [inputSecret, setInputSecret] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [counts, setCounts] = useState({ contacts: 0, openEnquiries: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("scpo_admin_token");
    if (saved) setToken(saved);
  }, []);

  const apiFetch = useCallback(
    async (url: string, options?: RequestInit) => {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.status === 401) {
        setToken(null);
        localStorage.removeItem("scpo_admin_token");
        throw new Error("Unauthorized");
      }
      return res;
    },
    [token]
  );

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/dashboard");
      const data = await res.json();
      setContacts(data.contacts);
      setPaymentLinks(data.paymentLinks);
      setInvoices(data.invoices);
      setRevenue(data.revenue);
      setCounts(data.counts);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [token, apiFetch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem("scpo_admin_token", inputSecret);
    setToken(inputSecret);
  }

  function logout() {
    localStorage.removeItem("scpo_admin_token");
    setToken(null);
  }

  async function createPaymentLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const amount = Math.round(parseFloat(form.get("amount") as string) * 100);

    const res = await apiFetch("/api/stripe/payment-link", {
      method: "POST",
      body: JSON.stringify({
        customerName: form.get("customerName"),
        customerEmail: form.get("customerEmail"),
        amount,
        description: form.get("description") || undefined,
      }),
    });

    if (res.ok) {
      e.currentTarget.reset();
      loadData();
    } else {
      const err = await res.json();
      alert(err.error ?? "Failed");
    }
  }

  async function createInvoice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const amount = Math.round(parseFloat(form.get("amount") as string) * 100);

    const res = await apiFetch("/api/stripe/invoice", {
      method: "POST",
      body: JSON.stringify({
        customerName: form.get("customerName"),
        customerEmail: form.get("customerEmail"),
        amount,
        description: form.get("description") || undefined,
        sendEmail: true,
      }),
    });

    if (res.ok) {
      e.currentTarget.reset();
      loadData();
    } else {
      const err = await res.json();
      alert(err.error ?? "Failed");
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-deep px-6">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-4 border border-mist/10 bg-midnight/50 p-8"
        >
          <h1 className="font-[family-name:var(--font-display)] text-2xl tracking-wider text-bone">
            SILENTCPO ADMIN
          </h1>
          <input
            type="password"
            value={inputSecret}
            onChange={(e) => setInputSecret(e.target.value)}
            placeholder="Admin secret"
            className="w-full border border-mist/10 bg-deep px-4 py-3 text-sm text-bone outline-none focus:border-gold/40"
          />
          <button
            type="submit"
            className="w-full bg-gold py-3 text-sm tracking-wider text-deep"
          >
            ENTER
          </button>
        </form>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Mail }[] = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "contacts", label: "Enquiries", icon: Mail },
    { id: "payments", label: "Stripe", icon: CreditCard },
    { id: "platform", label: "Platform", icon: Layers },
  ];

  const inputClass =
    "w-full border border-mist/10 bg-deep px-3 py-2 text-sm text-bone outline-none focus:border-gold/40";

  return (
    <div className="min-h-screen bg-deep text-bone">
      <header className="border-b border-mist/10 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-xl tracking-wider">
            SILENTCPO ADMIN
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 text-xs text-mist/60 hover:text-gold disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Sync
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-xs text-mist/60 hover:text-gold"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {revenue && (
          <div className="mb-8">
            <RevenueCards
              received={revenue.received}
              pipeline={revenue.pipeline}
              total={revenue.total}
              currency={revenue.currency}
              breakdown={revenue.breakdown}
            />
          </div>
        )}

        <nav className="mb-8 flex flex-wrap gap-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs tracking-wider transition ${
                tab === id
                  ? "bg-gold text-deep"
                  : "border border-mist/10 text-mist/60 hover:text-bone"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label.toUpperCase()}
              {id === "contacts" && counts.openEnquiries > 0 && (
                <span className="ml-1 rounded-full bg-green/20 px-1.5 text-[10px] text-green">
                  {counts.openEnquiries}
                </span>
              )}
            </button>
          ))}
        </nav>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        {tab === "overview" && revenue && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="border border-mist/10 bg-midnight/20 p-6">
              <h3 className="mb-4 text-xs tracking-wider text-gold">
                RECENT ENQUIRIES
              </h3>
              {contacts.length === 0 ? (
                <p className="text-sm text-mist/60">No enquiries yet.</p>
              ) : (
                contacts.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    className="mb-3 border-b border-mist/5 pb-3 last:border-0"
                  >
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-mist/60">
                      {c.project}
                      {c.budget && ` · ${c.budget}`}
                    </p>
                  </div>
                ))
              )}
            </section>

            <section className="border border-mist/10 bg-midnight/20 p-6">
              <h3 className="mb-4 text-xs tracking-wider text-gold">
                OUTSTANDING PAYMENTS
              </h3>
              {[...invoices, ...paymentLinks]
                .filter((item) => !["paid", "void"].includes(item.status))
                .slice(0, 5)
                .map((item) => (
                  <div
                    key={item.id}
                    className="mb-3 flex items-center justify-between border-b border-mist/5 pb-3 last:border-0"
                  >
                    <div>
                      <p className="text-sm">{item.customerName}</p>
                      <p className={`text-xs ${statusColor(item.status)}`}>
                        {item.status.toUpperCase()}
                      </p>
                    </div>
                    <p className="text-sm text-gold">
                      {formatMoney(item.amount, item.currency)}
                    </p>
                  </div>
                ))}
              {invoices.filter((i) => i.status !== "paid").length === 0 &&
                paymentLinks.filter((p) => p.status !== "paid").length === 0 && (
                  <p className="text-sm text-mist/60">Nothing outstanding.</p>
                )}
            </section>

            <section className="border border-mist/10 bg-midnight/20 p-6 lg:col-span-2">
              <h3 className="mb-4 text-xs tracking-wider text-gold">
                HOW TOTALS ARE CALCULATED
              </h3>
              <div className="grid gap-4 text-xs text-mist/60 sm:grid-cols-3">
                <p>
                  <strong className="text-bone">Received</strong> — Stripe
                  invoices marked paid + payment links with completed checkout.
                </p>
                <p>
                  <strong className="text-bone">Pipeline</strong> — Open/draft
                  invoices and active payment links awaiting payment.
                </p>
                <p>
                  <strong className="text-bone">Project tracking</strong> — Use
                  the SilentCPO Project Tool for kanbans, budgets, and workflows.
                </p>
              </div>
            </section>
          </div>
        )}

        {tab === "contacts" && (
          <div className="space-y-4">
            {loading && contacts.length === 0 ? (
              <p className="text-sm text-mist/60">Loading...</p>
            ) : contacts.length === 0 ? (
              <p className="text-sm text-mist/60">No enquiries yet.</p>
            ) : (
              contacts.map((c) => (
                <article
                  key={c.id}
                  className="border border-mist/10 bg-midnight/30 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-bone">{c.name}</h3>
                      <p className="text-sm text-mist/60">
                        {c.email}
                        {c.phone && ` · ${c.phone}`}
                      </p>
                    </div>
                    <span className="text-[10px] tracking-wider text-gold">
                      {c.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-green">
                    {c.project}
                    {c.budget && ` · ${c.budget}`}
                  </p>
                  <p className="mt-2 text-sm text-mist/70">{c.message}</p>
                  <p className="mt-3 text-[10px] text-mist/40">
                    {new Date(c.createdAt).toLocaleString("en-GB")}
                  </p>
                </article>
              ))
            )}
          </div>
        )}

        {tab === "platform" && <PlatformPanel apiFetch={apiFetch} />}

        {tab === "payments" && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <form
                onSubmit={createPaymentLink}
                className="space-y-3 border border-mist/10 p-6"
              >
                <h3 className="text-sm tracking-wider text-gold">
                  CREATE PAYMENT LINK
                </h3>
                <input name="customerName" required placeholder="Customer name" className={inputClass} />
                <input name="customerEmail" required type="email" placeholder="Customer email" className={inputClass} />
                <input name="amount" required type="number" step="0.01" min="0.50" placeholder="Amount (£)" className={inputClass} />
                <input name="description" placeholder="Description (optional)" className={inputClass} />
                <button type="submit" className="w-full bg-gold py-2 text-sm text-deep">
                  Create Link
                </button>
              </form>

              <form
                onSubmit={createInvoice}
                className="space-y-3 border border-mist/10 p-6"
              >
                <h3 className="text-sm tracking-wider text-gold">
                  SEND INVOICE
                </h3>
                <input name="customerName" required placeholder="Customer name" className={inputClass} />
                <input name="customerEmail" required type="email" placeholder="Customer email" className={inputClass} />
                <input name="amount" required type="number" step="0.01" min="0.50" placeholder="Amount (£)" className={inputClass} />
                <input name="description" placeholder="Description (optional)" className={inputClass} />
                <button type="submit" className="w-full bg-green py-2 text-sm text-deep">
                  Send Invoice
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-xs tracking-wider text-mist/60">
                  PAYMENT LINKS
                </h3>
                {paymentLinks.length === 0 && (
                  <p className="text-sm text-mist/60">No payment links yet.</p>
                )}
                {paymentLinks.map((pl) => (
                  <div
                    key={pl.id}
                    className="mb-2 flex items-center justify-between border border-mist/10 p-4"
                  >
                    <div>
                      <p className="text-sm">{pl.customerName}</p>
                      <p className="text-xs text-mist/60">
                        {formatMoney(pl.amount, pl.currency)} ·{" "}
                        <span className={statusColor(pl.status)}>
                          {pl.status.toUpperCase()}
                        </span>
                      </p>
                    </div>
                    <a
                      href={pl.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold hover:text-gold/80"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="mb-3 text-xs tracking-wider text-mist/60">
                  INVOICES
                </h3>
                {invoices.length === 0 && (
                  <p className="text-sm text-mist/60">No invoices yet.</p>
                )}
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="mb-2 flex items-center justify-between border border-mist/10 p-4"
                  >
                    <div>
                      <p className="text-sm">{inv.customerName}</p>
                      <p className="text-xs text-mist/60">
                        {formatMoney(inv.amount, inv.currency)} ·{" "}
                        <span className={statusColor(inv.status)}>
                          {inv.status.toUpperCase()}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {inv.hostedUrl && (
                        <a href={inv.hostedUrl} target="_blank" rel="noopener noreferrer" className="text-gold">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {inv.pdfUrl && (
                        <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-mist/60">
                          <FileText className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
