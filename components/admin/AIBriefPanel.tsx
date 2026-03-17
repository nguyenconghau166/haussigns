'use client';

export interface AIBrief {
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  persona: string;
  funnelStage: 'awareness' | 'consideration' | 'decision';
  tone: string;
  mustInclude: string;
  avoidClaims: string;
  entityFocus: string;
}

interface AIBriefPanelProps {
  value: AIBrief;
  onChange: (next: AIBrief) => void;
}

export const defaultAIBrief: AIBrief = {
  intent: 'commercial',
  persona: 'Business owner or purchasing manager in Metro Manila',
  funnelStage: 'consideration',
  tone: 'Professional and practical',
  mustInclude: '',
  avoidClaims: 'Avoid unrealistic guarantees or unsupported claims',
  entityFocus: ''
};

export default function AIBriefPanel({ value, onChange }: AIBriefPanelProps) {
  const update = <K extends keyof AIBrief>(key: K, next: AIBrief[K]) => {
    onChange({ ...value, [key]: next });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Brief</p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-slate-500">Intent</label>
          <select
            value={value.intent}
            onChange={(e) => update('intent', e.target.value as AIBrief['intent'])}
            className="w-full mt-1 p-2 text-sm border rounded-lg"
          >
            <option value="informational">Informational</option>
            <option value="commercial">Commercial</option>
            <option value="transactional">Transactional</option>
            <option value="navigational">Navigational</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Funnel Stage</label>
          <select
            value={value.funnelStage}
            onChange={(e) => update('funnelStage', e.target.value as AIBrief['funnelStage'])}
            className="w-full mt-1 p-2 text-sm border rounded-lg"
          >
            <option value="awareness">Awareness</option>
            <option value="consideration">Consideration</option>
            <option value="decision">Decision</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500">Persona</label>
        <input
          value={value.persona}
          onChange={(e) => update('persona', e.target.value)}
          className="w-full mt-1 p-2 text-sm border rounded-lg"
          placeholder="Who this content is for"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500">Tone</label>
        <input
          value={value.tone}
          onChange={(e) => update('tone', e.target.value)}
          className="w-full mt-1 p-2 text-sm border rounded-lg"
          placeholder="Professional, expert, concise..."
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500">Must Include</label>
        <textarea
          value={value.mustInclude}
          onChange={(e) => update('mustInclude', e.target.value)}
          className="w-full mt-1 p-2 text-xs border rounded-lg h-16"
          placeholder="Specific entities, offers, constraints"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500">Avoid Claims</label>
        <textarea
          value={value.avoidClaims}
          onChange={(e) => update('avoidClaims', e.target.value)}
          className="w-full mt-1 p-2 text-xs border rounded-lg h-16"
          placeholder="Claims to avoid"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500">Entity Focus</label>
        <input
          value={value.entityFocus}
          onChange={(e) => update('entityFocus', e.target.value)}
          className="w-full mt-1 p-2 text-sm border rounded-lg"
          placeholder="Material/product/project names"
        />
      </div>
    </div>
  );
}
