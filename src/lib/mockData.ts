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
  src: string
  alt: string
  width: number
  height: number
  date: string // ISO date string
  category: string
}

const categories = ["活動！", "聚會！", "下午茶！", "幕後花絮！"]

// Generate random heights for masonry effect
const photoSizes: [number, number][] = [
  [400, 600], [400, 300], [400, 500], [400, 400],
  [400, 350], [400, 550], [400, 450], [400, 300],
  [400, 500], [400, 600], [400, 350], [400, 400],
  [400, 550], [400, 300], [400, 450], [400, 500],
  [400, 600], [400, 350], [400, 400], [400, 500],
  [400, 300], [400, 550], [400, 450], [400, 600],
]

export const mockGalleryPhotos: GalleryPhoto[] = photoSizes.map(([w, h], i) => ({
  id: i + 1,
  src: `https://picsum.photos/seed/gallery${i + 1}/${w}/${h}`,
  alt: `Gallery photo ${i + 1}`,
  width: w,
  height: h,
  date: generateRandomDate(i),
  category: categories[i % categories.length],
}))

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
