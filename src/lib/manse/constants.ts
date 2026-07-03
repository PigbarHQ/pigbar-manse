import type { BranchInfo, ElementName, StemInfo } from "./types";

export const STANDARD_MERIDIAN_LONGITUDE = 135;

export const STEMS: StemInfo[] = [
  { key: "gap", hangul: "갑", hanja: "甲", element: "wood", yinYang: "yang" },
  { key: "eul", hangul: "을", hanja: "乙", element: "wood", yinYang: "yin" },
  { key: "byeong", hangul: "병", hanja: "丙", element: "fire", yinYang: "yang" },
  { key: "jeong", hangul: "정", hanja: "丁", element: "fire", yinYang: "yin" },
  { key: "mu", hangul: "무", hanja: "戊", element: "earth", yinYang: "yang" },
  { key: "gi", hangul: "기", hanja: "己", element: "earth", yinYang: "yin" },
  { key: "gyeong", hangul: "경", hanja: "庚", element: "metal", yinYang: "yang" },
  { key: "sin", hangul: "신", hanja: "辛", element: "metal", yinYang: "yin" },
  { key: "im", hangul: "임", hanja: "壬", element: "water", yinYang: "yang" },
  { key: "gye", hangul: "계", hanja: "癸", element: "water", yinYang: "yin" },
];

const hidden = (...indices: number[]) => indices.map((index) => STEMS[index]);

export const BRANCHES: BranchInfo[] = [
  { key: "ja", hangul: "자", hanja: "子", element: "water", yinYang: "yang", hiddenStems: hidden(9) },
  { key: "chuk", hangul: "축", hanja: "丑", element: "earth", yinYang: "yin", hiddenStems: hidden(5, 9, 7) },
  { key: "in", hangul: "인", hanja: "寅", element: "wood", yinYang: "yang", hiddenStems: hidden(0, 2, 4) },
  { key: "myo", hangul: "묘", hanja: "卯", element: "wood", yinYang: "yin", hiddenStems: hidden(1) },
  { key: "jin", hangul: "진", hanja: "辰", element: "earth", yinYang: "yang", hiddenStems: hidden(4, 1, 9) },
  { key: "sa", hangul: "사", hanja: "巳", element: "fire", yinYang: "yin", hiddenStems: hidden(2, 4, 6) },
  { key: "o", hangul: "오", hanja: "午", element: "fire", yinYang: "yang", hiddenStems: hidden(3, 5) },
  { key: "mi", hangul: "미", hanja: "未", element: "earth", yinYang: "yin", hiddenStems: hidden(5, 3, 1) },
  { key: "sin", hangul: "신", hanja: "申", element: "metal", yinYang: "yang", hiddenStems: hidden(6, 8, 4) },
  { key: "yu", hangul: "유", hanja: "酉", element: "metal", yinYang: "yin", hiddenStems: hidden(7) },
  { key: "sul", hangul: "술", hanja: "戌", element: "earth", yinYang: "yang", hiddenStems: hidden(4, 7, 3) },
  { key: "hae", hangul: "해", hanja: "亥", element: "water", yinYang: "yin", hiddenStems: hidden(8, 0) },
];

export const ELEMENT_ORDER: ElementName[] = ["wood", "fire", "earth", "metal", "water"];

export const ELEMENT_CREATES: Record<ElementName, ElementName> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

export const ELEMENT_CONTROLS: Record<ElementName, ElementName> = {
  wood: "earth",
  fire: "metal",
  earth: "water",
  metal: "wood",
  water: "fire",
};

export const CITY_OPTIONS = [
  { name: "서울특별시, 대한민국", latitude: 37.5665, longitude: 126.978 },
  { name: "부산광역시, 대한민국", latitude: 35.1796, longitude: 129.0756 },
  { name: "대구광역시, 대한민국", latitude: 35.8714, longitude: 128.6014 },
  { name: "인천광역시, 대한민국", latitude: 37.4563, longitude: 126.7052 },
  { name: "광주광역시, 대한민국", latitude: 35.1595, longitude: 126.8514 },
  { name: "대전광역시, 대한민국", latitude: 36.3504, longitude: 127.3845 },
  { name: "울산광역시, 대한민국", latitude: 35.5384, longitude: 129.3114 },
  { name: "세종특별자치시, 대한민국", latitude: 36.4801, longitude: 127.289 },
  { name: "제주특별자치도, 대한민국", latitude: 33.4996, longitude: 126.5312 },
] as const;

export const DEFAULT_CURRENT_DATE_TIME = "2026-07-02T12:30:00+09:00";
