export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Sin secreto configurado, no se exponen los crons públicamente.
    return false;
  }
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}
