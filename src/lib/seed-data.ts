// The demo studio: one seed used by `npm run db:seed` and the /api/seed route.
//
// Re-runnable — it wipes first. Dates are relative to "today" so the sample
// data never goes stale.

import type { PrismaClient } from "../generated/prisma/client";

/** Days from today, as a Date. */
const day = (offset: number) => {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
};

/** True when the database already holds any data worth protecting. */
export async function hasData(db: PrismaClient): Promise<boolean> {
  const [projects, guests, sponsors] = await Promise.all([
    db.project.count(),
    db.guest.count(),
    db.sponsor.count(),
  ]);
  return projects + guests + sponsors > 0;
}

/** Wipe and reseed everything. Returns the row counts written. */
export async function seedAll(db: PrismaClient) {
  // Wipe in dependency order so the seed is re-runnable.
  await db.interaction.deleteMany();
  await db.accessGrant.deleteMany();
  await db.person.deleteMany();
  await db.sponsor.deleteMany();
  await db.ticketOrder.deleteMany();
  await db.booking.deleteMany();
  await db.contentPiece.deleteMany();
  await db.event.deleteMany();
  await db.task.deleteMany();
  await db.project.deleteMany();
  await db.speaker.deleteMany();
  await db.guest.deleteMany();
  await db.topic.deleteMany();

  // ------------------------------------------------------------------ Topics
  const topicSeed = [
    { name: "Creative Direction", category: "Craft", status: "Active", description: "Holding a coherent visual point of view across a whole body of work." },
    { name: "Brand Systems", category: "Strategy", status: "Active", description: "Designing identity as a system rather than a set of one-off assets." },
    { name: "Building a Studio", category: "Business", status: "Active", description: "Pricing, hiring, and the operational side of running a creative practice." },
    { name: "AI in the Studio", category: "Technology", status: "Active", description: "Where generative tools genuinely help creative teams, and where they don't." },
    { name: "Creative Burnout", category: "Wellbeing", status: "Exploratory", description: "Sustaining output without grinding people down." },
    { name: "Community as Product", category: "Culture", status: "Exploratory", description: "Treating an audience as something you design for, not broadcast at." },
    { name: "Print Revival", category: "Craft", status: "Retired", description: "Parked after the 2025 series underperformed." },
  ];
  const topics = Object.fromEntries(
    await Promise.all(
      topicSeed.map(async (t) => [t.name, await db.topic.create({ data: t })] as const),
    ),
  );

  // ---------------------------------------------------------------- Projects
  const summit = await db.project.create({
    data: {
      name: "Create Summit 2026",
      client: "Jordan Create",
      status: "Active",
      owner: "Jordan",
      summary: "The flagship two-day gathering. Programming, production, and the content engine around it.",
      startDate: day(-70),
      dueDate: day(58),
      budget: 240000,
    },
  });

  const rebrand = await db.project.create({
    data: {
      name: "Northwind Rebrand",
      client: "Northwind Coffee",
      status: "Active",
      owner: "Priya",
      summary: "Full identity system, packaging, and rollout guidelines for 40 storefronts.",
      startDate: day(-35),
      dueDate: day(26),
      budget: 88000,
    },
  });

  const studioBrand = await db.project.create({
    data: {
      name: "Studio Brand Refresh",
      client: "Jordan Create",
      status: "Discovery",
      owner: "Jordan",
      summary: "Our own identity is three years old and no longer matches the work.",
      startDate: day(-8),
      dueDate: day(92),
      budget: 30000,
    },
  });

  const atlas = await db.project.create({
    data: {
      name: "Atlas Field Guide",
      client: "Atlas Outdoors",
      status: "Delivered",
      owner: "Marcus",
      summary: "128-page print guide plus a companion microsite.",
      startDate: day(-160),
      dueDate: day(-24),
      budget: 54000,
    },
  });

  await db.project.create({
    data: {
      name: "Meridian Launch Film",
      client: "Meridian Health",
      status: "Blocked",
      owner: "Priya",
      summary: "Waiting on legal sign-off for the clinical claims in the voiceover.",
      startDate: day(-42),
      dueDate: day(12),
      budget: 67000,
    },
  });

  // ------------------------------------------------------------------- Tasks
  await db.task.createMany({
    data: [
      { title: "Lock the main-stage running order", status: "Doing", priority: "Urgent", assignee: "Jordan", dueDate: day(4), projectId: summit.id },
      { title: "Send speaker travel briefs", status: "Todo", priority: "High", assignee: "Sam", dueDate: day(9), projectId: summit.id },
      { title: "Confirm AV vendor contract", status: "Blocked", priority: "High", assignee: "Sam", dueDate: day(2), notes: "Vendor has not returned the redlined contract.", projectId: summit.id },
      { title: "Design the stage backdrop", status: "Todo", priority: "Medium", assignee: "Marcus", dueDate: day(21), projectId: summit.id },
      { title: "Ticket page copy pass", status: "Done", priority: "Medium", assignee: "Priya", dueDate: day(-6), projectId: summit.id },
      { title: "Packaging dielines v3", status: "Doing", priority: "High", assignee: "Marcus", dueDate: day(5), projectId: rebrand.id },
      { title: "Present logo routes to client", status: "Done", priority: "Urgent", assignee: "Priya", dueDate: day(-11), projectId: rebrand.id },
      { title: "Store signage audit", status: "Todo", priority: "Low", assignee: "Marcus", dueDate: day(18), projectId: rebrand.id },
      { title: "Competitive audit for our own positioning", status: "Doing", priority: "Medium", assignee: "Jordan", dueDate: day(14), projectId: studioBrand.id },
      { title: "Archive Atlas project files", status: "Todo", priority: "Low", assignee: "Sam", dueDate: day(7), projectId: atlas.id },
      { title: "Q3 freelancer rate review", status: "Todo", priority: "Medium", assignee: "Jordan", dueDate: day(30) },
      { title: "Renew studio insurance", status: "Todo", priority: "High", assignee: "Sam", dueDate: day(-3) },
    ],
  });

  // ---------------------------------------------------------------- Speakers
  const speakerSeed = [
    {
      data: { name: "Maya Okonkwo", role: "Founder & Creative Director", company: "Field Studio", email: "maya@fieldstudio.co", location: "Lagos, NG", status: "Confirmed", fee: "$12k–15k", website: "https://fieldstudio.co", bio: "Built Field Studio from a two-person shop into a 30-person practice without taking outside money." },
      topics: ["Creative Direction", "Building a Studio"],
    },
    {
      data: { name: "Daniel Ruiz", role: "Head of Design", company: "Loop", email: "d.ruiz@loop.io", location: "Mexico City, MX", status: "Confirmed", fee: "$8k–10k", bio: "Runs design at a 400-person product company and writes about design systems at scale." },
      topics: ["Brand Systems", "AI in the Studio"],
    },
    {
      data: { name: "Ingrid Halvorsen", role: "Independent Consultant", company: "—", email: "ingrid@halvorsen.no", location: "Oslo, NO", status: "Invited", fee: "$6k", bio: "Twenty years in packaging design, now advising food and beverage founders." },
      topics: ["Brand Systems", "Creative Direction"],
    },
    {
      data: { name: "Tobi Adeyemi", role: "Creative Technologist", company: "Nine Volt", email: "tobi@ninevolt.dev", location: "London, UK", status: "Invited", fee: "$5k–7k", bio: "Builds the weird internal tools that creative teams end up depending on." },
      topics: ["AI in the Studio", "Community as Product"],
    },
    {
      data: { name: "Renata Silva", role: "Executive Coach", company: "Still Water", email: "renata@stillwater.co", location: "São Paulo, BR", status: "Prospect", fee: "TBD", bio: "Works with creative leaders on the parts of the job nobody trained them for." },
      topics: ["Creative Burnout"],
    },
    {
      data: { name: "Anders Vik", role: "Partner", company: "Vik & Sons", email: "anders@vikandsons.se", location: "Stockholm, SE", status: "Declined", fee: "$9k", bio: "Declined for 2026 — on sabbatical until the autumn." },
      topics: ["Building a Studio"],
    },
    {
      data: { name: "Chiara Bellini", role: "Editor-in-Chief", company: "Format Magazine", email: "chiara@formatmag.it", location: "Milan, IT", status: "Alumni", fee: "$4k", bio: "Spoke at the 2025 summit on independent publishing. Consistently the top-rated session." },
      topics: ["Community as Product", "Creative Direction"],
    },
  ];

  const speakers: Record<string, { id: string }> = {};
  for (const s of speakerSeed) {
    speakers[s.data.name] = await db.speaker.create({
      data: {
        ...s.data,
        topics: { connect: [...new Set(s.topics)].map((t) => ({ id: topics[t].id })) },
      },
    });
  }

  // ------------------------------------------------------------------ Events
  const summitEvent = await db.event.create({
    data: {
      name: "Create Summit 2026",
      format: "Conference",
      status: "Planning",
      venue: "The Foundry",
      city: "Brooklyn, NY",
      startDate: day(58),
      endDate: day(59),
      capacity: 450,
      summary: "Two days, one stage, no panels. The whole studio ships against this date.",
      projectId: summit.id,
    },
  });

  const workshop = await db.event.create({
    data: {
      name: "Systems Workshop: Spring Cohort",
      format: "Workshop",
      status: "Confirmed",
      venue: "Studio A",
      city: "Brooklyn, NY",
      startDate: day(16),
      endDate: day(16),
      capacity: 24,
      summary: "One-day intensive on building a brand system that survives handoff.",
    },
  });

  await db.event.create({
    data: {
      name: "Founders Dinner — London",
      format: "Dinner",
      status: "Concept",
      city: "London, UK",
      startDate: day(84),
      capacity: 18,
      summary: "Small table, no programming. Testing whether this becomes a series.",
    },
  });

  await db.event.create({
    data: {
      name: "Create Summit 2025",
      format: "Conference",
      status: "Complete",
      venue: "Pier 17",
      city: "Brooklyn, NY",
      startDate: day(-312),
      endDate: day(-311),
      capacity: 320,
      summary: "Sold out. 4.6/5 average session rating.",
    },
  });

  await db.event.create({
    data: {
      name: "AI Tooling Webinar",
      format: "Webinar",
      status: "Cancelled",
      startDate: day(-20),
      capacity: 500,
      summary: "Cancelled — collided with the Northwind presentation week.",
    },
  });

  // ---------------------------------------------------------------- Bookings
  await db.booking.createMany({
    data: [
      { eventId: summitEvent.id, speakerId: speakers["Maya Okonkwo"].id, slotTitle: "Opening keynote: The studio you can actually sustain", status: "Confirmed", startTime: day(58), fee: 14000 },
      { eventId: summitEvent.id, speakerId: speakers["Daniel Ruiz"].id, slotTitle: "Systems that survive their authors", status: "Confirmed", startTime: day(58), fee: 9000 },
      { eventId: summitEvent.id, speakerId: speakers["Ingrid Halvorsen"].id, slotTitle: "Packaging as the last honest medium", status: "Offered", startTime: day(59), fee: 6000 },
      { eventId: summitEvent.id, speakerId: speakers["Tobi Adeyemi"].id, slotTitle: "Build your own tools", status: "Held", startTime: day(59) },
      { eventId: workshop.id, speakerId: speakers["Daniel Ruiz"].id, slotTitle: "Workshop lead", status: "Confirmed", startTime: day(16), fee: 4000 },
    ],
  });

  // ------------------------------------------------------------------ Guests
  const guestSeed = [
    {
      data: { name: "Alina Petrov", category: "Creators", outlet: "Overlap", showName: "The Overlap Podcast", format: "Podcast", status: "Booked", email: "alina@overlap.fm", audienceSize: 42000, scheduledFor: day(11), angle: "Why the studio stopped taking retainer work." },
      topics: ["Building a Studio"],
    },
    {
      data: { name: "Desmond Clarke", category: "General Guests", outlet: "Fast Company", format: "Press", status: "Pitched", email: "dclarke@fastcompany.com", audienceSize: 900000, angle: "The Create Summit as a case study in owned audience." },
      topics: ["Community as Product", "Brand Systems"],
    },
    {
      data: { name: "Hana Yamamoto", category: "Designers", outlet: "Design Matters", showName: "Design Matters Live", format: "Livestream", status: "Recorded", email: "hana@designmatters.tv", audienceSize: 78000, scheduledFor: day(-9), angle: "Creative direction when the client has no taste." },
      topics: ["Creative Direction"],
    },
    {
      data: { name: "Owen Brady", category: "Creators", outlet: "The Grain", showName: "Grain Weekly", format: "Newsletter", status: "Published", email: "owen@thegrain.co", audienceSize: 31000, scheduledFor: day(-27), publishedUrl: "https://thegrain.co/issues/jordan-create", angle: "Studio economics, plainly explained." },
      topics: ["Building a Studio"],
    },
    {
      data: { name: "Priyanka Rao", category: "General Guests", outlet: "SXSW", format: "Panel", status: "Prospect", email: "programming@sxsw.com", audienceSize: 1200, angle: "Panel on AI and creative labour — worth doing only if we pick the other panelists." },
      topics: ["AI in the Studio"],
    },
    {
      data: { name: "Marcus Lowe", category: "Designers", outlet: "Creative Review", format: "Press", status: "Passed", email: "m.lowe@creativereview.co.uk", audienceSize: 210000, angle: "Passed — wanted an exclusive on the rebrand before it ships." },
      topics: ["Brand Systems"],
    },
    {
      data: { name: "Nadia Rahman", category: "Executives", outlet: "Harbour Group", showName: "The Long Game", format: "Podcast", status: "Pitched", email: "n.rahman@harbourgroup.com", audienceSize: 26000, angle: "What a 40-store retailer looks for when it hires a studio." },
      topics: ["Brand Systems", "Building a Studio"],
    },
    {
      data: { name: "Eleanor Voss", category: "Executives", outlet: "Bloomberg", format: "Broadcast", status: "Prospect", email: "evoss@bloomberg.net", audienceSize: 1400000, angle: "Creative services as a leading indicator — probably a stretch, but worth one call." },
      topics: ["Building a Studio"],
    },
    {
      data: { name: "Councillor Dale Ferris", category: "Government", outlet: "Brooklyn Arts Commission", format: "Panel", status: "Booked", email: "d.ferris@brooklynarts.gov", audienceSize: 300, scheduledFor: day(23), angle: "Public funding for design education — we bring the studio's apprenticeship data." },
      topics: ["Community as Product"],
    },
    {
      data: { name: "Sofia Marchetti", category: "Government", outlet: "EU Design Council", format: "Press", status: "Prospect", email: "s.marchetti@eudesign.eu", audienceSize: 12000, angle: "Standards work. Slow, unglamorous, and the kind of thing that compounds." },
      topics: ["Brand Systems"],
    },
    {
      data: { name: "Yuki Tanaka", category: "Artists", outlet: "Studio Tanaka", showName: "Making It", format: "Livestream", status: "Recorded", email: "yuki@studiotanaka.jp", audienceSize: 54000, scheduledFor: day(-14), angle: "Installation work and commercial work, and why she refuses to separate them." },
      topics: ["Creative Direction", "Creative Burnout"],
    },
    {
      data: { name: "Ade Bello", category: "Artists", outlet: "Frieze", format: "Press", status: "Passed", email: "abello@frieze.com", audienceSize: 180000, angle: "Passed — the piece needed an exhibition to hang on and we don't have one." },
      topics: ["Creative Direction"],
    },
    {
      data: { name: "Lena Fischer", category: "Designers", outlet: "Type Directors Club", format: "Panel", status: "Booked", email: "lena@tdc.org", audienceSize: 900, scheduledFor: day(31), angle: "Typography in identity systems that non-designers have to maintain." },
      topics: ["Brand Systems", "Creative Direction"],
    },
  ];

  for (const g of guestSeed) {
    await db.guest.create({
      data: {
        ...g.data,
        topics: { connect: g.topics.map((t) => ({ id: topics[t].id })) },
      },
    });
  }

  // ----------------------------------------------------------------- Content
  await db.contentPiece.create({
    data: {
      title: "What a summit actually costs",
      format: "Article",
      channel: "Studio journal",
      status: "Drafting",
      owner: "Jordan",
      brief: "A full P&L breakdown of the 2025 summit, published openly.",
      publishDate: day(13),
      projectId: summit.id,
      topics: { connect: [{ id: topics["Building a Studio"].id }] },
    },
  });

  await db.contentPiece.create({
    data: {
      title: "Northwind: designing for 40 storefronts",
      format: "Case Study",
      channel: "Website",
      status: "Idea",
      owner: "Priya",
      brief: "Ship two weeks after the rollout completes, with in-store photography.",
      publishDate: day(45),
      projectId: rebrand.id,
      topics: { connect: [{ id: topics["Brand Systems"].id }] },
    },
  });

  await db.contentPiece.create({
    data: {
      title: "The tools we actually use",
      format: "Newsletter",
      channel: "Email",
      status: "Scheduled",
      owner: "Tobi",
      brief: "Honest inventory of the AI tooling that survived a year in production.",
      publishDate: day(6),
      topics: { connect: [{ id: topics["AI in the Studio"].id }] },
    },
  });

  await db.contentPiece.create({
    data: {
      title: "Summit 2026 speaker announce",
      format: "Social",
      channel: "Instagram",
      status: "Review",
      owner: "Sam",
      brief: "Six-card carousel. Blocked until Ingrid countersigns.",
      publishDate: day(3),
      projectId: summit.id,
      topics: { connect: [{ id: topics["Creative Direction"].id }] },
    },
  });

  await db.contentPiece.create({
    data: {
      title: "Atlas Field Guide, behind the scenes",
      format: "Video",
      channel: "YouTube",
      status: "Published",
      owner: "Marcus",
      brief: "Nine-minute press-check documentary.",
      url: "https://youtube.com/watch?v=example",
      publishDate: day(-18),
      projectId: atlas.id,
      topics: { connect: [{ id: topics["Creative Direction"].id }] },
    },
  });

  await db.contentPiece.create({
    data: {
      title: "Burnout is an operations problem",
      format: "Article",
      channel: "Studio journal",
      status: "Idea",
      owner: "Jordan",
      brief: "Pairs with Renata's session if she confirms.",
      topics: { connect: [{ id: topics["Creative Burnout"].id }] },
    },
  });

  // ------------------------------------------------------------ Interactions
  await db.interaction.createMany({
    data: [
      { speakerId: speakers["Maya Okonkwo"].id, kind: "Call", summary: "Walked through the keynote arc. She wants 40 minutes, not 30.", occurredAt: day(-5) },
      { speakerId: speakers["Maya Okonkwo"].id, kind: "Email", summary: "Contract countersigned. Travel booked from Lagos.", occurredAt: day(-19) },
      { speakerId: speakers["Ingrid Halvorsen"].id, kind: "Pitch", summary: "Sent the offer at $6k plus travel. Awaiting reply.", occurredAt: day(-4) },
      { speakerId: speakers["Renata Silva"].id, kind: "Note", summary: "Introduced by Chiara. Worth a call before we formally invite.", occurredAt: day(-2) },
      { speakerId: speakers["Tobi Adeyemi"].id, kind: "Meeting", summary: "Coffee in London. Enthusiastic but wants to know who else is on the bill.", occurredAt: day(-12) },
    ],
  });

  const alina = await db.guest.findFirst({ where: { name: "Alina Petrov" } });
  const desmond = await db.guest.findFirst({ where: { name: "Desmond Clarke" } });
  if (alina && desmond) {
    await db.interaction.createMany({
      data: [
        { guestId: alina.id, kind: "Email", summary: "Recording confirmed. Sent talking points and a headshot.", occurredAt: day(-3) },
        { guestId: desmond.id, kind: "Pitch", summary: "Pitched the summit angle. He asked for attendance numbers.", occurredAt: day(-8) },
        { guestId: desmond.id, kind: "Follow-up", summary: "Nudged. No reply yet — try once more next week.", occurredAt: day(-1) },
      ],
    });
  }


  // ------------------------------------------------------------------ People
  const peopleSeed = [
    { name: "Jordan Avery", role: "Founder & Creative Director", status: "Core Team", email: "jordan@jordancreate.co", location: "Brooklyn, NY", startDate: day(-1100) },
    { name: "Priya Sharma", role: "Design Director", status: "Core Team", email: "priya@jordancreate.co", location: "Brooklyn, NY", startDate: day(-760) },
    { name: "Marcus Webb", role: "Senior Designer", status: "Core Team", email: "marcus@jordancreate.co", location: "Philadelphia, PA", startDate: day(-540) },
    { name: "Sam Rivera", role: "Studio Manager", status: "Core Team", email: "sam@jordancreate.co", location: "Brooklyn, NY", startDate: day(-420) },
    { name: "Tobi Adeyemi", role: "Creative Technologist", status: "Freelance", email: "tobi@ninevolt.dev", location: "London, UK", startDate: day(-200), notes: "Two days a week, tooling and web." },
    { name: "Grace Lin", role: "Motion Designer", status: "Contractor", email: "grace@gracelin.tv", location: "Los Angeles, CA", startDate: day(-90), notes: "Booked through the summit; revisit after." },
    { name: "Ed Kowalski", role: "Producer", status: "Alumni", email: "ed.kowalski@gmail.com", location: "Chicago, IL", startDate: day(-900), notes: "Left in the spring. Check nothing is still in his name." },
  ];
  const people: Record<string, { id: string }> = {};
  for (const p of peopleSeed) {
    people[p.name] = await db.person.create({ data: p });
  }

  // ------------------------------------------------------------------ Access
  const grant = (person: string, system: string, level: string, status = "Active", extra: Record<string, unknown> = {}) => ({
    personId: people[person].id, system, level, status, ...extra,
  });
  await db.accessGrant.createMany({
    data: [
      grant("Jordan Avery", "Google Workspace", "Owner"),
      grant("Jordan Avery", "Instagram", "Owner"),
      grant("Sam Rivera", "Google Workspace", "Admin"),
      grant("Sam Rivera", "Ticketing platform", "Admin", "Active", { url: "https://tickets.example.com" }),
      grant("Sam Rivera", "QuickBooks", "Admin"),
      grant("Priya Sharma", "Figma", "Admin"),
      grant("Marcus Webb", "Figma", "Editor"),
      grant("Grace Lin", "Figma", "Editor", "Pending", { notes: "Waiting on seat count." }),
      grant("Tobi Adeyemi", "Vercel", "Admin"),
      grant("Tobi Adeyemi", "GitHub", "Admin"),
      grant("Ed Kowalski", "Instagram", "Editor", "Active", { notes: "Flagged by the access review — revoke." }),
      grant("Ed Kowalski", "Google Workspace", "Editor", "Revoked"),
    ],
  });

  // ---------------------------------------------------------------- Sponsors
  const sponsorSeed = [
    { company: "Northwind Coffee", contactName: "Ana Duarte", contactRole: "Head of Brand", email: "ana@northwind.coffee", status: "Won", tier: "Gold", value: 25000, closeDate: day(-15), eventId: summitEvent.id, nextStep: "Countersigned. Booth plan due to production." },
    { company: "Mono Type Foundry", contactName: "Felix Braun", contactRole: "Marketing Lead", email: "felix@monotype.example", status: "Negotiation", tier: "Silver", value: 12000, closeDate: day(9), eventId: summitEvent.id, nextStep: "They want the lanyard placement — counter with workshop naming." },
    { company: "Fieldnotes Software", contactName: "Dana White", contactRole: "VP Marketing", email: "dana@fieldnotes.app", status: "Proposal", tier: "Gold", value: 30000, closeDate: day(18), eventId: summitEvent.id, nextStep: "Proposal sent Tuesday. Follow up Friday if quiet." },
    { company: "Beacon Insurance", contactName: "Rob Ellis", contactRole: "Partnerships", email: "r.ellis@beacon.example", status: "Contacted", tier: "Partner", value: 8000, closeDate: day(30), eventId: summitEvent.id, nextStep: "Intro call booked." },
    { company: "Halcyon Hotels", contactName: "Marie Chen", contactRole: "Brand Director", email: "marie@halcyon.example", status: "Lead", tier: "In-kind", value: 6000, eventId: summitEvent.id, nextStep: "Pitch room-block + speaker accommodation trade." },
    { company: "Crest Bank", contactName: "Tom Ferry", contactRole: "Sponsorships", email: "t.ferry@crest.example", status: "Lost", tier: "Title", value: 60000, closeDate: day(-30), eventId: summitEvent.id, notes: "Went with a fintech conference instead. Re-approach for 2027." },
  ];
  const sponsors: Record<string, { id: string }> = {};
  for (const sp of sponsorSeed) {
    sponsors[sp.company] = await db.sponsor.create({ data: sp });
  }
  await db.interaction.createMany({
    data: [
      { sponsorId: sponsors["Mono Type Foundry"].id, kind: "Call", summary: "Felix pushed on lanyards. Held the line; offered workshop naming instead.", occurredAt: day(-2) },
      { sponsorId: sponsors["Fieldnotes Software"].id, kind: "Email", summary: "Sent the gold-tier proposal with the 2025 audience report attached.", occurredAt: day(-3) },
      { sponsorId: sponsors["Northwind Coffee"].id, kind: "Meeting", summary: "Contract signed over coffee, fittingly.", occurredAt: day(-15) },
    ],
  });

  // ------------------------------------------------------------ Ticket buyers
  await db.ticketOrder.createMany({
    data: [
      { eventId: summitEvent.id, buyerName: "Jamie Ortiz", email: "jamie@studioplural.com", ticketType: "General", quantity: 2, amount: 580, status: "Paid", purchasedAt: day(-21) },
      { eventId: summitEvent.id, buyerName: "Wren Taylor", email: "wren@bigco.com", ticketType: "Team", quantity: 6, amount: 1500, status: "Paid", purchasedAt: day(-14), notes: "Design team offsite. Invoice paid net-30." },
      { eventId: summitEvent.id, buyerName: "Kofi Mensah", email: "kofi@freelance.dev", ticketType: "General", quantity: 1, amount: 290, status: "Paid", purchasedAt: day(-9) },
      { eventId: summitEvent.id, buyerName: "Lucia Romano", email: "lucia@romano.studio", ticketType: "VIP", quantity: 1, amount: 590, status: "Paid", purchasedAt: day(-6) },
      { eventId: summitEvent.id, buyerName: "Dev Patel", email: "dev.p@uni.edu", ticketType: "Student", quantity: 1, amount: 120, status: "Refunded", purchasedAt: day(-12), notes: "Exam clash. Refunded in full." },
      { eventId: summitEvent.id, buyerName: "Chiara Bellini", email: "chiara@formatmag.it", ticketType: "Comp", quantity: 1, amount: 0, status: "Paid", purchasedAt: day(-5), notes: "Speaker alumni comp." },
      { eventId: workshop.id, buyerName: "Noor Haddad", email: "noor@haddaddesign.com", ticketType: "General", quantity: 1, amount: 450, status: "Checked In", purchasedAt: day(-30) },
      { eventId: workshop.id, buyerName: "Peter Stone", email: "p.stone@agency.co", ticketType: "General", quantity: 2, amount: 900, status: "Paid", purchasedAt: day(-11) },
    ],
  });

  return {
    projects: await db.project.count(),
    tasks: await db.task.count(),
    content: await db.contentPiece.count(),
    events: await db.event.count(),
    speakers: await db.speaker.count(),
    topics: await db.topic.count(),
    guests: await db.guest.count(),
    people: await db.person.count(),
    access: await db.accessGrant.count(),
    sponsors: await db.sponsor.count(),
    tickets: await db.ticketOrder.count(),
  };
}
