import { 
  Palette, 
  Users, 
  Calendar, 
  MessageCircle, 
  Camera, 
  Sparkles 
} from "lucide-react"

const features = [
  {
    title: "Creative Workshops",
    description: "Weekly sessions to explore new skills and techniques",
    icon: Palette,
    className: "col-span-2 row-span-1 bg-mint/10",
    iconBg: "bg-mint/25",
  },
  {
    title: "Community Events",
    description: "Monthly gatherings and celebrations",
    icon: Calendar,
    className: "col-span-1 row-span-1 bg-lavender",
    iconBg: "bg-mint/20",
  },
  {
    title: "Photo Gallery",
    description: "Capturing our best moments",
    icon: Camera,
    className: "col-span-1 row-span-2 bg-mint/15",
    iconBg: "bg-mint/30",
  },
  {
    title: "Active Forums",
    description: "Share ideas and connect",
    icon: MessageCircle,
    className: "col-span-1 row-span-1 bg-lavender",
    iconBg: "bg-mint/20",
  },
  {
    title: "Member Network",
    description: "Connect with 500+ members worldwide",
    icon: Users,
    className: "col-span-1 row-span-1 bg-mint/10",
    iconBg: "bg-mint/25",
  },
  {
    title: "Special Projects",
    description: "Collaborate on exciting initiatives",
    icon: Sparkles,
    className: "col-span-2 row-span-1 bg-lavender",
    iconBg: "bg-mint/25",
  },
]

export function Features() {
  return (
    <section id="gallery" className="container mx-auto px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-block rounded-full bg-mint/20 px-4 py-1.5 text-sm font-medium text-foreground">
          What We Offer
        </span>
        <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Club Highlights
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          Discover what makes our community special
        </p>
      </div>

      {/* Bento Grid */}
      <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {features.map((feature) => (
          <div
            key={feature.title}
            className={`group rounded-3xl p-6 transition-all hover:shadow-lg md:p-8 ${feature.className}`}
          >
            <div
              className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${feature.iconBg}`}
            >
              <feature.icon className="h-6 w-6 text-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
