import { Platform } from 'react-native';

import { COIN_PACKS, SUBSCRIPTION_PLANS } from '@/lib/data/seed';
import type { CoinPack, SubscriptionPlan } from '@/lib/types';

/**
 * Store billing layer for JiMatch subscriptions and coin packs.
 *
 * The product ids below are the real App Store / Google Play subscription and
 * consumable ids the app should be configured with. Purchases currently resolve
 * through a local simulation so the whole paywall, upgrade and restore flow is
 * testable in preview.
 *
 * TODO(payments): once Bilt-managed payments are enabled for this project,
 * install `@biltme/iap` + `expo-iap` and replace the three functions below with
 * real store calls. Nothing outside this file needs to change.
 */

export const STORE_LABEL = Platform.select({
  ios: 'App Store',
  android: 'Google Play',
  default: '模擬商店',
});

export const IAP_CONNECTED = false;

export interface PurchaseResult {
  ok: boolean;
  productId: string;
  message: string;
}

const LATENCY_MS = 900;

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  await delay(300);
  return SUBSCRIPTION_PLANS;
}

export async function fetchCoinPacks(): Promise<CoinPack[]> {
  await delay(300);
  return COIN_PACKS;
}

export async function purchaseProduct(productId: string): Promise<PurchaseResult> {
  await delay(LATENCY_MS);
  return {
    ok: true,
    productId,
    message: `已透過 ${STORE_LABEL} 完成購買`,
  };
}

export async function restorePurchases(): Promise<{ productId: string } | null> {
  await delay(LATENCY_MS);
  return null;
}

export function planForProductId(productId: string | null) {
  if (!productId) return null;
  return SUBSCRIPTION_PLANS.find((plan) => plan.productId === productId) ?? null;
}
