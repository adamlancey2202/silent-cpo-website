// Preview builds should never compete with the production domain in search.
export const isPreviewDeployment = process.env.VERCEL_ENV === "preview";
