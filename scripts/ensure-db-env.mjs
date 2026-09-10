/**
 * Neon/Vercel may inject POSTGRES_* vars without DATABASE_URL_UNPOOLED.
 * Prisma needs both — map fallbacks before generate/db push.
 */
if (!process.env.DATABASE_URL?.trim()) {
  const pooled =
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL?.trim();
  if (pooled) process.env.DATABASE_URL = pooled;
}

if (!process.env.DATABASE_URL_UNPOOLED?.trim()) {
  const direct =
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (direct) process.env.DATABASE_URL_UNPOOLED = direct;
}
