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
