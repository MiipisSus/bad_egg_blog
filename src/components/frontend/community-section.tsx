"use client"

const communityMembers = [
  { id: 1, name: "Emma Thompson", role: "Designer", image: "https://picsum.photos/seed/member1/400/500" },
  { id: 2, name: "Liam Johnson", role: "Developer", image: "https://picsum.photos/seed/member2/400/500" },
  { id: 3, name: "Olivia Davis", role: "Photographer", image: "https://picsum.photos/seed/member3/400/500" },
  { id: 4, name: "Noah Wilson", role: "Writer", image: "https://picsum.photos/seed/member4/400/500" },
  { id: 5, name: "Ava Martinez", role: "Artist", image: "https://picsum.photos/seed/member5/400/500" },
  { id: 6, name: "William Brown", role: "Musician", image: "https://picsum.photos/seed/member6/400/500" },
  { id: 7, name: "Sophia Taylor", role: "Animator", image: "https://picsum.photos/seed/member7/400/500" },
  { id: 8, name: "James Anderson", role: "Filmmaker", image: "https://picsum.photos/seed/member8/400/500" },
  { id: 9, name: "Isabella Thomas", role: "Illustrator", image: "https://picsum.photos/seed/member9/400/500" },
  { id: 10, name: "Benjamin Lee", role: "Sculptor", image: "https://picsum.photos/seed/member10/400/500" },
  { id: 11, name: "Mia White", role: "Dancer", image: "https://picsum.photos/seed/member11/400/500" },
  { id: 12, name: "Lucas Harris", role: "Chef", image: "https://picsum.photos/seed/member12/400/500" },
]

export function CommunitySection() {

  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <span className="inline-block rounded-full bg-peach/40 px-5 py-2 text-sm font-medium text-foreground">
            Community
          </span>
          <h2 className="mt-4 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Community Members
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
            The talented individuals who bring our community to life
          </p>
        </div>

        {/* Grid - no gap, no rounded corners */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {communityMembers.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </section>
  )
}

interface MemberCardProps {
  member: (typeof communityMembers)[0]
}

function MemberCard({ member }: MemberCardProps) {
  return (
    <div className="group relative cursor-pointer overflow-hidden">
      {/* Background image - scales on hover */}
      <img
        src={member.image}
        alt={member.name}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40 transition-colors duration-300 group-hover:bg-black/50" />

      {/* Card Content */}
      <div className="relative z-10 flex aspect-[4/5] flex-col items-center justify-end p-6 pb-8">
        {/* Name */}
        <h3 className="text-center text-xl font-bold text-white drop-shadow-md">{member.name}</h3>

        {/* Role Badge */}
        <span className="mt-3 inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white/80 backdrop-blur-sm">
          {member.role}
        </span>
      </div>
    </div>
  )
}
