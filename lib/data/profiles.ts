import { SEED_PROFILES } from '@/lib/data/seed';
import type { Profile } from '@/lib/types';

const byId = new Map(SEED_PROFILES.map((profile) => [profile.id, profile]));

export function getProfileById(id: string | undefined): Profile | undefined {
  if (!id) return undefined;
  return byId.get(id);
}

export function getProfiles(ids: string[]): Profile[] {
  return ids.map((id) => byId.get(id)).filter((profile): profile is Profile => Boolean(profile));
}

export function displayName(id: string, fallback = '對方') {
  return byId.get(id)?.name ?? fallback;
}
