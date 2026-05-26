import "server-only";

import { isAgentCronAuthorized } from "@/lib/agent/config";

export { isAgentCronAuthorized };

export function agentCronResponse(
  result: Record<string, unknown>,
  status = 200,
): Response {
  return Response.json(result, { status });
}
