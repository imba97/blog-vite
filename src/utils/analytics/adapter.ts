import type { Router } from 'vue-router'
import type { AnalyticsEventName, AnalyticsEventPayload } from './types'

export type AnalyticsAdapterClass = new () => AnalyticsAdapter

export abstract class AnalyticsAdapter {
  private static adapters: AnalyticsAdapter[] = []

  static register(this: AnalyticsAdapterClass): void {
    AnalyticsAdapter.adapters.push(new this())
  }

  static getRegistered(): readonly AnalyticsAdapter[] {
    return AnalyticsAdapter.adapters
  }

  abstract readonly name: string

  /**
   * 子类声明待异步加载的 SDK URL；null 表示无需外部脚本
   */
  protected readonly url: string | null = null

  /**
   * 注入的 <script> id；空字符串时按 `${name}-sdk` 派生
   */
  protected readonly id: string = ''

  /**
   * SDK 脚本加载完成后由基类调用，子类在此初始化 SDK
   */
  protected onScriptLoaded(): void {}

  init(_router: Router): void {
    const url = this.url
    if (!url)
      return

    const id = this.id || `${this.name}-sdk`
    let script = document.getElementById(id) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = id
      script.src = url
      script.async = true
      document.head.appendChild(script)
    }
    script.addEventListener('load', () => this.onScriptLoaded(), { once: true })
  }

  abstract track<E extends AnalyticsEventName>(
    event: E,
    params: AnalyticsEventPayload[E],
  ): void
}
