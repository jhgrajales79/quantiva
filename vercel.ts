import type { VercelConfig } from "@vercel/config/v1";

// Horarios en UTC. 14:30–21:00 UTC aproxima 9:30–16:00 ET (no ajusta DST
// automáticamente; revisar en marzo/noviembre si se requiere precisión
// exacta). Todos los crons llaman rutas protegidas por CRON_SECRET
// (ver src/lib/cron-auth.ts) — configúralo como variable de entorno en
// Vercel antes de habilitar estos jobs en producción.
export const config: VercelConfig = {
  framework: "nextjs",
  crons: [
    {
      path: "/api/cron/refresh-quotes",
      schedule: "*/5 14-21 * * 1-5",
    },
    {
      path: "/api/cron/refresh-fundamentals",
      schedule: "0 6 * * 1-5",
    },
    {
      path: "/api/cron/refresh-macro",
      schedule: "0 12 * * *",
    },
    {
      path: "/api/cron/refresh-news",
      schedule: "*/15 * * * *",
    },
  ],
};
