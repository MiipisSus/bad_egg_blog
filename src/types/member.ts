export interface Member {
  id: number
  name: string
  role: string
  title?: string
  bio?: string
  rank?: string
  image?: string | null
  nameCard?: string | null
  type: "leader" | "community"
  createdAt?: string
  updatedAt?: string
}
