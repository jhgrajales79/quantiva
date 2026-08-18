import type { VercelConfig } from "@vercel/config/v1";

// El plan Hobby de Vercel limita los Cron Jobs a máximo una ejecución por día
// por job, así que todas las frecuencias aquí son diarias (no cada 5/15 min
// como sería ideal para quotes/noticias). El refresco "real" sigue
// funcionando de todas formas: cada ruta API valida su propio TTL (ver
// src/lib/cache.ts) y refresca contra el proveedor cuando un usuario visita
// la página, independientemente del cron — el cron solo pre-calienta el
// cache. Si se pasa a plan Pro, se puede volver a frecuencias intradía.
// Todos los crons llaman rutas protegidas por CRON_SECRET
// (ver src/lib/cron-auth.ts).
export const config: VercelConfig = {
  framework: "nextjs",
  crons: [
    {
      path: "/api/cron/refresh-quotes",
      schedule: "0 18 * * 1-5", // ~1pm ET, una vez al día en horario de mercado
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
      schedule: "0 13 * * *",
    },
  ],
};
