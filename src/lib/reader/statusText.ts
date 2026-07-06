import type { ReaderStatus } from "@/src/lib/decision";

export function summaryForStatus(title: string, status: ReaderStatus) {
  if (status === "HIGH_OPPORTUNITY_LOW_RISK") {
    return `${title} 영역은 기회 신호가 강하고 리스크 신호는 낮은 편입니다.`;
  }
  if (status === "HIGH_OPPORTUNITY_HIGH_RISK") {
    return `${title} 영역은 기회 신호가 강합니다. 다만 일부 시기에는 변동성 신호가 함께 나타납니다.`;
  }
  if (status === "MID_OPPORTUNITY_LOW_RISK") {
    return `${title} 영역은 중간 수준의 기회 신호가 있으며 리스크는 낮은 편입니다.`;
  }
  if (status === "MID_OPPORTUNITY_HIGH_RISK") {
    return `${title} 영역은 일부 기회 신호가 있으나, 리스크 관리가 더 중요합니다.`;
  }
  if (status === "LOW_OPPORTUNITY_LOW_RISK") {
    return `${title} 영역은 강한 기회 신호는 적지만 리스크도 크지 않습니다.`;
  }
  if (status === "LOW_OPPORTUNITY_HIGH_RISK") {
    return `${title} 영역은 기회 신호보다 리스크 신호가 더 크게 나타납니다.`;
  }

  return `${title} 영역은 뚜렷한 한쪽 방향성이 강하지 않습니다.`;
}
