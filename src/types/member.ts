export interface Member {
  id: number
  name: string
  role: string
  title?: string
  bio?: string
  rank?: string
  bgColor: string
  social?: {
    twitter?: string
    instagram?: string
    linkedin?: string
  }
}
