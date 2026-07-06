import type { CompactSajuAnalysis } from "@/src/lib/blind";
import type { FutureCompilerContext, FutureDaeun } from "./types";

export function compileCurrentDaeun(blind: CompactSajuAnalysis, context: FutureCompilerContext): FutureDaeun | null {
  const current = context.daeun?.current;
  if (!current) return null;

  const currentTime = Date.parse(context.currentDate);
  const start = Date.parse(current.startDateTime);
  const end = Date.parse(current.endDateTime);

  return {
    index: current.index,
    startYear: current.startYear,
    endYear: current.endYear,
    startDateTime: current.startDateTime,
    endDateTime: current.endDateTime,
    containsCurrentDate: Number.isFinite(currentTime) && Number.isFinite(start) && Number.isFinite(end)
      ? currentTime >= start && currentTime < end
      : false,
    ganji: current.ganji,
    ganjiHanja: current.ganjiHanja,
    gan: current.stem.hanja,
    ji: current.branch.hanja,
    ganKo: current.stem.hangul,
    jiKo: current.branch.hangul,
    tenGod: current.tenGod || blind.tenGods.byStem.month || "",
  };
}
