export function friendlyError(error: unknown): string {
  if (!(error instanceof Error)) return 'An unexpected error stopped the operation.';
  if (error.message.includes('Missing required environment variable')) {
    return 'The publisher is not fully configured yet. Ask an administrator to check its environment variables.';
  }
  if (error.message.startsWith('GitHub request failed')) {
    return 'GitHub could not update the live content branch. An administrator should check the repository token, branch protection, and server logs.';
  }
  if (/rate limit|quota/i.test(error.message)) {
    return 'The AI service is temporarily rate-limited. Please try again shortly.';
  }
  const safeMessages = [
    /^The cover image /,
    /^The attached file /,
    /^Slack did not /,
    /^The generated /,
    /^An article or cover /,
    /^No published article /,
    /^Use `delete /,
    /^OpenAI did not /,
  ];
  if (safeMessages.some((pattern) => pattern.test(error.message))) return error.message.slice(0, 500);
  return 'An unexpected service error stopped the operation. An administrator can check the server logs.';
}
