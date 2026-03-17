import type { Member } from "@/types/member"

export const mockLeaders: Member[] = [
  {
    id: 1,
    name: "Alexandra Chen",
    role: "Guild Master",
    title: "President & Founder",
    bgColor: "bg-mint",
    bio: "Alexandra has been leading our community for 3 years with passion and dedication. She specializes in community building, strategic planning, and fostering meaningful connections among members.",
    rank: "Executive Leader",
    social: { twitter: "#", instagram: "#", linkedin: "#" },
  },
  {
    id: 2,
    name: "Marcus Rivera",
    role: "Deputy Leader",
    title: "Vice President",
    bgColor: "bg-lavender",
    bio: "Marcus brings 5 years of experience in team coordination. He ensures smooth operations and supports all club initiatives with unwavering commitment.",
    rank: "Senior Executive",
    social: { twitter: "#", instagram: "#", linkedin: "#" },
  },
  {
    id: 3,
    name: "Sophie Williams",
    role: "Events Director",
    title: "Head of Events",
    bgColor: "bg-coral",
    bio: "Sophie is the creative force behind all our memorable events. Her attention to detail and innovative ideas make every gathering special.",
    rank: "Director",
    social: { twitter: "#", instagram: "#", linkedin: "#" },
  },
  {
    id: 4,
    name: "James Park",
    role: "Community Lead",
    title: "Head of Engagement",
    bgColor: "bg-peach",
    bio: "James focuses on member engagement and building meaningful connections within our community. He ensures every member feels valued.",
    rank: "Director",
    social: { twitter: "#", instagram: "#", linkedin: "#" },
  },
]

export const mockCommunityMembers: Member[] = [
  { id: 5, name: "Emma Thompson", role: "Designer", bgColor: "bg-peach" },
  { id: 6, name: "Liam Johnson", role: "Developer", bgColor: "bg-lavender" },
  { id: 7, name: "Olivia Davis", role: "Photographer", bgColor: "bg-coral/50" },
  { id: 8, name: "Noah Wilson", role: "Writer", bgColor: "bg-cream" },
  { id: 9, name: "Ava Martinez", role: "Artist", bgColor: "bg-mint/60" },
  { id: 10, name: "William Brown", role: "Musician", bgColor: "bg-peach" },
  { id: 11, name: "Sophia Taylor", role: "Animator", bgColor: "bg-lavender" },
  { id: 12, name: "James Anderson", role: "Filmmaker", bgColor: "bg-coral/50" },
  { id: 13, name: "Isabella Thomas", role: "Illustrator", bgColor: "bg-cream" },
  { id: 14, name: "Benjamin Lee", role: "Sculptor", bgColor: "bg-mint/60" },
  { id: 15, name: "Mia White", role: "Dancer", bgColor: "bg-peach" },
  { id: 16, name: "Lucas Harris", role: "Chef", bgColor: "bg-lavender" },
]

export const mockAllMembers: Member[] = [...mockLeaders, ...mockCommunityMembers]

// Gallery mock data
export interface GalleryPhoto {
  id: number
  images: string[]       // multiple images per album
  albumTitle: string
  description: string
  width: number
  height: number
  date: string // ISO date string
  category: string
}

const categories = ["活動！", "聚會！", "下午茶！", "幕後花絮！"]

const albumTitles = [
  "春季社遊", "工作坊紀錄", "年末聚餐", "社團日常",
  "迎新活動", "創意發表", "下午茶時光", "街拍散步",
  "週末出遊", "手作體驗", "慶生派對", "讀書會",
  "音樂之夜", "電影欣賞", "攝影練習", "志工服務",
  "跨年派對", "野餐日", "桌遊大會", "烘焙課程",
  "登山健行", "市集探索", "畢業季", "聖誕交換禮物",
]

const descriptions = [
  "一起留下的美好回憶", "每一刻都值得珍藏",
  "笑聲與歡樂的瞬間", "用鏡頭記錄我們的故事",
  "最棒的時光總是不期而遇", "感謝每一位的參與",
]

// Generate random heights for masonry effect
const photoSizes: [number, number][] = [
  [400, 600], [400, 300], [400, 500], [400, 400],
  [400, 350], [400, 550], [400, 450], [400, 300],
  [400, 500], [400, 600], [400, 350], [400, 400],
  [400, 550], [400, 300], [400, 450], [400, 500],
  [400, 600], [400, 350], [400, 400], [400, 500],
  [400, 300], [400, 550], [400, 450], [400, 600],
]

export const mockGalleryPhotos: GalleryPhoto[] = photoSizes.map(([w, h], i) => {
  // Mix of single photos and albums: every 3rd card is single
  const imageCount = i % 3 === 0 ? 1 : 3 + (i % 4)
  const images = Array.from({ length: imageCount }, (_, j) =>
    `https://picsum.photos/seed/gallery${i + 1}_${j}/${w}/${h}`
  )

  return {
    id: i + 1,
    images,
    albumTitle: albumTitles[i % albumTitles.length],
    description: descriptions[i % descriptions.length],
    width: w,
    height: h,
    date: generateRandomDate(i),
    category: categories[i % categories.length],
  }
})

function generateRandomDate(seed: number): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const day = now.getDate()

  // Spread photos across: today, this month, this year, and older
  if (seed < 4) {
    // Today
    return new Date(year, month, day, 10 + seed).toISOString()
  } else if (seed < 10) {
    // This month
    const d = Math.max(1, day - (seed * 2))
    return new Date(year, month, d).toISOString()
  } else if (seed < 18) {
    // This year
    const m = Math.max(0, month - (seed - 9))
    return new Date(year, m, 15).toISOString()
  } else {
    // Last year
    return new Date(year - 1, 11 - (seed - 18), 10).toISOString()
  }
}
