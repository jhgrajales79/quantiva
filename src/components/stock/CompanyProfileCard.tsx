"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

interface CompanyProfile {
  sector: string | null;
  industry: string | null;
  ceoName: string | null;
  employees: number | null;
  website: string | null;
  businessSummary: string | null;
  firstTradeDate: string | null;
}

export function CompanyProfileCard({ symbol }: { symbol: string }) {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch(`/api/company-profile/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [symbol]);

  return (
    <Card>
      <CardHeader title="Perfil de la empresa" />
      {!profile ? (
        <Spinner />
      ) : (
        <>
          {profile.businessSummary ? (
            <p className="text-sm text-app-fg-muted">
              {expanded ? profile.businessSummary : profile.businessSummary.slice(0, 280) + "…"}{" "}
              <button onClick={() => setExpanded(!expanded)} className="text-emerald-400 hover:underline">
                {expanded ? "Ver menos" : "Ver más"}
              </button>
            </p>
          ) : (
            <p className="text-sm text-app-fg-muted">Dato no disponible.</p>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <Field label="Sector" value={profile.sector} />
            <Field label="Industria" value={profile.industry} />
            <Field label="CEO" value={profile.ceoName} />
            <Field
              label="Sitio web"
              value={profile.website}
              href={profile.website ?? undefined}
            />
            <Field label="Empleados" value={profile.employees?.toLocaleString("es-CO") ?? null} />
            <Field label="En bolsa desde" value={profile.firstTradeDate} />
          </dl>
        </>
      )}
    </Card>
  );
}

function Field({ label, value, href }: { label: string; value: string | null; href?: string }) {
  return (
    <div>
      <dt className="text-xs text-app-fg-muted">{label}</dt>
      <dd className="text-app-fg">
        {value === null ? (
          "Dato no disponible"
        ) : href ? (
          <a href={href} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
