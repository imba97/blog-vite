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

  init(_router: Router): void {}

  abstract track<E extends AnalyticsEventName>(
    event: E,
    params: AnalyticsEventPayload[E],
  ): void
}
