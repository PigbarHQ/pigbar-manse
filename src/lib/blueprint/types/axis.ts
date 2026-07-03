export const BLUEPRINT_AXES = [
  "Identity",
  "Thinking",
  "Decision",
  "Action",
  "Relationship",
  "Communication",
  "Leadership",
  "Conflict",
  "Growth",
  "Wealth",
  "Health",
  "LifeFlow",
] as const;

export type BlueprintAxis = (typeof BLUEPRINT_AXES)[number];

export const BLUEPRINT_AXIS_QUESTIONS: Record<BlueprintAxis, string> = {
  Identity: "나는 누구인가",
  Thinking: "나는 어떻게 생각하는가",
  Decision: "나는 어떻게 결정하는가",
  Action: "나는 어떻게 움직이는가",
  Relationship: "나는 사람을 어떻게 대하는가",
  Communication: "나는 어떻게 말하고 전달하는가",
  Leadership: "나는 어떤 방식으로 영향력을 갖는가",
  Conflict: "나는 갈등을 어떻게 겪는가",
  Growth: "나는 어떻게 성장하는가",
  Wealth: "나는 무엇을 자원으로 바꾸는가",
  Health: "나는 어떻게 소모되고 회복되는가",
  LifeFlow: "나는 어떤 흐름 위에 있는가",
};

export function toReaderAxis(axis: BlueprintAxis) {
  return axis === "LifeFlow" ? "Life Flow" : axis;
}
