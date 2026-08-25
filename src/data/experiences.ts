export type Category =
  | "home"
  | "outing"
  | "food"
  | "experience"
  | "hobby";

export const CATEGORY_LABELS: Record<Category, string> = {
  home: "家でできる",
  outing: "おでかけ",
  food: "食べる",
  experience: "体験",
  hobby: "趣味・学ぶ",
};

export const CATEGORY_ORDER: Category[] = [
  "home",
  "outing",
  "food",
  "hobby",
];

export type CostLevel = 0 | 1 | 2 | 3;

export const COST_LEVEL_LABELS: Record<CostLevel, string> = {
  0: "無料",
  1: "〜2,000円",
  2: "〜5,000円",
  3: "5,000円〜",
};

export interface Experience {
  id: string;
  image?: string;
  title: string;
  description: string;
  category: Category;
  categoryId?: string;
  categoryCode?: string;
  categoryLabel?: string;
  place: string;
  locationOptionId?: string;
  locationCode?: string;
  locationLabel?: string;
  time: string;
  timeMinutes: number;
  durationOptionId?: string;
  durationCode?: string;
  durationLabel?: string;
  durationMinMinutes?: number;
  durationMaxMinutes?: number;
  cost: string;
  costLevel: CostLevel;
  budgetOptionId?: string;
  budgetCode?: string;
  budgetLabel?: string;
  budgetMinYen?: number;
  budgetMaxYen?: number;
  solo: boolean;
  minPeople?: number;
  maxPeople?: number;
  exampleTargets?: string[];
}

export function experienceCategoryLabel(experience: Experience) {
  return experience.categoryLabel ?? CATEGORY_LABELS[experience.category];
}

export function categoryFromCode(code: string): Category {
  if (code === "food") return "food";
  if (code === "outing") return "outing";
  if (code === "hobby" || code === "hobby-learning" || code === "learning") return "hobby";
  if (code === "lifestyle") return "home";
  return "experience";
}

export const DEFAULT_EXPERIENCE_TARGETS: Record<string, string[]> = {
  "goshuin-collection": ["出雲大社", "伊勢神宮"],
  "restaurant-collection": ["○○ダイニング", "○○鮨"],
};

export const experiences: Experience[] = [
  {
    id: "goshuin-collection",
    title: "御朱印を集める",
    description: "神社やお寺を訪ねて、お参りの記録をひとつずつ残す。",
    category: "outing",
    place: "神社・お寺",
    time: "1時間ほど",
    timeMinutes: 60,
    cost: "御朱印代など",
    costLevel: 1,
    solo: true,
    exampleTargets: DEFAULT_EXPERIENCE_TARGETS["goshuin-collection"],
  },
  {
    id: "restaurant-collection",
    title: "気になっているレストランに行く",
    description: "気になるお店を見つけたら、いつか行きたい場所として残しておく。",
    category: "food",
    place: "レストラン",
    time: "1〜2時間",
    timeMinutes: 90,
    cost: "お店による",
    costLevel: 2,
    solo: true,
    exampleTargets: DEFAULT_EXPERIENCE_TARGETS["restaurant-collection"],
  },
  {
    id: "pottery-bowl",
    image: "/experiences/pottery-bowl.png",
    title: "陶芸で自分のお茶碗を作る",
    description: "土をこねて、世界にひとつのお茶碗を。焼き上がりを待つ時間もまた楽しい。",
    category: "hobby",
    place: "陶芸教室",
    time: "2〜3時間",
    timeMinutes: 150,
    cost: "4,000〜6,000円",
    costLevel: 2,
    solo: true,
  },
  {
    id: "spice-curry",
    image: "/experiences/spice-curry.png",
    title: "スパイスからカレーを作る",
    description: "クミン、コリアンダー、ターメリック。香りを重ねていく、いつもと違う台所の時間。",
    category: "food",
    place: "自宅",
    time: "1〜2時間",
    timeMinutes: 90,
    cost: "1,500円ほど",
    costLevel: 1,
    solo: true,
  },
  {
    id: "solo-ferry",
    image: "/experiences/solo-ferry.png",
    title: "一人でフェリーに乗る",
    description: "行き先を決めずに、ただ海を渡る。潮風とエンジン音だけの数時間。",
    category: "outing",
    place: "港",
    time: "半日〜1日",
    timeMinutes: 360,
    cost: "3,000〜8,000円",
    costLevel: 2,
    solo: true,
  },
  {
    id: "planetarium",
    image: "/experiences/planetarium.png",
    title: "プラネタリウムへ行く",
    description: "暗闇に浮かぶ星空を見上げる、静かな1時間。何も考えなくていい贅沢。",
    category: "outing",
    place: "科学館",
    time: "1時間ほど",
    timeMinutes: 60,
    cost: "〜1,500円",
    costLevel: 1,
    solo: true,
  },
  {
    id: "watercolor",
    title: "水彩で風景を描く",
    description: "上手さは関係ない。紙の上に色がにじんでいく、その瞬間を楽しむだけでいい。",
    category: "hobby",
    place: "自宅・屋外",
    time: "1〜2時間",
    timeMinutes: 90,
    cost: "〜2,000円",
    costLevel: 1,
    solo: true,
  },
  {
    id: "solo-kissaten",
    title: "一人で喫茶店に行く",
    description: "分厚いメニューとナポリタン。誰にも急かされない、自分だけの午後。",
    category: "food",
    place: "喫茶店",
    time: "1時間ほど",
    timeMinutes: 60,
    cost: "〜1,500円",
    costLevel: 1,
    solo: true,
  },
  {
    id: "sento-tour",
    title: "銭湯めぐりをする",
    description: "近所にある知らない銭湯の扉を開けてみる。湯上がりのコーヒー牛乳まで含めて完成。",
    category: "outing",
    place: "銭湯",
    time: "1〜2時間",
    timeMinutes: 90,
    cost: "〜1,000円",
    costLevel: 1,
    solo: true,
  },
  {
    id: "night-market",
    title: "夜市・朝市をのぞきに行く",
    description: "普段の生活時間とずれた場所に行ってみる。知らない匂いと知らない活気。",
    category: "outing",
    place: "市場",
    time: "1〜2時間",
    timeMinutes: 90,
    cost: "〜2,000円",
    costLevel: 1,
    solo: false,
  },
  {
    id: "handmade-bread",
    title: "パンを一から手ごねで焼く",
    description: "発酵を待つあいだの時間もレシピのうち。焼きたての香りが部屋いっぱいに広がる。",
    category: "food",
    place: "自宅",
    time: "3〜4時間",
    timeMinutes: 210,
    cost: "1,000円ほど",
    costLevel: 1,
    solo: true,
  },
  {
    id: "letterpress",
    title: "活版印刷でカードを刷る",
    description: "インクの匂いと紙に沈む文字の凹凸。デジタルにはない手ざわりを味わう。",
    category: "hobby",
    place: "印刷工房",
    time: "2時間ほど",
    timeMinutes: 120,
    cost: "3,000〜5,000円",
    costLevel: 2,
    solo: true,
  },
  {
    id: "night-hike",
    title: "夜の山でナイトハイクをする",
    description: "懐中電灯の光だけを頼りに歩く夜道。虫の声と星空がいつもより近い。",
    category: "outing",
    place: "山・森",
    time: "2〜3時間",
    timeMinutes: 150,
    cost: "〜3,000円",
    costLevel: 1,
    solo: false,
  },
  {
    id: "sake-tasting",
    title: "日本酒の利き酒をしてみる",
    description: "香り、口当たり、余韻。同じ米から生まれる味の違いを言葉にしてみる。",
    category: "food",
    place: "酒蔵・バー",
    time: "1〜2時間",
    timeMinutes: 90,
    cost: "3,000〜5,000円",
    costLevel: 2,
    solo: true,
  },
  {
    id: "leather-craft",
    title: "革小物を自分の手で作る",
    description: "型を抜き、穴をあけ、糸を通す。使うほどに手になじんでいく道具を自分で。",
    category: "hobby",
    place: "レザークラフト教室",
    time: "3時間ほど",
    timeMinutes: 180,
    cost: "5,000円〜",
    costLevel: 3,
    solo: true,
  },
  {
    id: "unfamiliar-cuisine",
    title: "食べたことのない国の料理店に入る",
    description: "メニューの読み方すら分からない店へ。知らない味との出会いは、小さな旅になる。",
    category: "food",
    place: "レストラン",
    time: "1〜2時間",
    timeMinutes: 90,
    cost: "2,000〜4,000円",
    costLevel: 2,
    solo: true,
  },
  {
    id: "stargazing",
    title: "天体観測に出かける",
    description: "望遠鏡越しに見る土星の輪。教科書の中の存在が、目の前の光になる夜。",
    category: "outing",
    place: "天文台・高原",
    time: "2〜3時間",
    timeMinutes: 150,
    cost: "〜3,000円",
    costLevel: 1,
    solo: false,
  },
  {
    id: "calligraphy",
    title: "書道で好きな言葉を書く",
    description: "墨をすり、呼吸を整え、一筆で決める。静けさそのものが目的になる時間。",
    category: "hobby",
    place: "自宅・書道教室",
    time: "1時間ほど",
    timeMinutes: 60,
    cost: "〜2,000円",
    costLevel: 1,
    solo: true,
  },
  {
    id: "day-trip-onsen",
    title: "日帰り温泉でひとり旅気分を味わう",
    description: "電車に揺られて、湯につかって、帰る。それだけで小さな旅行になる。",
    category: "outing",
    place: "温泉",
    time: "半日",
    timeMinutes: 300,
    cost: "3,000〜6,000円",
    costLevel: 2,
    solo: true,
  },
  {
    id: "terrarium",
    title: "テラリウムで小さな庭を作る",
    description: "ガラス瓶の中に、苔と石で風景を組む。机の上に自分だけの景色を置く。",
    category: "hobby",
    place: "自宅",
    time: "1時間ほど",
    timeMinutes: 60,
    cost: "2,000〜4,000円",
    costLevel: 2,
    solo: true,
  },
];
