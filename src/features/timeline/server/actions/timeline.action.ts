'use server';

import { loadTimeline } from '@/features/timeline/server/loaders/timeline.loader';

export async function listTimelineAction() {
  return loadTimeline();
}
