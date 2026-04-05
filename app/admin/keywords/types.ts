export type KeywordIntent = 'transactional' | 'commercial' | 'informational' | 'navigational';
export type KeywordStatus = 'discovered' | 'planned' | 'in_progress' | 'published' | 'skipped';
export type SortMode = 'opportunity_desc' | 'volume_desc' | 'difficulty_asc' | 'trend_desc' | 'keyword_asc';

export interface KeywordResult {
  keyword: string;
  volume: number;
  difficulty: number;
  intent: KeywordIntent;
  trend: number;
  cpc: number;
  local_opportunity: number;
  rationale: string;
  related_keywords: string[];
  opportunity_score: number;
}

export interface KeywordDbRow extends KeywordResult {
  id: string;
  status: KeywordStatus;
  cluster_name: string | null;
  priority: number;
  target_post_id: string | null;
  source_scan_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined post info
  post_title?: string;
  post_slug?: string;
}

export interface ResearchMeta {
  autoDiscovery: boolean;
  seedsUsed: string[];
  focusAreas: string;
  count: number;
  avgDifficulty: number;
  avgOpportunity: number;
  transactionalCount: number;
}

export interface HistoryEntry {
  id: string;
  created_at: string;
  seed_input: string | null;
  auto_discovery: boolean;
  seeds_used: string[];
  focus_areas: string;
  result_count: number;
  avg_difficulty: number;
  avg_opportunity: number;
  transactional_count: number;
  payload?: { keywords: KeywordResult[] };
}

export interface CoverageItem {
  keyword: string;
  opportunity_score: number;
  intent: KeywordIntent;
  covered: boolean;
  post_title?: string;
  post_slug?: string;
}

export interface ClusterGroup {
  name: string;
  count: number;
  avgOpportunity: number;
  keywords: KeywordDbRow[];
}

export const INTENT_COLORS: Record<KeywordIntent, string> = {
  transactional: 'bg-emerald-100 text-emerald-700',
  commercial: 'bg-sky-100 text-sky-700',
  informational: 'bg-indigo-100 text-indigo-700',
  navigational: 'bg-slate-200 text-slate-700',
};

export const STATUS_COLORS: Record<KeywordStatus, string> = {
  discovered: 'bg-slate-100 text-slate-600',
  planned: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-sky-100 text-sky-700',
  published: 'bg-emerald-100 text-emerald-700',
  skipped: 'bg-rose-100 text-rose-600',
};

export const STATUS_LABELS: Record<KeywordStatus, string> = {
  discovered: 'Discovered',
  planned: 'Planned',
  in_progress: 'In Progress',
  published: 'Published',
  skipped: 'Skipped',
};

export function getDifficultyClass(difficulty: number): string {
  if (difficulty <= 35) return 'bg-emerald-100 text-emerald-700';
  if (difficulty <= 60) return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
}

export function getOpportunityClass(score: number): string {
  if (score >= 80) return 'bg-emerald-600 text-white';
  if (score >= 65) return 'bg-amber-500 text-slate-950';
  return 'bg-slate-700 text-white';
}

export const SCAN_PRESETS = [
  { label: 'Acrylic Signs', seed: 'acrylic signage, acrylic sign maker' },
  { label: 'LED Signage', seed: 'LED signage, LED sign maker' },
  { label: 'Channel Letters', seed: 'channel letters, 3D letters sign' },
  { label: 'Pylon Signs', seed: 'pylon sign, monument sign' },
  { label: 'Wayfinding', seed: 'wayfinding signs, directional signage' },
  { label: 'Installation', seed: 'signage installation, sign mounting service' },
  { label: 'Makati', seed: 'signage maker Makati, sign shop Makati' },
  { label: 'BGC', seed: 'signage BGC, business signs Taguig' },
  { label: 'Restaurant', seed: 'restaurant signage, food business signs' },
  { label: 'Office', seed: 'office signage, lobby signs, reception signs' },
];
