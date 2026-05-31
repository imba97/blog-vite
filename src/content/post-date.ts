const SHANGHAI_TIME_ZONE = 'Asia/Shanghai'
const SHANGHAI_OFFSET_HOURS = 8
const DATE_WITHOUT_TIMEZONE_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2})(?::(\d{2})(?::(\d{2}))?)?)?$/
const TIMEZONE_SUFFIX_RE = /(?:Z|[+-]\d{2}:?\d{2})$/i
const SHANGHAI_DATE_PARTS_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: SHANGHAI_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function isValidDateParts(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number
): boolean {
  if (!Number.isInteger(year) || year < 1)
    return false
  if (!Number.isInteger(month) || month < 1 || month > 12)
    return false
  if (!Number.isInteger(day) || day < 1 || day > daysInMonth(year, month))
    return false
  if (!Number.isInteger(hour) || hour < 0 || hour > 23)
    return false
  if (!Number.isInteger(minute) || minute < 0 || minute > 59)
    return false
  if (!Number.isInteger(second) || second < 0 || second > 59)
    return false
  return true
}

function parseDatePartsWithoutTimezone(input: string): number {
  const match = input.match(DATE_WITHOUT_TIMEZONE_RE)
  if (!match)
    return Number.NaN

  const [, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr] = match
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  const hour = Number(hourStr ?? '0')
  const minute = Number(minuteStr ?? '0')
  const second = Number(secondStr ?? '0')

  if ([year, month, day, hour, minute, second].some(Number.isNaN))
    return Number.NaN
  if (!isValidDateParts(year, month, day, hour, minute, second))
    return Number.NaN

  return Date.UTC(year, month - 1, day, hour - SHANGHAI_OFFSET_HOURS, minute, second)
}

function extractDatePartsInShanghai(timestamp: number): { year: number, month: number, day: number } {
  const parts = SHANGHAI_DATE_PARTS_FORMATTER.formatToParts(new Date(timestamp))

  const year = Number(parts.find(part => part.type === 'year')?.value ?? '0')
  const month = Number(parts.find(part => part.type === 'month')?.value ?? '0')
  const day = Number(parts.find(part => part.type === 'day')?.value ?? '0')

  return { year, month, day }
}

export function parsePostDateToTimestamp(value: string): number {
  const raw = value.trim()
  if (!raw)
    return Number.NaN

  if (!TIMEZONE_SUFFIX_RE.test(raw)) {
    const parsedWithoutTimezone = parseDatePartsWithoutTimezone(raw)
    if (!Number.isNaN(parsedWithoutTimezone))
      return parsedWithoutTimezone
    if (DATE_WITHOUT_TIMEZONE_RE.test(raw))
      return Number.NaN
  }

  const direct = Date.parse(raw)
  if (!Number.isNaN(direct))
    return direct

  return Date.parse(raw.replace(' ', 'T'))
}

function formatPostDatePartsInShanghai(value: string): { year: number, month: number, day: number } | null {
  const timestamp = parsePostDateToTimestamp(value)
  if (Number.isNaN(timestamp))
    return null
  return extractDatePartsInShanghai(timestamp)
}

export function normalizePostDateString(value: unknown): string {
  if (value == null)
    return ''

  if (typeof value === 'string')
    return value.trim()

  if (value instanceof Date) {
    const year = value.getUTCFullYear()
    const month = pad2(value.getUTCMonth() + 1)
    const day = pad2(value.getUTCDate())
    const hour = pad2(value.getUTCHours())
    const minute = pad2(value.getUTCMinutes())
    const second = pad2(value.getUTCSeconds())
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
  }

  return String(value).trim()
}

export function formatPostDateYmdInShanghai(value: string): string {
  const parts = formatPostDatePartsInShanghai(value)
  if (!parts)
    return value

  const { year, month, day } = parts
  return `${year}-${pad2(month)}-${pad2(day)}`
}

export function formatPostDateZhInShanghai(value: string): string {
  const parts = formatPostDatePartsInShanghai(value)
  if (!parts)
    return value

  const { year, month, day } = parts
  return `${year}年${month}月${day}日`
}

export function comparePostDateDesc(dateA: string, dateB: string): number {
  const aTime = parsePostDateToTimestamp(dateA)
  const bTime = parsePostDateToTimestamp(dateB)
  if (!Number.isNaN(aTime) && !Number.isNaN(bTime))
    return bTime - aTime
  if (!Number.isNaN(aTime))
    return -1
  if (!Number.isNaN(bTime))
    return 1
  return dateB.localeCompare(dateA)
}
