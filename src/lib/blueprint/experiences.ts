export type BlueprintExperience = {
  id: string;
  name: string;
  label: string;
  tagline: string;
  description: string;
  preview: string;
  steps: string[];
  theme: {
    appBg: string;
    stageBg: string;
    surface: string;
    subtleSurface: string;
    border: string;
    text: string;
    mutedText: string;
    accentText: string;
    primaryButton: string;
    secondaryButton: string;
    cover: string;
    page: string;
    counsel: string;
    input: {
      panel: string;
      field: string;
      label: string;
      checkbox: string;
      modePanel: string;
      toggleActive: string;
      toggleInactive: string;
      error: string;
    };
  };
};

export const BLUEPRINT_EXPERIENCES: BlueprintExperience[] = [
  {
    id: "warm-book",
    name: "Warm Book Edition",
    label: "현재 적용 시안",
    tagline: "따뜻한 종이 위에 조용히 출판합니다.",
    description: "따뜻한 종이색, 낮은 대비, 손에 잡히는 책의 감각을 중심으로 한 기본 Portrait Book 경험입니다.",
    preview: "paper, serif, calm",
    steps: ["입력", "집필", "완성", "읽기"],
    theme: {
      appBg: "bg-[#f3efe7] text-[#2f2922]",
      stageBg: "bg-[#f3efe7]",
      surface: "border-[#d8cdbb] bg-[#fffaf0] shadow-[0_24px_70px_rgba(82,62,35,0.13)]",
      subtleSurface: "border-[#e2d4c0] bg-[#fffdf8]",
      border: "border-[#d8cdbb]",
      text: "text-[#2f2922]",
      mutedText: "text-[#6f6253]",
      accentText: "text-[#b18440]",
      primaryButton: "bg-[#2f2118] text-[#fff8ec] hover:bg-[#1d140f]",
      secondaryButton: "text-[#8a6b2e] hover:bg-[#f4eadc]",
      cover: "border-[#253b2d] bg-[#173527] text-[#fff8ec] shadow-[0_24px_50px_rgba(23,53,39,0.24)]",
      page: "border-[#ded1bd] bg-[#fffaf0] shadow-[0_16px_44px_rgba(67,52,32,0.08)]",
      counsel: "border-[#d8cdbb] bg-[#fff8ec] shadow-[0_18px_54px_rgba(67,52,32,0.1)]",
      input: {
        panel: "border-[#d8cdbb] bg-[#fffaf0] shadow-[0_24px_70px_rgba(82,62,35,0.13)]",
        field:
          "mt-1 h-10 w-full rounded-[4px] border border-[#d8cdbb] bg-[#fffdf8] px-3 text-sm text-[#2f2922] outline-none transition placeholder:text-[#b5a996] focus:border-[#8a6b2e] focus:ring-2 focus:ring-[#f7df9c]/50",
        label: "text-[#6f6253]",
        checkbox: "border-[#d8cdbb] bg-[#fffdf8] text-[#6f6253]",
        modePanel: "border-[#d8cdbb] bg-[#fffdf8]",
        toggleActive: "border-[#8a6b2e] bg-[#f7df9c]/70 text-[#2f2922]",
        toggleInactive: "border-[#d8cdbb] text-[#6f6253] hover:bg-[#f7efe2]",
        error: "text-red-700",
      },
    },
  },
  {
    id: "glass",
    name: "Glass Blueprint Edition",
    label: "첨부 이미지 기준",
    tagline: "검은 무대 위에서 금빛 출판식을 엽니다.",
    description: "블랙 글래스, 골드 라인, 빛나는 책 오브젝트를 중심으로 한 시네마틱 Publishing Experience입니다.",
    preview: "glass, gold, cinematic",
    steps: ["입력하기", "책을 만드는 중", "완성되었습니다", "책 읽기"],
    theme: {
      appBg: "bg-[#050402] text-[#f7d487]",
      stageBg: "bg-[radial-gradient(circle_at_28%_18%,rgba(209,158,72,0.16),transparent_28%),linear-gradient(135deg,#050402,#0d0904_55%,#050402)]",
      surface: "border-[#7b5a24]/70 bg-[#0c0905]/82 shadow-[0_28px_90px_rgba(213,159,72,0.16)] backdrop-blur",
      subtleSurface: "border-[#7b5a24]/50 bg-[#0f0b06]/70",
      border: "border-[#7b5a24]/70",
      text: "text-[#f7d487]",
      mutedText: "text-[#a88a52]",
      accentText: "text-[#f6c46b]",
      primaryButton: "bg-[#f0b85b] text-[#120c05] hover:bg-[#ffd27a]",
      secondaryButton: "text-[#f6c46b] hover:bg-[#f0b85b]/10",
      cover: "border-[#b98534]/70 bg-[#0d0905] text-[#f7d487] shadow-[0_0_44px_rgba(240,184,91,0.24)]",
      page: "border-[#7b5a24]/70 bg-[#0a0704]/88 shadow-[0_18px_64px_rgba(240,184,91,0.1)]",
      counsel: "border-[#b98534]/70 bg-[#0d0905] shadow-[0_0_56px_rgba(240,184,91,0.16)]",
      input: {
        panel:
          "border-[#b98534]/70 bg-[#080604]/72 shadow-[0_0_60px_rgba(240,184,91,0.16),inset_0_1px_0_rgba(255,222,151,0.16)] backdrop-blur-xl",
        field:
          "mt-1 h-10 w-full rounded-[6px] border border-[#8a6429]/80 bg-[#0d0905]/70 px-3 text-sm text-[#f7d487] outline-none transition placeholder:text-[#80683e] hover:border-[#d6a64f] hover:shadow-[0_0_18px_rgba(240,184,91,0.12)] focus:border-[#f6c46b] focus:ring-2 focus:ring-[#f6c46b]/24",
        label: "text-[#c8a568]",
        checkbox: "border-[#8a6429]/80 bg-[#0d0905]/68 text-[#c8a568] hover:border-[#d6a64f]",
        modePanel: "border-[#8a6429]/80 bg-[#0d0905]/58",
        toggleActive: "border-[#f6c46b] bg-[#f6c46b]/18 text-[#f7d487] shadow-[0_0_20px_rgba(246,196,107,0.14)]",
        toggleInactive: "border-[#7b5a24]/70 text-[#a88a52] hover:border-[#d6a64f] hover:bg-[#f6c46b]/8",
        error: "text-[#ff9c8d]",
      },
    },
  },
  {
    id: "classic",
    name: "Classic Edition",
    label: "전통 서적형",
    tagline: "활자와 여백으로 오래 남는 책을 만듭니다.",
    description: "상아색 지면, 먹색 활자, 얇은 선과 넉넉한 여백으로 편집자가 교정지를 넘기는 듯한 경험입니다.",
    preview: "ivory paper, ink, editorial desk",
    steps: ["원고 접수", "교정", "제본", "열람"],
    theme: {
      appBg: "bg-[#e9e1d1] text-[#211d18]",
      stageBg:
        "bg-[linear-gradient(90deg,rgba(80,63,43,0.035)_1px,transparent_1px),linear-gradient(180deg,#eee7d9,#e5dcc9)] bg-[length:44px_44px,100%_100%]",
      surface: "border-[#b8a98f] bg-[#fbf5e8] shadow-[0_24px_70px_rgba(45,37,27,0.14)]",
      subtleSurface: "border-[#d4c6ae] bg-[#fffaf0]",
      border: "border-[#b8a98f]",
      text: "text-[#211d18]",
      mutedText: "text-[#655b4d]",
      accentText: "text-[#6f4f27]",
      primaryButton: "bg-[#211d18] text-[#fff7e8] hover:bg-[#3a3027]",
      secondaryButton: "text-[#6f4f27] hover:bg-[#ded1bb]",
      cover: "border-[#1f1b16] bg-[#2b261f] text-[#fff4df] shadow-[0_24px_54px_rgba(45,37,27,0.24)]",
      page: "border-[#cfc0a8] bg-[#fff8eb] shadow-[0_14px_40px_rgba(45,37,27,0.1)]",
      counsel: "border-[#b8a98f] bg-[#f8efdf] shadow-[0_16px_44px_rgba(45,37,27,0.12)]",
      input: {
        panel:
          "border-[#b8a98f] bg-[#fbf5e8] shadow-[0_24px_70px_rgba(45,37,27,0.14),inset_0_1px_0_rgba(255,255,255,0.58)]",
        field:
          "mt-1 h-10 w-full rounded-[2px] border border-[#b8a98f] bg-[#fffaf0] px-3 text-sm text-[#211d18] outline-none transition placeholder:text-[#a6967d] hover:border-[#8f7958] focus:border-[#503f2b] focus:ring-2 focus:ring-[#c9b58f]/45",
        label: "text-[#655b4d]",
        checkbox: "border-[#b8a98f] bg-[#fffaf0] text-[#655b4d] hover:border-[#8f7958]",
        modePanel: "border-[#b8a98f] bg-[#fffaf0]",
        toggleActive: "border-[#503f2b] bg-[#d7c5a7] text-[#211d18]",
        toggleInactive: "border-[#b8a98f] text-[#655b4d] hover:bg-[#efe4d1]",
        error: "text-[#9b2f26]",
      },
    },
  },
  {
    id: "luxury",
    name: "Luxury Edition",
    label: "프리미엄 북",
    tagline: "벨벳처럼 깊고 금박처럼 느리게 출판합니다.",
    description: "와인빛 어둠, 금박 테두리, 봉인과 서가의 감각을 가진 소장용 Portrait Book 경험입니다.",
    preview: "velvet, seal, gold leaf",
    steps: ["초대", "각인", "봉인", "열람"],
    theme: {
      appBg: "bg-[#10070b] text-[#f5d58b]",
      stageBg:
        "bg-[radial-gradient(circle_at_74%_12%,rgba(196,143,62,0.24),transparent_28%),radial-gradient(circle_at_18%_78%,rgba(95,24,42,0.32),transparent_30%),linear-gradient(135deg,#10070b,#241019_48%,#12080a)]",
      surface: "border-[#b98a43]/72 bg-[#1b0d12]/88 shadow-[0_30px_96px_rgba(0,0,0,0.34)]",
      subtleSurface: "border-[#7e5a2c]/75 bg-[#241019]/78",
      border: "border-[#b98a43]/72",
      text: "text-[#f5d58b]",
      mutedText: "text-[#c2a06d]",
      accentText: "text-[#ffd77a]",
      primaryButton: "bg-gradient-to-r from-[#b77a2d] via-[#f0c266] to-[#fff0a8] text-[#18090a] hover:brightness-110",
      secondaryButton: "text-[#ffd77a] hover:bg-[#ffd77a]/10",
      cover: "border-[#d9a850]/75 bg-[#2a0e16] text-[#f5d58b] shadow-[0_26px_70px_rgba(0,0,0,0.34)]",
      page: "border-[#8f642f]/75 bg-[#190b10]/90 shadow-[0_18px_58px_rgba(0,0,0,0.26)]",
      counsel: "border-[#d9a850]/75 bg-[#241019] shadow-[0_20px_60px_rgba(0,0,0,0.28)]",
      input: {
        panel:
          "border-[#d9a850]/75 bg-[#1b0d12]/88 shadow-[0_30px_96px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,240,168,0.16)]",
        field:
          "mt-1 h-10 w-full rounded-[7px] border border-[#8f642f]/85 bg-[#12080c]/76 px-3 text-sm text-[#f5d58b] outline-none transition placeholder:text-[#87633e] hover:border-[#d9a850] hover:shadow-[0_0_18px_rgba(255,215,122,0.11)] focus:border-[#ffd77a] focus:ring-2 focus:ring-[#ffd77a]/24",
        label: "text-[#c2a06d]",
        checkbox: "border-[#8f642f]/85 bg-[#12080c]/76 text-[#c2a06d] hover:border-[#d9a850]",
        modePanel: "border-[#8f642f]/85 bg-[#12080c]/64",
        toggleActive: "border-[#ffd77a] bg-[#ffd77a]/18 text-[#f5d58b] shadow-[0_0_22px_rgba(255,215,122,0.13)]",
        toggleInactive: "border-[#8f642f]/85 text-[#c2a06d] hover:border-[#d9a850] hover:bg-[#ffd77a]/8",
        error: "text-[#ffaaa0]",
      },
    },
  },
  {
    id: "cinematic-illustration",
    name: "Cinematic Illustration Edition",
    label: "시네마틱 일러스트",
    tagline: "한 사람의 책을 장면처럼 열어 보입니다.",
    description: "검은 무대, 금빛 새벽, 먼 산과 호수의 깊이를 가진 일러스트형 Portrait Book 경험입니다.",
    preview: "cinematic landscape, gold light, quiet cover",
    steps: ["시작", "장면 생성", "표지 완성", "열람"],
    theme: {
      appBg: "bg-[#060504] text-[#ffd98b]",
      stageBg:
        "bg-[radial-gradient(ellipse_at_50%_12%,rgba(244,176,69,0.18),transparent_28%),radial-gradient(ellipse_at_72%_86%,rgba(87,49,19,0.42),transparent_34%),linear-gradient(180deg,#060504_0%,#110b05_54%,#070504_100%)]",
      surface: "border-[#9b6b2d]/70 bg-[#0c0804]/86 shadow-[0_30px_96px_rgba(216,146,47,0.16)]",
      subtleSurface: "border-[#6f4d20]/72 bg-[#130d07]/78",
      border: "border-[#9b6b2d]/70",
      text: "text-[#ffd98b]",
      mutedText: "text-[#b89661]",
      accentText: "text-[#ffc766]",
      primaryButton: "bg-gradient-to-r from-[#8d5620] via-[#e1a64b] to-[#ffd98b] text-[#120905] hover:brightness-110",
      secondaryButton: "text-[#ffc766] hover:bg-[#ffc766]/10",
      cover:
        "border-[#d19a45]/75 bg-[radial-gradient(ellipse_at_50%_22%,rgba(255,199,102,0.34),transparent_22%),linear-gradient(180deg,#100b06_0%,#241107_58%,#070504_100%)] text-[#ffd98b] shadow-[0_24px_70px_rgba(225,166,75,0.18)]",
      page:
        "border-[#8a5d24]/72 bg-[linear-gradient(180deg,rgba(18,11,5,0.94),rgba(10,7,4,0.96)),radial-gradient(ellipse_at_50%_100%,rgba(213,137,43,0.28),transparent_38%)] shadow-[0_18px_58px_rgba(225,166,75,0.12)]",
      counsel:
        "border-[#d19a45]/75 bg-[linear-gradient(180deg,#160d06,#090604)] shadow-[0_22px_72px_rgba(225,166,75,0.16)]",
      input: {
        panel:
          "border-[#d19a45]/75 bg-[linear-gradient(180deg,rgba(17,11,6,0.9),rgba(8,6,4,0.94))] shadow-[0_30px_96px_rgba(216,146,47,0.16),inset_0_1px_0_rgba(255,217,139,0.14)]",
        field:
          "mt-1 h-10 w-full rounded-[7px] border border-[#8a5d24]/85 bg-[#0b0704]/76 px-3 text-sm text-[#ffd98b] outline-none transition placeholder:text-[#795b36] hover:border-[#d19a45] hover:shadow-[0_0_18px_rgba(225,166,75,0.12)] focus:border-[#ffc766] focus:ring-2 focus:ring-[#ffc766]/24",
        label: "text-[#b89661]",
        checkbox: "border-[#8a5d24]/85 bg-[#0b0704]/76 text-[#b89661] hover:border-[#d19a45]",
        modePanel: "border-[#8a5d24]/85 bg-[#0b0704]/62",
        toggleActive: "border-[#ffc766] bg-[#ffc766]/18 text-[#ffd98b] shadow-[0_0_22px_rgba(255,199,102,0.13)]",
        toggleInactive: "border-[#8a5d24]/85 text-[#b89661] hover:border-[#d19a45] hover:bg-[#ffc766]/8",
        error: "text-[#ffad8f]",
      },
    },
  },
];

export const DEFAULT_BLUEPRINT_EXPERIENCE = BLUEPRINT_EXPERIENCES[0];
