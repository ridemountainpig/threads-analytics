import { metadataCorsOptionsRequestHandler } from "mcp-handler";
import { protectedResourceMetadataResponse } from "@/lib/oauth-resource-metadata";

export function GET(request: Request) {
  return protectedResourceMetadataResponse(request);
}

export const OPTIONS = metadataCorsOptionsRequestHandler();
