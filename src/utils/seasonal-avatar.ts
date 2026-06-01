import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

const SHANGHAI_TIME_ZONE = 'Asia/Shanghai'

export const DEFAULT_FAVICON = '/assets/images/favicon.png'
export const CHILDRENS_DAY_FAVICON = '/assets/images/favicon-childrens-day.png'

interface SeasonalAvatarRule {
  name: string
  datetime: string | { start: string, end: string }
  avatar: string
}

dayjs.extend(utc)
dayjs.extend(timezone)

export const SEASONAL_AVATAR_RULES: SeasonalAvatarRule[] = [
  {
    name: 'childrens-day',
    datetime: '06-01',
    avatar: CHILDRENS_DAY_FAVICON
  }
]

const ABSOLUTE_DATE_RE = /^(\d{4}-\d{2}-\d{2})(?: (\d{2}:\d{2}:\d{2}))?$/
const RECURRING_DATE_RE = /^(\d{2}-\d{2})(?: (\d{2}:\d{2}:\d{2}))?$/

interface ParsedDateExpression {
  hasYear: boolean
  year?: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  hasTime: boolean
}

interface RecurringYearIntervals {
  startThisYear: Dayjs
  endThisYear: Dayjs
  startPrevYear: Dayjs | null
  endNextYear: Dayjs | null
}

type CompiledRule
  = | {
    name: string
    avatar: string
    mode: 'absolute'
    start: Dayjs
    end: Dayjs
  }
  | {
    name: string
    avatar: string
    mode: 'recurring'
    startExpr: ParsedDateExpression
    endExpr: ParsedDateExpression
    intervalsByYear: Map<number, RecurringYearIntervals | null>
  }

const warnedRuleMessages = new Set<string>()
const compiledRules = compileRules(SEASONAL_AVATAR_RULES)

function warnInvalidRule(ruleName: string, reason: string): void {
  const key = `${ruleName}::${reason}`
  if (warnedRuleMessages.has(key))
    return

  warnedRuleMessages.add(key)
  console.warn(`[seasonal-avatar] invalid rule "${ruleName}": ${reason}`)
}

function unique(list: string[]): string[] {
  return [...new Set(list)]
}

function hashString(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  return hash >>> 0
}

function pickStableRandomItem(items: string[], nowInShanghai: Dayjs): string {
  if (items.length === 1)
    return items[0]

  const seed = `${nowInShanghai.format('YYYY-MM-DD')}|${items.join('|')}`
  const index = hashString(seed) % items.length
  return items[index]
}

function toShanghaiMoment(now: Date): Dayjs {
  return dayjs(now).tz(SHANGHAI_TIME_ZONE)
}

function parseDateExpression(value: string, boundary: 'start' | 'end'): ParsedDateExpression | null {
  const normalized = value.trim()
  if (!normalized)
    return null

  const absoluteMatch = normalized.match(ABSOLUTE_DATE_RE)
  if (absoluteMatch) {
    const [yearRaw, monthRaw, dayRaw] = absoluteMatch[1].split('-')
    const [hourRaw, minuteRaw, secondRaw] = (absoluteMatch[2] ?? (boundary === 'start' ? '00:00:00' : '23:59:59')).split(':')
    const hasTime = Boolean(absoluteMatch[2])
    return {
      hasYear: true,
      year: Number(yearRaw),
      month: Number(monthRaw),
      day: Number(dayRaw),
      hour: Number(hourRaw),
      minute: Number(minuteRaw),
      second: Number(secondRaw),
      hasTime
    }
  }

  const recurringMatch = normalized.match(RECURRING_DATE_RE)
  if (!recurringMatch)
    return null

  const [monthRaw, dayRaw] = recurringMatch[1].split('-')
  const [hourRaw, minuteRaw, secondRaw] = (recurringMatch[2] ?? (boundary === 'start' ? '00:00:00' : '23:59:59')).split(':')
  const hasTime = Boolean(recurringMatch[2])
  return {
    hasYear: false,
    month: Number(monthRaw),
    day: Number(dayRaw),
    hour: Number(hourRaw),
    minute: Number(minuteRaw),
    second: Number(secondRaw),
    hasTime
  }
}

function createDayjsFromExpression(expr: ParsedDateExpression, fallbackYear?: number): Dayjs | null {
  const year = expr.hasYear ? expr.year : fallbackYear
  if (!year)
    return null

  const month = String(expr.month).padStart(2, '0')
  const day = String(expr.day).padStart(2, '0')
  const hour = String(expr.hour).padStart(2, '0')
  const minute = String(expr.minute).padStart(2, '0')
  const second = String(expr.second).padStart(2, '0')

  const candidate = dayjs.tz(`${year}-${month}-${day} ${hour}:${minute}:${second}`, 'YYYY-MM-DD HH:mm:ss', SHANGHAI_TIME_ZONE)
  if (!candidate.isValid())
    return null

  if (
    candidate.year() !== year
    || candidate.month() + 1 !== expr.month
    || candidate.date() !== expr.day
    || candidate.hour() !== expr.hour
    || candidate.minute() !== expr.minute
    || candidate.second() !== expr.second
  ) {
    return null
  }

  return candidate
}

function compileRuleDateTime(rule: SeasonalAvatarRule): CompiledRule | null {
  const datetime = rule.datetime
  if (typeof datetime === 'string') {
    const startExpr = parseDateExpression(datetime, 'start')
    if (!startExpr) {
      warnInvalidRule(rule.name, `datetime "${datetime}" cannot be parsed`)
      return null
    }

    const endExpr = startExpr.hasTime ? startExpr : parseDateExpression(datetime, 'end')
    if (!endExpr) {
      warnInvalidRule(rule.name, `datetime "${datetime}" cannot build end time`)
      return null
    }

    if (startExpr.hasYear) {
      const start = createDayjsFromExpression(startExpr)
      const end = createDayjsFromExpression(endExpr)
      if (!start || !end) {
        warnInvalidRule(rule.name, `datetime "${datetime}" is invalid date/time`)
        return null
      }
      if (end.valueOf() < start.valueOf()) {
        warnInvalidRule(rule.name, `datetime "${datetime}" has end before start`)
        return null
      }

      return {
        name: rule.name,
        avatar: rule.avatar,
        mode: 'absolute',
        start,
        end
      }
    }

    return {
      name: rule.name,
      avatar: rule.avatar,
      mode: 'recurring',
      startExpr,
      endExpr,
      intervalsByYear: new Map()
    }
  }

  const startExpr = parseDateExpression(datetime.start, 'start')
  const endExpr = parseDateExpression(datetime.end, 'end')
  if (!startExpr || !endExpr) {
    warnInvalidRule(rule.name, `datetime range "${datetime.start}" -> "${datetime.end}" cannot be parsed`)
    return null
  }
  if (startExpr.hasYear !== endExpr.hasYear) {
    warnInvalidRule(rule.name, 'datetime range cannot mix YYYY and MM-DD formats')
    return null
  }

  if (startExpr.hasYear) {
    const start = createDayjsFromExpression(startExpr)
    const end = createDayjsFromExpression(endExpr)
    if (!start || !end) {
      warnInvalidRule(rule.name, 'datetime range contains invalid date/time')
      return null
    }
    if (end.valueOf() < start.valueOf()) {
      warnInvalidRule(rule.name, 'datetime range end is earlier than start')
      return null
    }

    return {
      name: rule.name,
      avatar: rule.avatar,
      mode: 'absolute',
      start,
      end
    }
  }

  return {
    name: rule.name,
    avatar: rule.avatar,
    mode: 'recurring',
    startExpr,
    endExpr,
    intervalsByYear: new Map()
  }
}

function compileRules(rules: SeasonalAvatarRule[]): CompiledRule[] {
  return rules.flatMap((rule) => {
    if (!rule.avatar) {
      warnInvalidRule(rule.name, 'avatar is empty')
      return []
    }

    const compiled = compileRuleDateTime(rule)
    return compiled ? [compiled] : []
  })
}

function isWithinRange(now: Dayjs, start: Dayjs, end: Dayjs): boolean {
  const current = now.valueOf()
  return current >= start.valueOf() && current <= end.valueOf()
}

function getRecurringIntervalsForYear(rule: Extract<CompiledRule, { mode: 'recurring' }>, year: number): RecurringYearIntervals | null {
  if (rule.intervalsByYear.has(year))
    return rule.intervalsByYear.get(year) ?? null

  const startThisYear = createDayjsFromExpression(rule.startExpr, year)
  const endThisYear = createDayjsFromExpression(rule.endExpr, year)
  if (!startThisYear || !endThisYear) {
    rule.intervalsByYear.set(year, null)
    warnInvalidRule(rule.name, `cannot build recurring interval for year ${year}`)
    return null
  }

  let startPrevYear: Dayjs | null = null
  let endNextYear: Dayjs | null = null
  if (endThisYear.valueOf() < startThisYear.valueOf()) {
    startPrevYear = createDayjsFromExpression(rule.startExpr, year - 1)
    endNextYear = createDayjsFromExpression(rule.endExpr, year + 1)
    if (!startPrevYear || !endNextYear) {
      rule.intervalsByYear.set(year, null)
      warnInvalidRule(rule.name, `cannot build cross-year recurring interval for year ${year}`)
      return null
    }
  }

  const intervals: RecurringYearIntervals = {
    startThisYear,
    endThisYear,
    startPrevYear,
    endNextYear
  }
  rule.intervalsByYear.set(year, intervals)
  return intervals
}

function isCompiledRuleActive(rule: CompiledRule, nowInShanghai: Dayjs): boolean {
  if (rule.mode === 'absolute')
    return isWithinRange(nowInShanghai, rule.start, rule.end)

  const year = nowInShanghai.year()
  const intervals = getRecurringIntervalsForYear(rule, year)
  if (!intervals)
    return false

  if (!intervals.startPrevYear || !intervals.endNextYear)
    return isWithinRange(nowInShanghai, intervals.startThisYear, intervals.endThisYear)

  return isWithinRange(nowInShanghai, intervals.startThisYear, intervals.endNextYear)
    || isWithinRange(nowInShanghai, intervals.startPrevYear, intervals.endThisYear)
}

export function getActiveSeasonalAvatars(now = new Date()): string[] {
  const currentMoment = toShanghaiMoment(now)
  const matched = compiledRules.flatMap((rule) => {
    return isCompiledRuleActive(rule, currentMoment) ? [rule.avatar] : []
  })
  return unique(matched)
}

export function isChildrensDayInShanghai(now = new Date()): boolean {
  return dayjs(now).tz(SHANGHAI_TIME_ZONE).format('MM-DD') === '06-01'
}

export function getCurrentFavicon(now = new Date()): string {
  const nowInShanghai = toShanghaiMoment(now)
  const activeAvatars = getActiveSeasonalAvatars(now)
  if (activeAvatars.length === 0)
    return DEFAULT_FAVICON

  return pickStableRandomItem(activeAvatars, nowInShanghai)
}
