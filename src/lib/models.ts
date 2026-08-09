/**
 * Friendly aliases for the generated record types.
 *
 * Prisma 7 exports these as `<Name>Model`; the rest of the app reads better
 * with the bare noun, and going through one module means a future rename only
 * has to be fixed here.
 */
export type {
  AccessGrantModel as AccessGrant,
  BookingModel as Booking,
  ContentPieceModel as ContentPiece,
  EventModel as Event,
  GuestModel as Guest,
  InteractionModel as Interaction,
  PersonModel as Person,
  ProjectModel as Project,
  ResponsibilityModel as Responsibility,
  SpeakerModel as Speaker,
  SponsorModel as Sponsor,
  TaskModel as Task,
  TicketOrderModel as TicketOrder,
  TopicModel as Topic,
  VendorModel as Vendor,
} from "@/generated/prisma/models";
