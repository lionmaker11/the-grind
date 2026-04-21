// Board state store. First nanostore in the codebase. Holds the summary
// returned by GET /api/backlog plus loading/error flags.
//
// Phase 2 is read-only: fetchBoard() is the only action. Phase 5 will add
// completeTask(), setPriority(), addManualTask() — don't pre-build.

import { map } from 'nanostores';
import { getBacklog } from '../lib/api.js';

export const boardStore = map({
  summary: [],
  loading: true,
  error: null,
  lastFetchAt: null
});

export async function fetchBoard() {
  boardStore.setKey('loading', true);
  try {
    const data = await getBacklog();
    boardStore.set({
      summary: Array.isArray(data?.summary) ? data.summary : [],
      loading: false,
      error: null,
      lastFetchAt: Date.now()
    });
  } catch (e) {
    boardStore.setKey('loading', false);
    boardStore.setKey('error', String(e?.message || e));
  }
}
