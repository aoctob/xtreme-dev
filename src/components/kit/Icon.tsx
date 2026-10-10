import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Flag,
  History,
  Image,
  KeyRound,
  LayoutDashboard,
  Layers,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Maximize,
  Megaphone,
  Menu,
  Package,
  Phone,
  Play,
  Plus,
  Search,
  Share2,
  Shield,
  Shirt,
  Tag,
  Target,
  Upload,
  User,
  UserCheck,
  Users,
  Wallet,
  X,
  XCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { CSSProperties } from 'react'

/** Lucide, 2px stroke, square caps and miter joins (design system §Iconography). */
const ICONS = {
  'alert-circle': AlertCircle,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up-right': ArrowUpRight,
  calendar: Calendar,
  check: Check,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'clipboard-list': ClipboardList,
  clock: Clock,
  flag: Flag,
  history: History,
  image: Image,
  'key-round': KeyRound,
  'layout-dashboard': LayoutDashboard,
  layers: Layers,
  'loader-2': Loader2,
  'log-out': LogOut,
  mail: Mail,
  'map-pin': MapPin,
  maximize: Maximize,
  megaphone: Megaphone,
  menu: Menu,
  package: Package,
  phone: Phone,
  play: Play,
  plus: Plus,
  search: Search,
  'share-2': Share2,
  shield: Shield,
  shirt: Shirt,
  tag: Tag,
  target: Target,
  upload: Upload,
  user: User,
  'user-check': UserCheck,
  users: Users,
  wallet: Wallet,
  x: X,
  'x-circle': XCircle,
  zap: Zap,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICONS

export function Icon({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconName
  size?: number
  color?: string
  style?: CSSProperties
}) {
  const C = ICONS[name]
  return (
    <span style={{ display: 'inline-flex', width: size, height: size, flexShrink: 0, color: color || 'currentColor', ...style }}>
      <C
        size={size}
        strokeWidth={2}
        strokeLinecap="square"
        strokeLinejoin="miter"
        aria-hidden="true"
        className={`lucide lucide-${name}`}
      />
    </span>
  )
}
