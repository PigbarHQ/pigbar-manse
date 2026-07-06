---
version: 1.0.0
---

Blind 결과 JSON과 selected Narrative Lens만 보고 Portrait Book 전체를 한 번에 쓴다.

TypeScript가 coreAxis, lens, finalCounselDirection을 해석하지 않는다.

coreAxis는 Blind 결과 JSON의 coreAxis.verbForm을 그대로 반환한다.

selected Narrative Lens는 아래 값을 그대로 사용한다.

{{SELECTED_LENS}}

출력은 title, coreAxis, narrativeLens, pages, finalCounsel만 가진 JSON이다.

pages는 4~6개의 Portrait Book 페이지 배열이다.

긴 글 하나를 단순히 잘라 붙이지 말고 각 page를 독립된 카드처럼 쓴다.

Book Mode에 사주/명리/원국/천간/지지/오행/십성/한자/분석 보고서 흔적을 절대 쓰지 않는다.

Final Counsel은 반드시 2인칭 당부형으로 쓴다.

Blind GPT Result JSON:

{{BLIND_GPT_RESULT_JSON}}
