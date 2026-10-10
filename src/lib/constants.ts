/** Shared option lists used by both Payload collections and the public site. */

/** Display name, as in the design kit. Change here if the club settles on another name. */
export const CLUB_NAME = 'XTREME CLUB'
export const TIME_ZONE = 'Asia/Kolkata'

export const POSITIONS = [
  { label: 'Goalkeeper', plural: 'Goalkeepers', value: 'goalkeeper', query: 'goalkeepers' },
  { label: 'Defender', plural: 'Defenders', value: 'defender', query: 'defenders' },
  { label: 'Midfielder', plural: 'Midfielders', value: 'midfielder', query: 'midfielders' },
  { label: 'Forward', plural: 'Forwards', value: 'forward', query: 'forwards' },
] as const

export type PositionValue = (typeof POSITIONS)[number]['value']

export const MATCH_STATUSES = [
  { label: 'Upcoming', value: 'scheduled' },
  { label: 'Live', value: 'live' },
  { label: 'Full time', value: 'fulltime' },
  { label: 'Postponed', value: 'postponed' },
  { label: 'Cancelled', value: 'cancelled' },
] as const

export type MatchStatus = (typeof MATCH_STATUSES)[number]['value']

export const POST_CATEGORIES = [
  { label: 'Match Report', value: 'match-report' },
  { label: 'Club News', value: 'club-news' },
  { label: 'Trials', value: 'trials' },
  { label: 'Sponsor News', value: 'sponsor-news' },
] as const

export type PostCategory = (typeof POST_CATEGORIES)[number]['value']

export const APPLICATION_STATUSES = [
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Trial booked', value: 'trial-booked' },
  { label: 'Joined', value: 'joined' },
  { label: 'Declined', value: 'declined' },
] as const

export const ENQUIRY_STATUSES = [
  { label: 'New', value: 'new' },
  { label: 'In progress', value: 'in-progress' },
  { label: 'Closed', value: 'closed' },
] as const

export const PREFERRED_POSITIONS = [
  { label: 'Not sure', value: 'not-sure' },
  { label: 'GK', value: 'gk' },
  { label: 'Defender', value: 'defender' },
  { label: 'Midfielder', value: 'midfielder' },
  { label: 'Forward', value: 'forward' },
] as const

export const EXPERIENCE_LEVELS = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Club level', value: 'club' },
  { label: 'Academy/State level', value: 'academy-state' },
  { label: 'Other', value: 'other' },
] as const

export const ENQUIRY_TYPES = [
  { label: 'General', value: 'general' },
  { label: 'Match / tournament', value: 'match' },
  { label: 'Sponsorship', value: 'sponsor' },
  { label: 'Media', value: 'media' },
] as const

export const SPONSOR_INTERESTS = [
  { label: 'Shirt sponsor', value: 'shirt' },
  { label: 'Kit sponsor', value: 'kit' },
  { label: 'Event sponsor', value: 'event' },
  { label: 'Equipment', value: 'equipment' },
  { label: 'Other', value: 'other' },
] as const

export const SOCIAL_NETWORKS = [
  { label: 'Instagram', value: 'instagram' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'X (Twitter)', value: 'x' },
  { label: 'WhatsApp channel', value: 'whatsapp' },
] as const

export const labelFor = <T extends readonly { label: string; value: string }[]>(
  list: T,
  value: string | null | undefined,
): string => list.find((o) => o.value === value)?.label ?? ''

/** Squad page sections: permanent players and guest players who featured in tournaments. */
export const SQUAD_ROLES = [
  { label: 'Squad player', value: 'squad' },
  { label: 'Guest player', value: 'guest' },
] as const

/* ------------------------------ Player registration ----------------------------- */

export const REGISTRATION_MODES = [
  { label: 'The player (self-registration)', value: 'player' },
  { label: 'Committee member', value: 'committee' },
] as const

export const COMMITTEE_ROLES = [
  { label: 'Secretary', value: 'secretary' },
  { label: 'Coach', value: 'coach' },
  { label: 'Team manager', value: 'team-manager' },
  { label: 'Treasurer', value: 'treasurer' },
  { label: 'Other committee member', value: 'other' },
] as const

export const TEAMS = [
  { label: 'Not assigned yet', value: 'unassigned' },
  { label: 'Senior team', value: 'senior' },
  { label: 'Youth team', value: 'youth' },
] as const

export const FEET = [
  { label: 'Right', value: 'right' },
  { label: 'Left', value: 'left' },
  { label: 'Both', value: 'both' },
] as const

/** Registration workflow (spec §5). Approval is separate from publication. */
export const REGISTRATION_STATUSES = [
  { label: 'Pending', value: 'pending' },
  { label: 'Under review', value: 'under_review' },
  { label: 'Changes requested', value: 'changes_requested' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
] as const

export type ApplicationStatus = (typeof REGISTRATION_STATUSES)[number]['value']

export const PUBLICATION_STATUSES = [
  { label: 'Draft', value: 'draft' },
  { label: 'Pending publication', value: 'pending_publication' },
  { label: 'Published', value: 'published' },
  { label: 'Unpublished', value: 'unpublished' },
] as const

export const MEMBERSHIP_STATUSES = [
  { label: 'Pending', value: 'pending' },
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Inactive', value: 'inactive' },
] as const

export const MEMBERSHIP_TYPES = [
  { label: 'Playing member', value: 'playing' },
  { label: 'Non-playing member', value: 'non-playing' },
  { label: 'Honorary member', value: 'honorary' },
] as const

export const ANNOUNCEMENT_STATUSES = [
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Unpublished', value: 'unpublished' },
] as const

export const ANNOUNCEMENT_CATEGORIES = [
  { label: 'Club news', value: 'club' },
  { label: 'Matches', value: 'matches' },
  { label: 'Training', value: 'training' },
  { label: 'Trials and registration', value: 'registration' },
  { label: 'Events', value: 'events' },
] as const
