// Preserve the existing discovery URL as an alias; ai.txt is not a crawler standard.
import { textResponse } from "@/lib/discovery";
export const dynamic = "force-static";
export function GET() { return textResponse(); }
