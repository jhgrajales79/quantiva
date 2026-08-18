const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

interface CrumbSession {
  cookie: string;
  crumb: string;
  fetchedAt: number;
}

let cachedSession: CrumbSession | null = null;
const SESSION_TTL_MS = 45 * 60_000;

function extractCookies(res: Response): string[] {
  const getSetCookie = (res.headers as unknown as { getSetCookie?: () => string[] })
    .getSetCookie;
  const raw = typeof getSetCookie === "function" ? getSetCookie.call(res.headers) : [];
  return raw.map((c) => c.split(";")[0]);
}

async function fetchCrumbSession(): Promise<CrumbSession> {
  const fcRes = await fetch("https://fc.yahoo.com/", {
    headers: { "User-Agent": USER_AGENT },
    redirect: "manual",
  });
  let cookies = extractCookies(fcRes);

  const crumbRes = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
    headers: { "User-Agent": USER_AGENT, Cookie: cookies.join("; ") },
  });
  if (!crumbRes.ok) {
    throw new Error(`No se pudo obtener crumb de Yahoo Finance: ${crumbRes.status}`);
  }
  cookies = cookies.concat(extractCookies(crumbRes));
  const crumb = await crumbRes.text();

  return { cookie: cookies.join("; "), crumb, fetchedAt: Date.now() };
}

async function getSession(forceRefresh = false): Promise<CrumbSession> {
  if (!forceRefresh && cachedSession && Date.now() - cachedSession.fetchedAt < SESSION_TTL_MS) {
    return cachedSession;
  }
  cachedSession = await fetchCrumbSession();
  return cachedSession;
}

/**
 * Llama a un endpoint público de Yahoo Finance que NO requiere crumb
 * (chart, search, screener predefinidos). Valida el JSON con el schema dado.
 */
export async function yahooFetchPublic<T>(
  url: string,
  schema: { parse: (data: unknown) => T },
): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Yahoo Finance request failed: ${res.status} ${res.statusText} (${url})`);
  }
  const json = await res.json();
  return schema.parse(json);
}

/**
 * Llama a un endpoint de Yahoo Finance que requiere el flujo cookie+crumb
 * (quoteSummary). Reintenta una vez con una sesión nueva si el crumb expiró.
 */
export async function yahooFetchWithCrumb<T>(
  buildUrl: (crumb: string) => string,
  schema: { parse: (data: unknown) => T },
): Promise<T> {
  let session = await getSession();

  async function attempt(s: CrumbSession) {
    const res = await fetch(buildUrl(s.crumb), {
      headers: { "User-Agent": USER_AGENT, Cookie: s.cookie },
      cache: "no-store",
    });
    return res;
  }

  let res = await attempt(session);
  if (res.status === 401) {
    session = await getSession(true);
    res = await attempt(session);
  }

  if (!res.ok) {
    throw new Error(`Yahoo Finance request failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return schema.parse(json);
}
