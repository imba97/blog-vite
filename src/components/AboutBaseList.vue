<template>
  <ul>
    <li
      v-for="(item, index) in list" :key="index"
      flex flex-wrap items-center gap-2
    >
      <span :class="item.class" text-nowrap>{{ item.text }}</span>
      <code v-if="item.time" class="text-xs text-gray-500">
        {{ item.time }}
      </code>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import type { Duration } from 'dayjs/plugin/duration'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { random } from '~/utils/math'

dayjs.extend(duration)

const timeCache = new Map<string, Ref<string>>()
const runningIntervals = new Set<ReturnType<typeof setInterval>>()

const list = [
  { text: '拒绝烟酒', class: 'font-bold' },
  { text: '男' },
  { text: '1997年' },
  { text: '猫派' },
  { text: '高中1年 大专2.5年' },
  { text: '语言学校2年' },
  { text: '打工1年3个月' },
  {
    text: '工作',
    timeRanges: calculateTotalTime([
      '2014/12/22-2015/06/04',
      '2015/07/15-2015/10/15',
      '2018/10/16-2020/4/15',
      '2021/07/22-2024/06/30'
    ]),
    get time() {
      return useTime.call(this, '2024/12/16 00:00:00')
    }
  },
  { text: '独立游戏开发', time: '6个月1天08个小时04分钟40秒970毫秒' },
  { text: '数字游民', time: '5个月18天20个小时06分钟33秒880毫秒' },
  { text: '全栈主前端杂食程序猿' }
]

function useTime(
  this: { text: string, timeRanges: Duration },
  startTime: string
) {
  if (timeCache.has(this.text)) {
    return timeCache.get(this.text)!
  }

  const time = ref('')
  timeCache.set(this.text, time)

  startInterval(
    time,
    dayjs(startTime),
    this.timeRanges
  )

  return time
}

function calculateTotalTime(timeRanges: string[]) {
  return timeRanges.reduce((total, range) => {
    const [start, end] = range.split('-').map(date => dayjs(date))
    return total.add(dayjs.duration(end.diff(start)))
  }, dayjs.duration(0))
}

function startInterval(
  time: Ref<string>,
  startTime: dayjs.Dayjs,
  initialDuration: Duration
) {
  const INTERVAL_TIME = random(51, 54)

  // 初始计算当前时间与 startTime 的差值
  const now = dayjs()
  const initialDiff = now.diff(startTime)

  // 创建一个新的 duration 对象，包含初始 duration 和初始时间差
  let totalDuration = initialDuration.clone().add(initialDiff)

  // 初始化显示
  updateTimeDisplay(totalDuration)

  // SSG/SSR 阶段只需要首帧文本，避免在 Node 进程里挂定时器导致构建不退出
  if (import.meta.env.SSR || typeof window === 'undefined')
    return

  const id = setInterval(() => {
    // 每次直接加上间隔时间
    totalDuration = totalDuration.add(INTERVAL_TIME)
    updateTimeDisplay(totalDuration)
  }, INTERVAL_TIME)
  runningIntervals.add(id)

  function updateTimeDisplay(duration: Duration) {
    const years = duration.years()
    const months = duration.months()
    const days = duration.days()
    const hours = duration.hours()
    const minutes = duration.minutes()
    const seconds = duration.seconds()
    const milliseconds = duration.milliseconds()

    let result = ''

    if (years > 0)
      result += `${years}年`
    if (months > 0 || (years > 0 && months === 0))
      result += `${months > 0 ? months : 1}个月`
    if (days > 0 || (years > 0 && days === 0))
      result += `${days > 0 ? days : 1}天`

    result += `${hours < 10 ? `0${hours}` : hours}个小时`
    result += `${minutes < 10 ? `0${minutes}` : minutes}分钟`
    result += `${seconds < 10 ? `0${seconds}` : seconds}秒`

    result += `000${milliseconds}`.slice(-3)
    result += '毫秒'

    time.value = result
  }
}

onUnmounted(() => {
  for (const id of runningIntervals)
    clearInterval(id)
  runningIntervals.clear()
})
</script>
