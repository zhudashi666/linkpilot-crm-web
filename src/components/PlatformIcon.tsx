import clsx from 'clsx'
import type { IconType } from 'react-icons'
import { SiLine, SiTelegram, SiWhatsapp } from 'react-icons/si'
import type { AiPlatform } from '../types'

const ICONS: Partial<Record<AiPlatform, IconType>> = { LINE: SiLine, WhatsApp: SiWhatsapp, Telegram: SiTelegram }

const COLORS: Record<AiPlatform, string> = {
  LINE: '#06c755',
  WhatsApp: '#25d366',
  Telegram: '#229ed9',
  Tinder: '#ee476f',
  Bumble: '#e5aa18',
  Soul: '#4b4d87',
}

const SOCIAL_IMAGES: Partial<Record<AiPlatform, string>> = {
  Tinder: '/social-icons/tinder.jpg',
  Bumble: '/social-icons/bumble.jpg',
  Soul: '/social-icons/soul.jpg',
}

/** AI 客服渠道图标：IM 用品牌矢量，社媒用品牌图片，统一为圆形品牌色底。 */
export function PlatformIcon({ platform, className, iconClassName }: { platform: AiPlatform; className?: string; iconClassName?: string }) {
  const Icon = ICONS[platform]
  const img = SOCIAL_IMAGES[platform]
  return (
    <span
      className={clsx('inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full', className)}
      style={{ backgroundColor: COLORS[platform] }}
      title={platform}
      aria-label={platform}
    >
      {img ? (
        <img src={img} alt="" className="h-full w-full object-cover" aria-hidden />
      ) : Icon ? (
        <Icon className={clsx('h-[55%] w-[55%] text-white', iconClassName)} aria-hidden />
      ) : null}
    </span>
  )
}
