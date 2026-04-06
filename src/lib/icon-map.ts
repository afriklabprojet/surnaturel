import {
  Flame, Sparkles, Zap, Smile, Baby, Wand2, Heart, Leaf, Stethoscope,
  Shield, Award, Clock, Users, Star, Lock, BookOpen, HeartHandshake,
  type LucideIcon,
} from "lucide-react"

const ICON_MAP: Record<string, LucideIcon> = {
  Flame, Sparkles, Zap, Smile, Baby, Wand2, Heart, Leaf, Stethoscope,
  Shield, Award, Clock, Users, Star, Lock, BookOpen, HeartHandshake,
}

export function getIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Sparkles
  return ICON_MAP[name] ?? Sparkles
}
