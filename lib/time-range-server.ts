import { cookies } from "next/headers";

export const RANGE_COOKIE = "ta_range";
export const RANGE_FROM_COOKIE = "ta_range_from";
export const RANGE_TO_COOKIE = "ta_range_to";

export async function resolveRangeParams(params: {
  range?: string;
  from?: string;
  to?: string;
}): Promise<{ range?: string; from?: string; to?: string }> {
  if (params.from && params.to) return params;
  if (params.range) return params;

  const c = await cookies();
  const from = c.get(RANGE_FROM_COOKIE)?.value;
  const to = c.get(RANGE_TO_COOKIE)?.value;
  if (from && to) return { from, to };

  const range = c.get(RANGE_COOKIE)?.value;
  if (range) return { range };

  return params;
}
