import {
  pgTable,
  text,
  timestamp,
  integer,
  doublePrecision,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Auth.js core tables
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name"),
  image: text("image"),
  role: text("role", { enum: ["user", "admin"] })
    .notNull()
    .default("user"),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
  ],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

// ---------------------------------------------------------------------------
// Assets & market data
// ---------------------------------------------------------------------------

export const assets = pgTable(
  "assets",
  {
    id: text("id").primaryKey(),
    symbol: text("symbol").notNull(),
    name: text("name").notNull(),
    assetType: text("asset_type", { enum: ["stock", "etf", "crypto"] }).notNull(),
    sector: text("sector"),
    industry: text("industry"),
    country: text("country"),
    currency: text("currency").default("USD"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("assets_symbol_idx").on(table.symbol)],
);

export const pricesDaily = pgTable(
  "prices_daily",
  {
    id: text("id").primaryKey(),
    assetId: text("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // YYYY-MM-DD
    open: doublePrecision("open"),
    high: doublePrecision("high"),
    low: doublePrecision("low"),
    close: doublePrecision("close").notNull(),
    volume: doublePrecision("volume"),
    source: text("source").notNull(),
    fetchedAt: timestamp("fetched_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("prices_daily_asset_date_idx").on(table.assetId, table.date),
  ],
);

export const pricesIntradayCache = pgTable(
  "prices_intraday_cache",
  {
    assetId: text("asset_id")
      .primaryKey()
      .references(() => assets.id, { onDelete: "cascade" }),
    price: doublePrecision("price").notNull(),
    changeAbs: doublePrecision("change_abs"),
    changePct: doublePrecision("change_pct"),
    dayHigh: doublePrecision("day_high"),
    dayLow: doublePrecision("day_low"),
    volume: doublePrecision("volume"),
    marketCap: doublePrecision("market_cap"),
    marketStatus: text("market_status", {
      enum: ["pre-market", "open", "after-hours", "closed"],
    }),
    source: text("source").notNull(),
    fetchedAt: timestamp("fetched_at", { mode: "date" }).notNull().defaultNow(),
  },
);

export const fundamentals = pgTable(
  "fundamentals",
  {
    id: text("id").primaryKey(),
    assetId: text("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    period: text("period", { enum: ["annual", "quarter", "ttm"] }).notNull(),
    fiscalDate: text("fiscal_date").notNull(),
    revenue: doublePrecision("revenue"),
    ebitda: doublePrecision("ebitda"),
    ebit: doublePrecision("ebit"),
    netIncome: doublePrecision("net_income"),
    eps: doublePrecision("eps"),
    fcf: doublePrecision("fcf"),
    totalDebt: doublePrecision("total_debt"),
    cash: doublePrecision("cash"),
    sharesOutstanding: doublePrecision("shares_outstanding"),
    bookValuePerShare: doublePrecision("book_value_per_share"),
    beta: doublePrecision("beta"),
    source: text("source").notNull(),
    fetchedAt: timestamp("fetched_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("fundamentals_asset_period_date_idx").on(
      table.assetId,
      table.period,
      table.fiscalDate,
    ),
  ],
);

export const ratios = pgTable(
  "ratios",
  {
    id: text("id").primaryKey(),
    assetId: text("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    period: text("period", { enum: ["annual", "quarter", "ttm"] }).notNull(),
    fiscalDate: text("fiscal_date").notNull(),
    pe: doublePrecision("pe"),
    forwardPe: doublePrecision("forward_pe"),
    ps: doublePrecision("ps"),
    pb: doublePrecision("pb"),
    evEbitda: doublePrecision("ev_ebitda"),
    fcfYield: doublePrecision("fcf_yield"),
    dividendYield: doublePrecision("dividend_yield"),
    roe: doublePrecision("roe"),
    roic: doublePrecision("roic"),
    grossMargin: doublePrecision("gross_margin"),
    operatingMargin: doublePrecision("operating_margin"),
    debtToEbitda: doublePrecision("debt_to_ebitda"),
    revenueGrowth: doublePrecision("revenue_growth"),
    epsGrowth: doublePrecision("eps_growth"),
    source: text("source").notNull(),
    fetchedAt: timestamp("fetched_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ratios_asset_period_date_idx").on(
      table.assetId,
      table.period,
      table.fiscalDate,
    ),
  ],
);

export const dividends = pgTable(
  "dividends",
  {
    id: text("id").primaryKey(),
    assetId: text("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    exDate: text("ex_date").notNull(),
    paymentDate: text("payment_date"),
    recordDate: text("record_date"),
    amount: doublePrecision("amount").notNull(),
    frequency: text("frequency"),
    source: text("source").notNull(),
    fetchedAt: timestamp("fetched_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("dividends_asset_exdate_idx").on(table.assetId, table.exDate)],
);

export const earningsEvents = pgTable(
  "earnings_events",
  {
    id: text("id").primaryKey(),
    assetId: text("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    reportDate: text("report_date").notNull(),
    epsEstimate: doublePrecision("eps_estimate"),
    epsActual: doublePrecision("eps_actual"),
    revenueEstimate: doublePrecision("revenue_estimate"),
    revenueActual: doublePrecision("revenue_actual"),
    source: text("source").notNull(),
    fetchedAt: timestamp("fetched_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("earnings_asset_reportdate_idx").on(table.assetId, table.reportDate)],
);

export const companyProfiles = pgTable("company_profiles", {
  assetId: text("asset_id")
    .primaryKey()
    .references(() => assets.id, { onDelete: "cascade" }),
  sector: text("sector"),
  industry: text("industry"),
  ceoName: text("ceo_name"),
  employees: integer("employees"),
  website: text("website"),
  businessSummary: text("business_summary"),
  firstTradeDate: text("first_trade_date"),
  source: text("source").notNull(),
  fetchedAt: timestamp("fetched_at", { mode: "date" }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Valuation / Fair Value Engine
// ---------------------------------------------------------------------------

export const valuations = pgTable(
  "valuations",
  {
    id: text("id").primaryKey(),
    assetId: text("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    model: text("model", {
      enum: ["dcf", "pe_relative", "ev_ebitda", "ps", "ddm", "graham", "multiples_composite"],
    }).notNull(),
    fairValue: doublePrecision("fair_value"),
    assumptions: jsonb("assumptions"),
    calculatedAt: timestamp("calculated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("valuations_asset_model_idx").on(table.assetId, table.model),
  ],
);

export const valuationConsensus = pgTable("valuation_consensus", {
  assetId: text("asset_id")
    .primaryKey()
    .references(() => assets.id, { onDelete: "cascade" }),
  fairValueConsensus: doublePrecision("fair_value_consensus"),
  upsidePct: doublePrecision("upside_pct"),
  marginOfSafetyPrice: doublePrecision("margin_of_safety_price"),
  valueScore: doublePrecision("value_score"),
  qualityScore: doublePrecision("quality_score"),
  growthScore: doublePrecision("growth_score"),
  momentumScore: doublePrecision("momentum_score"),
  investmentScore: doublePrecision("investment_score"),
  possibleValueTrap: text("possible_value_trap"), // "yes" | "no" (bool-like, keeps null distinct from false)
  calculatedAt: timestamp("calculated_at", { mode: "date" }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// User layer: watchlists & portfolios
// ---------------------------------------------------------------------------

export const watchlists = pgTable("watchlists", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const watchlistItems = pgTable(
  "watchlist_items",
  {
    watchlistId: text("watchlist_id")
      .notNull()
      .references(() => watchlists.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.watchlistId, table.assetId] })],
);

export const portfolios = pgTable("portfolios", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  baseCurrency: text("base_currency").notNull().default("USD"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const portfolioTransactions = pgTable(
  "portfolio_transactions",
  {
    id: text("id").primaryKey(),
    portfolioId: text("portfolio_id")
      .notNull()
      .references(() => portfolios.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["buy", "sell", "dividend"] }).notNull(),
    quantity: doublePrecision("quantity").notNull(),
    price: doublePrecision("price").notNull(),
    fees: doublePrecision("fees").notNull().default(0),
    executedAt: timestamp("executed_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("portfolio_tx_portfolio_idx").on(table.portfolioId)],
);

// ---------------------------------------------------------------------------
// News, macro, movers
// ---------------------------------------------------------------------------

export const newsItems = pgTable(
  "news_items",
  {
    id: text("id").primaryKey(),
    source: text("source").notNull(),
    publishedAt: timestamp("published_at", { mode: "date" }).notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    url: text("url").notNull().unique(),
    relatedSymbols: jsonb("related_symbols").$type<string[]>().default([]),
    category: text("category", {
      enum: [
        "company",
        "earnings",
        "m_and_a",
        "macro",
        "fed",
        "markets",
        "analyst_ratings",
        "dividend",
        "regulatory",
        "crypto",
      ],
    }).notNull(),
    fetchedAt: timestamp("fetched_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("news_published_idx").on(table.publishedAt)],
);

export const macroIndicators = pgTable(
  "macro_indicators",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(), // CPI, CORE_CPI, GDP, UNEMPLOYMENT, FED_FUNDS, DGS2, DGS10, ...
    date: text("date").notNull(),
    value: doublePrecision("value").notNull(),
    previousValue: doublePrecision("previous_value"),
    source: text("source").notNull(),
    fetchedAt: timestamp("fetched_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("macro_code_date_idx").on(table.code, table.date)],
);

export const fearGreedSnapshot = pgTable("fear_greed_snapshot", {
  id: text("id").primaryKey().default("latest"), // fila única, siempre se upsertea
  score: doublePrecision("score").notNull(),
  rating: text("rating").notNull(),
  previousClose: doublePrecision("previous_close").notNull(),
  previousWeek: doublePrecision("previous_week").notNull(),
  date: text("date").notNull(),
  source: text("source").notNull(),
  fetchedAt: timestamp("fetched_at", { mode: "date" }).notNull().defaultNow(),
});

export const marketBreadthSnapshots = pgTable("market_breadth_snapshots", {
  date: text("date").primaryKey(),
  advancing: integer("advancing").notNull(),
  declining: integer("declining").notNull(),
  pctAboveMa50: doublePrecision("pct_above_ma50").notNull(),
  pctAboveMa200: doublePrecision("pct_above_ma200").notNull(),
  newHighs52w: integer("new_highs_52w").notNull(),
  newLows52w: integer("new_lows_52w").notNull(),
  universeSize: integer("universe_size").notNull(),
  source: text("source").notNull(),
  fetchedAt: timestamp("fetched_at", { mode: "date" }).notNull().defaultNow(),
});

export const marketMoversCache = pgTable(
  "market_movers_cache",
  {
    id: text("id").primaryKey(),
    date: text("date").notNull(),
    category: text("category", {
      enum: ["gainers", "losers", "most_active"],
    }).notNull(),
    assetId: text("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    changePct: doublePrecision("change_pct"),
    volume: doublePrecision("volume"),
    fetchedAt: timestamp("fetched_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("movers_date_category_asset_idx").on(
      table.date,
      table.category,
      table.assetId,
    ),
  ],
);
