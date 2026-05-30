/* Data */
var KEY = "hilalClubSystemV2";
var SPLASH_MIN_DURATION = 2200;
var SPLASH_MAX_DURATION = 2500;
var defaults = {
  selectedSport: { en: "Weightlifting", ar: "رفع الأثقال" },
  sportCode: "A7-3K-L9",
  supportWhatsapp: "966500000000",
  appName: "إدارة النادي",
  dailyWorkouts: [
    {
      title: "رفعة الخطف",
      details: "4 مجموعات × 8 تكرار",
      group: "فئة الكبار",
      note: "التركيز على الثبات",
    },
    {
      title: "النتر",
      details: "5 مجموعات × 5 تكرار",
      group: "فئة الكبار",
      note: "راحة 90 ثانية",
    },
    {
      title: "سكوات خلفي",
      details: "4 مجموعات × 10 تكرار",
      group: "فئة الكبار",
      note: "وزن متوسط",
    },
  ],
  players: [
    {
      id: 1,
      name: "محمد السهيمي",
      age: 36,
      group: "فئة الكبار",
      present: true,
      points: 4,
      phone: "0500000001",
      note: "",
    },
    {
      id: 2,
      name: "محمد فرج",
      age: 35,
      group: "فئة الكبار",
      present: true,
      points: 1,
      phone: "0500000002",
      note: "",
    },
    {
      id: 3,
      name: "أحمد محمد",
      age: 24,
      group: "فئة الكبار",
      present: true,
      points: 8,
      phone: "0500000003",
      note: "يحتاج متابعة في التكنيك",
    },
    {
      id: 4,
      name: "خالد محمد",
      age: 19,
      group: "فئة الشباب",
      present: false,
      points: 3,
      phone: "0500000004",
      note: "",
    },
    {
      id: 5,
      name: "ناصر عبدالعزيز",
      age: 16,
      group: "فئة الناشئين",
      present: true,
      points: 6,
      phone: "0500000005",
      note: "",
    },
    {
      id: 6,
      name: "سعود زميل",
      age: 14,
      group: "فئة البراعم",
      present: true,
      points: 5,
      phone: "0500000006",
      note: "",
    },
  ],
  weeklyPlan: [
    { day: "الأحد", workout: "تمارين القوة - سكوات خلفي 4 × 10" },
    { day: "الاثنين", workout: "تمارين المهارة - تكنيك الرفعة 45 دقيقة" },
    { day: "الثلاثاء", workout: "استشفاء وتمطيط 30 دقيقة" },
    { day: "الأربعاء", workout: "اختبار الأداء - سرعة وقوة" },
    { day: "الخميس", workout: "تمرين شامل حسب توجيه المدرب" },
  ],
};
var sports = [
  [
    "Weightlifting",
    "رفع الأثقال",
    128,
    "assets/optimized/رفع الاثقال.webp",
  ],
  [
    "Swimming",
    "السباحة",
    64,
    "assets/optimized/السباحة.webp",
  ],
  [
    "Karate",
    "الكاراتيه",
    55,
    "assets/optimized/الكاراتيه.webp",
  ],
  [
    "Jiu-Jitsu",
    "جوجيتسو",
    42,
    "assets/optimized/جوجيتسو.webp",
  ],
  [
    "Badminton",
    "ريشة الطائرة",
    38,
    "assets/optimized/ريشة الطائرة.webp",
  ],
  [
    "Basketball",
    "كرة السلة",
    62,
    "assets/optimized/سلة.webp",
  ],
  [
    "Volleyball",
    "كرة الطائرة",
    58,
    "assets/optimized/طائرة.webp",
  ],
  [
    "Athletics",
    "ألعاب القوى",
    57,
    "assets/optimized/العاب القوة.webp",
  ],
];
var groups = ["فئة الكبار", "فئة الشباب", "فئة الناشئين", "فئة البراعم"];
var $ = (id) => document.getElementById(id);

var state;
var splashProgress = 0;
/* State */
function load() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return JSON.parse(JSON.stringify(defaults));
  }
}
function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}
