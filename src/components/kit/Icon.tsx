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
  Image,
  Layers,
  Loader2,
  Mail,
  MapPin,
  Maximize,
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
  Users,
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
  image: Image,
  layers: Layers,
  'loader-2': Loader2,
  mail: Mail,
  'map-pin': MapPin,
  maximize: Maximize,
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
  users: Users,
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
