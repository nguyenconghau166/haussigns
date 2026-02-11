'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Play, Settings, Activity, Search, TrendingUp, FileText, Image as ImageIcon,
  CheckCircle, AlertCircle, Clock, XCircle, ChevronDown, ChevronUp,
  Loader2, ArrowRight, Zap, RotateCcw, Bot
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LogEntry {
  agent: string;
  step: string;
  status: string;
  message: string;
  data?: any;
  timestamp: string;
}

type AgentStatus = 'idle' | 'running' | 'success' | 'failed';

interface AgentState {
  status: AgentStatus;
  message?: string;
  data?: any;
}

const AGENTS = [
  {
    id: 'Researcher',
    label: 'Nghiên cứu',
    fullLabel: 'AI Researcher',
    desc: 'Tìm từ khóa trending, từ khóa mở rộng & tin tức ngành',
    icon: Search,
    color: 'purple',
    gradient: 'from-purple-500 to-violet-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-600',
    step: 1,
  },
  {
    id: 'Evaluator',
    label: 'Đánh giá',
    fullLabel: 'AI Evaluator',
    desc: 'Chấm điểm, so sánh với bài cũ, lọc chủ đề chất lượng',
    icon: TrendingUp,
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-600',
    step: 2,
  },
  {
    id: 'Writer',
    label: 'Viết bài',
    fullLabel: 'AI Writer',
    desc: 'Viết bài SEO, lồng ghép doanh nghiệp & CTA gọi điện',
    icon: FileText,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-600',
    step: 3,
  },
  {
    id: 'Visual Inspector',
    label: 'Hình ảnh',
    fullLabel: 'AI Visual Inspector',
    desc: 'Kiểm tra, tạo ảnh minh họa & lưu bản nháp',
    icon: ImageIcon,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-600',
    step: 4,
  },
];

export default function AICenterPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [agentStates, setAgentStates] = useState<Record<string, AgentState>>({});
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [pipelineResult, setPipelineResult] = useState<any>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const updateAgentState = (agentId: string, state: AgentState) => {
    setAgentStates(prev => ({ ...prev, [agentId]: state }));
  };

  const runPipeline = async () => {
    setIsRunning(true);
    setLogs([]);
    setAgentStates({});
    setPipelineResult(null);

    try {
      const response = await fetch('/api/admin/pipeline', { method: 'POST' });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: LogEntry = JSON.parse(line.slice(6));
              setLogs(prev => [...prev, event]);

              // Update agent state
              if (event.agent !== 'System') {
                const status: AgentStatus =
                  event.status === 'running' ? 'running' :
                    event.status === 'success' ? 'success' :
                      event.status === 'failed' ? 'failed' : 'idle';

                updateAgentState(event.agent, {
                  status,
                  message: event.message,
                  data: event.data || undefined,
                });
              }

              // Check for pipeline completion
              if (event.agent === 'System' && event.step === 'complete') {
                setPipelineResult(event);
              }
            } catch (e) {
              // Skip malformed events
            }
          }
        }
      }
    } catch (error: any) {
      setLogs(prev => [...prev, {
        agent: 'System',
        step: 'error',
        status: 'failed',
        message: `Lỗi kết nối: ${error.message}`,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case 'running': return <Loader2 className="h-5 w-5 animate-spin" />;
      case 'success': return <CheckCircle className="h-5 w-5" />;
      case 'failed': return <XCircle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const getLogColor = (agent: string) => {
    const colors: Record<string, string> = {
      'System': 'text-sky-400',
      'Researcher': 'text-purple-400',
      'Evaluator': 'text-blue-400',
      'Writer': 'text-amber-400',
      'Visual Inspector': 'text-emerald-400',
    };
    return colors[agent] || 'text-slate-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">AI Pipeline Command Center</h1>
          <p className="text-slate-500 mt-1">Điều khiển quy trình AI viết bài tự động</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/settings"
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-all text-sm"
          >
            <Settings className="h-4 w-4" /> Cài đặt
          </Link>
          <button
            onClick={runPipeline}
            disabled={isRunning}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300',
              isRunning
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 hover:shadow-lg hover:shadow-amber-500/25 hover:scale-[1.02]'
            )}
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Đang chạy...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Chạy Pipeline
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pipeline Flow - Visual Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {AGENTS.map((agent, idx) => {
          const state = agentStates[agent.id] || { status: 'idle' as AgentStatus };
          const isExpanded = expandedAgent === agent.id;

          return (
            <div key={agent.id} className="relative">
              <Card
                className={cn(
                  'border-2 transition-all duration-500 cursor-pointer overflow-hidden',
                  state.status === 'running' && `${agent.border} shadow-lg scale-[1.02]`,
                  state.status === 'success' && 'border-emerald-300 bg-emerald-50/30',
                  state.status === 'failed' && 'border-red-300 bg-red-50/30',
                  state.status === 'idle' && 'border-slate-200 hover:border-slate-300',
                )}
                onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col items-center text-center">
                    {/* Step Number */}
                    <div className={cn(
                      'text-[10px] font-bold uppercase tracking-wider mb-2',
                      state.status === 'running' ? agent.text : 'text-slate-400'
                    )}>
                      Bước {agent.step}
                    </div>

                    {/* Icon */}
                    <div className={cn(
                      'w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-all duration-500',
                      state.status === 'running' && `bg-gradient-to-br ${agent.gradient} text-white shadow-lg animate-pulse`,
                      state.status === 'success' && 'bg-emerald-100 text-emerald-600',
                      state.status === 'failed' && 'bg-red-100 text-red-600',
                      state.status === 'idle' && `${agent.bg} ${agent.text}`,
                    )}>
                      {state.status === 'running' ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : state.status === 'success' ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : state.status === 'failed' ? (
                        <XCircle className="h-6 w-6" />
                      ) : (
                        <agent.icon className="h-6 w-6" />
                      )}
                    </div>

                    {/* Label */}
                    <h3 className="font-bold text-slate-900 text-sm">{agent.label}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{agent.desc}</p>

                    {/* Status */}
                    {state.status !== 'idle' && (
                      <div className={cn(
                        'mt-3 text-[11px] font-semibold flex items-center gap-1',
                        state.status === 'running' && agent.text,
                        state.status === 'success' && 'text-emerald-600',
                        state.status === 'failed' && 'text-red-600',
                      )}>
                        {getStatusIcon(state.status)}
                        <span>
                          {state.status === 'running' ? 'Đang xử lý...' :
                            state.status === 'success' ? 'Hoàn thành' : 'Lỗi'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && state.data && (
                    <div className="mt-4 pt-4 border-t border-slate-200 text-left">
                      <p className="text-xs text-slate-500 mb-2 font-medium">Chi tiết kết quả:</p>
                      <pre className="text-[11px] text-slate-600 bg-slate-100 rounded-lg p-3 overflow-auto max-h-40">
                        {JSON.stringify(state.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Arrow between cards */}
              {idx < 3 && (
                <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center',
                    state.status === 'success' ? 'bg-emerald-100' : 'bg-slate-100'
                  )}>
                    <ArrowRight className={cn(
                      'h-3 w-3',
                      state.status === 'success' ? 'text-emerald-500' : 'text-slate-400'
                    )} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pipeline Result Banner */}
      {pipelineResult && (
        <div className={cn(
          'rounded-xl p-4 flex items-center gap-4',
          pipelineResult.status === 'success'
            ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200'
            : pipelineResult.status === 'failed'
              ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200'
              : 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200'
        )}>
          {pipelineResult.status === 'success' ? (
            <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0" />
          ) : pipelineResult.status === 'failed' ? (
            <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-6 w-6 text-blue-500 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-semibold text-slate-900">{pipelineResult.message}</p>
            {pipelineResult.data && (
              <p className="text-sm text-slate-600 mt-1">
                Bài viết tạo: {pipelineResult.data.articles_created || 0} | Ảnh tạo: {pipelineResult.data.images_generated || 0}
              </p>
            )}
          </div>
          <Link
            href="/admin/posts"
            className="px-4 py-2 bg-white rounded-lg border text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            Xem bài nháp <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Console Log */}
      <Card className="bg-slate-950 text-slate-200 font-mono text-sm overflow-hidden shadow-2xl border-slate-800">
        <CardHeader className="border-b border-slate-800/50 py-3 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-3 text-slate-400 text-xs">pipeline_output.log</span>
            </div>
            <div className="flex items-center gap-3">
              {isRunning && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              )}
              <span className="text-xs text-slate-500">SignsHaus AI v3.0</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[400px] overflow-y-auto p-4 space-y-1.5">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600">
              <Bot className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-sm italic">Hệ thống chờ lệnh. Bấm "Chạy Pipeline" để bắt đầu...</p>
              <p className="text-xs text-slate-700 mt-2">
                4 AI Agents sẽ tự động: Nghiên cứu → Đánh giá → Viết bài → Tạo ảnh
              </p>
            </div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="flex gap-3 animate-fade-in group hover:bg-slate-900/50 px-2 py-1 rounded">
                <span className="text-slate-600 text-xs whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString('vi-VN')}
                </span>
                <span className={cn('font-bold text-xs w-28 flex-shrink-0', getLogColor(log.agent))}>
                  [{log.agent}]
                </span>
                <span className={cn(
                  'text-xs',
                  log.status === 'failed' ? 'text-red-400' :
                    log.status === 'success' ? 'text-emerald-400' :
                      log.status === 'running' ? 'text-sky-300' : 'text-slate-400'
                )}>
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </CardContent>
      </Card>
    </div>
  );
}
