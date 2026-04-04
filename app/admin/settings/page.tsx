'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Save, Loader2, Zap, CheckCircle, XCircle,
  Building2, Bot, Clock, Globe, Key, Search,
  FileText, Image as ImageIcon, Settings, AlertCircle, BarChart3, LayoutGrid, Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabId = 'business' | 'agents' | 'schedule' | 'seo' | 'api' | 'tracking' | 'website';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { id: 'business', label: 'Doanh nghiệp', icon: Building2, desc: 'Thông tin thương hiệu' },
  { id: 'website', label: 'Nội dung Website', icon: LayoutGrid, desc: 'Hero, Header, Footer' },
  { id: 'agents', label: 'AI Agents', icon: Bot, desc: 'Cài đặt từng Agent' },
  { id: 'schedule', label: 'Lịch chạy', icon: Clock, desc: 'Tự động chạy Pipeline' },
  { id: 'seo', label: 'SEO', icon: Globe, desc: 'Tối ưu tìm kiếm' },
  { id: 'tracking', label: 'Tracking', icon: BarChart3, desc: 'Google Analytics & Pixels' },
  { id: 'api', label: 'API & Kết nối', icon: Key, desc: 'Khóa API và hệ thống' },
];

// Helper components defined OUTSIDE the main component to prevent re-renders losing focus
const InputField = ({ label, value, onChange, placeholder, type = 'text', hint }: {
  label: string; value: string; onChange: (val: string) => void; placeholder?: string; type?: string; hint?: string;
}) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
      placeholder={placeholder}
    />
    {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
  </div>
);

const TextareaField = ({ label, value, onChange, placeholder, hint, rows = 3 }: {
  label: string; value: string; onChange: (val: string) => void; placeholder?: string; hint?: string; rows?: number;
}) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all resize-none"
      placeholder={placeholder}
    />
    {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
  </div>
);

const SelectField = ({ label, value, onChange, options, hint }: {
  label: string; value: string; onChange: (val: string) => void; options: { value: string; label: string }[]; hint?: string;
}) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <select
      value={value || options[0]?.value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
  </div>
);

import ImageUploader from '@/components/ImageUploader';
import { DEFAULT_RESEARCHER_PROMPT, DEFAULT_EVALUATOR_PROMPT, DEFAULT_WRITER_BRIEF_PROMPT } from '@/lib/ai/defaults';

const SystemPromptField = ({ label, defaultPrompt, value, onChange, onReset }: {
  label: string; defaultPrompt: string; value: string; onChange: (val: string) => void; onReset: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const isCustom = !!value && value.trim().length > 0;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-left bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{label}</span>
          {isCustom && (
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">Tùy chỉnh</span>
          )}
          {!isCustom && (
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium">Mặc định</span>
          )}
        </div>
        <span className="text-xs text-slate-400">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="p-3 space-y-3 border-t border-slate-200">
          <textarea
            value={isCustom ? value : defaultPrompt}
            onChange={(e) => onChange(e.target.value)}
            rows={10}
            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all resize-y"
            placeholder={defaultPrompt}
          />
          <div className="flex items-center gap-2">
            {isCustom && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
              >
                Khôi phục mặc định
              </button>
            )}
            <p className="text-[10px] text-slate-400">
              {isCustom
                ? 'Đang dùng prompt tùy chỉnh. Biến động: {{services}}, {{focusAreas}}, {{companyName}}...'
                : 'Đang dùng prompt mặc định. Chỉnh sửa để tùy chỉnh.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const ImageField = ({ label, value, onChange, placeholder, hint, aspectRatio = 16 / 9, maxWidth }: {
  label: string; value: string; onChange: (val: string) => void; placeholder?: string; hint?: string; aspectRatio?: number; maxWidth?: number;
}) => (
  <ImageUploader
    label={label}
    value={value}
    onChange={onChange}
    aspectRatio={aspectRatio}
    maxWidth={maxWidth}
  />
);

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('business');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) setSettings(data.settings);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev: Record<string, string>) => ({ ...prev, [key]: value }));
    setSaved(false);
    if (['banana_endpoint', 'banana_api_key'].includes(key)) setTestResult(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert('Lỗi lưu cài đặt!');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setTimeout(() => {
      setTestResult(settings.banana_endpoint ? 'success' : 'error');
      setTesting(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin h-8 w-8 text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Cài đặt hệ thống</h1>
          <p className="text-slate-500 mt-1">Cấu hình AI Pipeline và thông tin doanh nghiệp</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300',
            saved
              ? 'bg-emerald-500 text-white'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 hover:shadow-lg hover:shadow-amber-500/25'
          )}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> :
            saved ? <CheckCircle className="h-4 w-4" /> :
              <Save className="h-4 w-4" />}
          {saved ? 'Đã lưu!' : 'Lưu cài đặt'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all',
              activeTab === tab.id
                ? 'border-amber-500 text-amber-600 bg-amber-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl">
        {/* ===== BUSINESS TAB ===== */}
        {activeTab === 'business' && (
          <div className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-amber-500" /> Thông tin doanh nghiệp
                </CardTitle>
                <CardDescription>AI sử dụng thông tin này để viết bài và lồng ghép doanh nghiệp tự nhiên</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <InputField label="Tên công ty" value={settings.company_name} onChange={(v) => handleChange('company_name', v)} placeholder="SignsHaus" />
                  <InputField label="Số điện thoại tư vấn" value={settings.business_phone} onChange={(v) => handleChange('business_phone', v)} placeholder="+63 917 123 4567" hint="Dùng trong CTA kêu gọi gọi điện" />
                </div>
                <TextareaField
                  label="Mô tả doanh nghiệp"
                  value={settings.business_description}
                  onChange={(v) => handleChange('business_description', v)}
                  placeholder="Chuyên thiết kế, sản xuất biển hiệu quảng cáo..."
                  hint="AI sẽ hiểu về doanh nghiệp từ mô tả này"
                />
                <TextareaField
                  label="Danh sách dịch vụ"
                  value={settings.business_services}
                  onChange={(v) => handleChange('business_services', v)}
                  placeholder="Biển hiệu, chữ nổi inox, hộp đèn, bảng LED..."
                  hint="Mỗi dịch vụ cách nhau bởi dấu phẩy"
                />
                <InputField label="Địa chỉ workshop" value={settings.business_address} onChange={(v) => handleChange('business_address', v)} placeholder="Makati, Metro Manila" />
                <TextareaField
                  label="Câu kêu gọi hành động (CTA)"
                  value={settings.contact_cta}
                  onChange={(v) => handleChange('contact_cta', v)}
                  placeholder="Gọi ngay +63 917 123 4567 để được tư vấn miễn phí..."
                  hint="Sẽ được đặt cuối mỗi bài viết AI tạo"
                />
                <InputField label="Đối thủ cạnh tranh" value={settings.competitors} onChange={(v) => handleChange('competitors', v)} placeholder="Company A, Company B..." hint="AI sẽ phân tích đối thủ khi viết bài" />
                <TextareaField
                  label="Trạng thái khách hàng (Lead Statuses)"
                  value={settings.lead_statuses}
                  onChange={(v) => handleChange('lead_statuses', v)}
                  placeholder="New, Contacted, Quoted, Won, Lost"
                  hint="Các trạng thái tùy chỉnh cho quy trình bán hàng, cách nhau bằng dấu phẩy."
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== WEBSITE TAB ===== */}
        {activeTab === 'website' && (
          <div className="space-y-6">
            {/* HERO SECTION */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-indigo-500" /> Hero Section (Trang chủ)
                </CardTitle>
                <CardDescription>Tùy chỉnh nội dung phần mở đầu của trang chủ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputField
                  label="Tiêu đề chính (Hero Title)"
                  value={settings.hero_title}
                  onChange={(v) => handleChange('hero_title', v)}
                  placeholder="We Build Signs That Stand Out."
                />
                <TextareaField
                  label="Tiêu đề phụ (Subtitle)"
                  value={settings.hero_subtitle}
                  onChange={(v) => handleChange('hero_subtitle', v)}
                  placeholder="From sleek acrylic build-ups to durable stainless steel..."
                  rows={2}
                />
                <ImageField
                  label="Ảnh nền Hero (Background Image URL)"
                  value={settings.hero_image}
                  onChange={(v) => handleChange('hero_image', v)}
                  placeholder="/images/hero-bg.jpg"
                  hint="Upload ảnh từ máy hoặc dán link ảnh. Có thể crop 16:9."
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-indigo-500" /> Why Choose Us (Trang chủ)
                </CardTitle>
                <CardDescription>Tùy chỉnh tiêu đề và 4 ô nội dung của section Why Choose Us</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <InputField
                    label="Nhãn nhỏ (badge)"
                    value={settings.whyus_label}
                    onChange={(v) => handleChange('whyus_label', v)}
                    placeholder="Why Us"
                  />
                  <InputField
                    label="Tiêu đề section"
                    value={settings.whyus_title}
                    onChange={(v) => handleChange('whyus_title', v)}
                    placeholder="Why Choose SignsHaus?"
                  />
                </div>
                <TextareaField
                  label="Mô tả section"
                  value={settings.whyus_subtitle}
                  onChange={(v) => handleChange('whyus_subtitle', v)}
                  placeholder="Metro Manila's trusted partner for high-quality signage fabrication."
                  rows={2}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <InputField
                    label="Box 1 - Tiêu đề"
                    value={settings.whyus_ocular_title}
                    onChange={(v) => handleChange('whyus_ocular_title', v)}
                    placeholder="Free Ocular Inspection"
                  />
                  <TextareaField
                    label="Box 1 - Mô tả"
                    value={settings.whyus_ocular_description}
                    onChange={(v) => handleChange('whyus_ocular_description', v)}
                    placeholder="We visit your site anywhere in Metro Manila for precise measurements."
                    rows={2}
                  />
                  <InputField
                    label="Box 2 - Tiêu đề"
                    value={settings.whyus_materials_title}
                    onChange={(v) => handleChange('whyus_materials_title', v)}
                    placeholder="Premium Materials"
                  />
                  <TextareaField
                    label="Box 2 - Mô tả"
                    value={settings.whyus_materials_description}
                    onChange={(v) => handleChange('whyus_materials_description', v)}
                    placeholder="Branded acrylics (Crocodile/Suntuf) and 304-grade stainless steel only."
                    rows={2}
                  />
                  <InputField
                    label="Box 3 - Tiêu đề"
                    value={settings.whyus_turnaround_title}
                    onChange={(v) => handleChange('whyus_turnaround_title', v)}
                    placeholder="Fast Turnaround"
                  />
                  <TextareaField
                    label="Box 3 - Mô tả"
                    value={settings.whyus_turnaround_description}
                    onChange={(v) => handleChange('whyus_turnaround_description', v)}
                    placeholder="Signage installed in as fast as 3-5 days for urgent projects."
                    rows={2}
                  />
                  <InputField
                    label="Box 4 - Tiêu đề"
                    value={settings.whyus_crafted_title}
                    onChange={(v) => handleChange('whyus_crafted_title', v)}
                    placeholder="Precision Crafted"
                  />
                  <TextareaField
                    label="Box 4 - Mô tả"
                    value={settings.whyus_crafted_description}
                    onChange={(v) => handleChange('whyus_crafted_description', v)}
                    placeholder="CNC-cut and laser-finished for perfect edges and letters every time."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* CONTACT APP-WIDE */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5 text-indigo-500" /> Thông tin liên hệ (Hiển thị trên Web)
                </CardTitle>
                <CardDescription>Thông tin hiển thị ở Header, Footer và trang Liên hệ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputField
                  label="Số điện thoại hiển thị"
                  value={settings.business_phone}
                  onChange={(v) => handleChange('business_phone', v)}
                  placeholder="+63 917 123 4567"
                />
                <InputField
                  label="Email liên hệ"
                  value={settings.business_email}
                  onChange={(v) => handleChange('business_email', v)}
                  placeholder="inquiry@signshaus.ph"
                />
                <InputField
                  label="Địa chỉ văn phòng"
                  value={settings.business_address}
                  onChange={(v) => handleChange('business_address', v)}
                  placeholder="Unit 123, Sample Building..."
                />
                <InputField
                  label="Giờ làm việc"
                  value={settings.working_hours}
                  onChange={(v) => handleChange('working_hours', v)}
                  placeholder="Mon–Sat: 8AM – 6PM"
                />
                <TextareaField
                  label="Mã nhúng Google Maps (iframe)"
                  value={settings.contact_google_map}
                  onChange={(v) => handleChange('contact_google_map', v)}
                  placeholder='<iframe src="https://www.google.com/maps/embed?..." width="600" height="450" ...></iframe>'
                  hint="Copy mã nhúng từ Google Maps (Share -> Embed a map)"
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* SOCIAL MEDIA */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-indigo-500" /> Mạng xã hội
                </CardTitle>
                <CardDescription>Link đến các trang mạng xã hội của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputField
                  label="Facebook Link"
                  value={settings.social_facebook}
                  onChange={(v) => handleChange('social_facebook', v)}
                  placeholder="https://facebook.com/signs.haus"
                />
                <InputField
                  label="Instagram Link"
                  value={settings.social_instagram}
                  onChange={(v) => handleChange('social_instagram', v)}
                  placeholder="https://instagram.com/signs.haus"
                />
                <InputField
                  label="Viber Phone Number"
                  value={settings.social_viber_number}
                  onChange={(v) => handleChange('social_viber_number', v)}
                  placeholder="639171234567"
                  hint="Nhập số điện thoại (bắt đầu bằng 63...) để tạo link chat trực tiếp"
                />
                <InputField
                  label="Messenger Username"
                  value={settings.social_messenger_user}
                  onChange={(v) => handleChange('social_messenger_user', v)}
                  placeholder="signs.haus"
                  hint="Username của Fanpage (vd: signs.haus) để tạo link m.me"
                />
                <InputField
                  label="Facebook Page ID (Cho Chat Plugin)"
                  value={settings.social_facebook_page_id}
                  onChange={(v) => handleChange('social_facebook_page_id', v)}
                  placeholder="1234567890"
                  hint="ID hiển thị trong phần About của Fanpage. Dùng để hiện khung chat trên Desktop."
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== AGENTS TAB ===== */}
        {activeTab === 'agents' && (
          <div className="space-y-6">
            {/* Pipeline Flow Visualization */}
            <Card className="border-0 shadow-md bg-gradient-to-r from-slate-50 to-white">
              <CardContent className="py-5">
                <div className="flex items-center justify-between overflow-x-auto gap-1 px-2">
                  {[
                    { icon: Search, label: 'Auto-Research', color: 'text-orange-500 bg-orange-100', provider: 'Perplexity' },
                    { icon: Search, label: 'SEO Research', color: 'text-orange-500 bg-orange-100', provider: 'Perplexity' },
                    { icon: FileText, label: 'Strategist', color: 'text-blue-500 bg-blue-100', provider: 'Gemini' },
                    { icon: FileText, label: 'Writer', color: 'text-amber-500 bg-amber-100', provider: 'Gemini' },
                    { icon: Globe, label: 'SEO Optimizer', color: 'text-emerald-500 bg-emerald-100', provider: 'Gemini' },
                    { icon: Zap, label: 'Quality Review', color: 'text-purple-500 bg-purple-100', provider: 'Gemini' },
                    { icon: ImageIcon, label: 'Image Gen', color: 'text-pink-500 bg-pink-100', provider: 'DALL-E' },
                  ].map((agent, idx, arr) => (
                    <div key={idx} className="flex items-center gap-1 flex-shrink-0">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${agent.color}`}>
                          <agent.icon className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-700 text-center leading-tight whitespace-nowrap">{agent.label}</span>
                        <span className="text-[8px] text-slate-400">{agent.provider}</span>
                      </div>
                      {idx < arr.length - 1 && <span className="text-slate-300 text-xs mx-0.5 mt-[-16px]">→</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Researcher */}
            <Card className="border-0 shadow-md border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5 text-purple-500" /> Agent 1: Researcher (Nghiên cứu)
                </CardTitle>
                <CardDescription>Tìm từ khóa trending, từ khóa mở rộng, tin tức ngành biển hiệu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SelectField
                  label="Model AI"
                  value={settings.researcher_model}
                  onChange={(v) => handleChange('researcher_model', v)}
                  options={[
                    { value: 'gpt-4o-mini', label: '[OpenAI] GPT-4o Mini' },
                    { value: 'gpt-4o', label: '[OpenAI] GPT-4o' },
                    { value: 'gpt-5.2', label: '[OpenAI] GPT-5.2' },
                    { value: 'gemini-2.0-flash', label: '[Gemini] 2.0 Flash' },
                    { value: 'gemini-2.0-flash-lite', label: '[Gemini] 2.0 Flash Lite' },
                    { value: 'claude-sonnet-4-20250514', label: '[Claude] Sonnet 4' },
                    { value: 'claude-3-5-haiku-20241022', label: '[Claude] 3.5 Haiku (Fast)' },
                  ]}
                  hint="Provider tự động suy luận từ tên model. Không cần chọn riêng."
                />
                {/* System Instruction */}
                <SystemPromptField
                  label="System Instruction (Researcher)"

                  defaultPrompt={DEFAULT_RESEARCHER_PROMPT}
                  value={settings.researcher_system_prompt}
                  onChange={(v) => handleChange('researcher_system_prompt', v)}
                  onReset={() => handleChange('researcher_system_prompt', '')}
                />
                <TextareaField
                  label="Từ khóa gốc (Seed Keywords)"
                  value={settings.target_keywords_seed}
                  onChange={(v) => handleChange('target_keywords_seed', v)}
                  placeholder="signage maker, business signs, LED signage..."
                  hint="Các từ khóa cơ bản của ngành. AI sẽ mở rộng từ đây"
                />
              </CardContent>
            </Card>

            {/* Evaluator */}
            <Card className="border-0 shadow-md border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" /> Agent 2: Evaluator (Đánh giá)
                </CardTitle>
                <CardDescription>Chấm điểm topic, so sánh với bài cũ, lọc chủ đề chất lượng</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SelectField
                  label="Model AI"
                  value={settings.evaluator_model}
                  onChange={(v) => handleChange('evaluator_model', v)}
                  options={[
                    { value: 'gpt-4o-mini', label: '[OpenAI] GPT-4o Mini' },
                    { value: 'gpt-4o', label: '[OpenAI] GPT-4o' },
                    { value: 'gpt-5.2', label: '[OpenAI] GPT-5.2' },
                    { value: 'gemini-2.0-flash', label: '[Gemini] 2.0 Flash' },
                    { value: 'gemini-2.0-flash-lite', label: '[Gemini] 2.0 Flash Lite' },
                    { value: 'claude-sonnet-4-20250514', label: '[Claude] Sonnet 4' },
                    { value: 'claude-3-5-haiku-20241022', label: '[Claude] 3.5 Haiku (Fast)' },
                  ]}
                  hint="Model đánh giá topic. Provider tự động từ tên model."
                />
                <SystemPromptField
                  label="System Instruction (Evaluator)"

                  defaultPrompt={DEFAULT_EVALUATOR_PROMPT}
                  value={settings.evaluator_system_prompt}
                  onChange={(v) => handleChange('evaluator_system_prompt', v)}
                  onReset={() => handleChange('evaluator_system_prompt', '')}
                />
                <InputField
                  label="Điểm tối thiểu để duyệt (0-100)"
                  value={settings.evaluator_min_score}
                  onChange={(v) => handleChange('evaluator_min_score', v)}
                  type="number"
                  placeholder="60"
                  hint="Chủ đề có điểm thấp hơn sẽ bị bỏ qua. Gợi ý: 50-70"
                />
                <InputField
                  label="Số bài tối đa mỗi lần chạy"
                  value={settings.articles_per_run}
                  onChange={(v) => handleChange('articles_per_run', v)}
                  type="number"
                  placeholder="2"
                  hint="Giới hạn số bài viết tạo ra mỗi lần chạy Pipeline"
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <InputField
                    label="Timeout Researcher (giây)"
                    value={settings.pipeline_research_timeout_seconds || '180'}
                    onChange={(v) => handleChange('pipeline_research_timeout_seconds', v)}
                    type="number"
                    placeholder="180"
                  />
                  <InputField
                    label="Timeout Evaluator (giây)"
                    value={settings.pipeline_evaluator_timeout_seconds || '180'}
                    onChange={(v) => handleChange('pipeline_evaluator_timeout_seconds', v)}
                    type="number"
                    placeholder="180"
                  />
                </div>
              </CardContent>
            </Card>

            {/* General Pipeline Settings */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5 text-slate-500" /> Cài đặt chung Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SelectField
                  label="Writer Model AI"
                  value={settings.writer_model}
                  onChange={(v) => handleChange('writer_model', v)}
                  options={[
                    { value: 'gpt-5.2', label: '[OpenAI] GPT-5.2' },
                    { value: 'gpt-4o', label: '[OpenAI] GPT-4o' },
                    { value: 'gpt-4o-mini', label: '[OpenAI] GPT-4o Mini' },
                    { value: 'gemini-2.0-flash', label: '[Gemini] 2.0 Flash' },
                    { value: 'gemini-2.0-flash-lite', label: '[Gemini] 2.0 Flash Lite' },
                    { value: 'claude-sonnet-4-20250514', label: '[Claude] Sonnet 4' },
                    { value: 'claude-3-5-haiku-20241022', label: '[Claude] 3.5 Haiku (Fast)' },
                  ]}
                  hint="Nên dùng model mạnh (GPT-5.2, Sonnet 4, Gemini Flash) cho chất lượng bài tốt"
                />
                <SystemPromptField
                  label="System Instruction (Writer Brief)"

                  defaultPrompt={DEFAULT_WRITER_BRIEF_PROMPT}
                  value={settings.writer_brief_system_prompt}
                  onChange={(v) => handleChange('writer_brief_system_prompt', v)}
                  onReset={() => handleChange('writer_brief_system_prompt', '')}
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <InputField label="Số bài tối đa mỗi lần chạy" value={settings.articles_per_run} onChange={(v) => handleChange('articles_per_run', v)} type="number" placeholder="2" />
                  <InputField label="Ngưỡng chất lượng (0-100)" value={settings.writer_quality_threshold || '82'} onChange={(v) => handleChange('writer_quality_threshold', v)} type="number" placeholder="82" hint="Dưới ngưỡng sẽ tự revision" />
                  <InputField label="Điểm tối thiểu duyệt topic (0-100)" value={settings.evaluator_min_score} onChange={(v) => handleChange('evaluator_min_score', v)} type="number" placeholder="60" />
                  <InputField label="Số từ tối thiểu / bài" value={settings.min_word_count} onChange={(v) => handleChange('min_word_count', v)} type="number" placeholder="800" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <SelectField label="Ngôn ngữ viết bài" value={settings.content_language} onChange={(v) => handleChange('content_language', v)} options={[
                    { value: 'en', label: 'English (Professional)' },
                    { value: 'tl', label: 'Tagalog (Thân thiện)' },
                    { value: 'mix', label: 'Taglish (English + Tagalog)' },
                  ]} />
                  <InputField label="Giọng văn" value={settings.writer_tone} onChange={(v) => handleChange('writer_tone', v)} placeholder="Professional, Trustworthy" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <InputField label="Timeout AI request (ms)" value={settings.ai_request_timeout_ms || '120000'} onChange={(v) => handleChange('ai_request_timeout_ms', v)} type="number" placeholder="120000" />
                  <InputField label="Retry AI request" value={settings.ai_request_retry_count || '1'} onChange={(v) => handleChange('ai_request_retry_count', v)} type="number" placeholder="1" />
                </div>
              </CardContent>
            </Card>

            {/* Agent 1: Auto-Research Analyst */}
            <Card className="border-0 shadow-md border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5 text-orange-500" /> Agent 1: Auto-Research Analyst
                  <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold ml-auto">Perplexity AI</span>
                </CardTitle>
                <CardDescription>Tự động phát hiện chủ đề và phân tích cạnh tranh bằng Perplexity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SelectField label="Model" value={settings.agent_auto_research_model || 'sonar-pro'} onChange={(v) => handleChange('agent_auto_research_model', v)} options={[
                  { value: 'sonar-pro', label: 'Perplexity Sonar Pro (Khuyến nghị)' },
                  { value: 'sonar', label: 'Perplexity Sonar (Nhanh hơn)' },
                ]} />
                <TextareaField label="Từ khóa gốc (Seed Keywords)" value={settings.target_keywords_seed} onChange={(v) => handleChange('target_keywords_seed', v)} placeholder="signage maker, business signs, LED signage..." hint="Các từ khóa cơ bản để AI mở rộng nghiên cứu" />
                <InputField label="Timeout (giây)" value={settings.pipeline_auto_research_timeout_seconds || '180'} onChange={(v) => handleChange('pipeline_auto_research_timeout_seconds', v)} type="number" placeholder="180" />
                <TextareaField label="System Instruction (Hướng dẫn hệ thống)" value={settings.agent_auto_research_system_instruction || ''} onChange={(v) => handleChange('agent_auto_research_system_instruction', v)} placeholder="Để trống để dùng hướng dẫn mặc định..." hint="Tùy chỉnh prompt hệ thống cho agent này. Để trống = dùng mặc định." rows={8} />
              </CardContent>
            </Card>

            {/* Agent 2: SEO Research Expert */}
            <Card className="border-0 shadow-md border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5 text-orange-500" /> Agent 2: SEO Research Expert
                  <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold ml-auto">Perplexity AI</span>
                </CardTitle>
                <CardDescription>Nghiên cứu từ khóa chuyên sâu, phân tích SERP và đánh giá topic</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SelectField label="Model" value={settings.agent_seo_research_model || 'sonar-pro'} onChange={(v) => handleChange('agent_seo_research_model', v)} options={[
                  { value: 'sonar-pro', label: 'Perplexity Sonar Pro (Khuyến nghị)' },
                  { value: 'sonar', label: 'Perplexity Sonar (Nhanh hơn)' },
                ]} />
                <InputField label="Timeout (giây)" value={settings.pipeline_seo_research_timeout_seconds || '180'} onChange={(v) => handleChange('pipeline_seo_research_timeout_seconds', v)} type="number" placeholder="180" />
                <TextareaField label="System Instruction" value={settings.agent_seo_research_system_instruction || ''} onChange={(v) => handleChange('agent_seo_research_system_instruction', v)} placeholder="Để trống để dùng hướng dẫn mặc định..." hint="Tùy chỉnh prompt hệ thống" rows={8} />
              </CardContent>
            </Card>

            {/* Agent 3: Content Strategist */}
            <Card className="border-0 shadow-md border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" /> Agent 3: Content Strategist
                  <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold ml-auto">Google Gemini</span>
                </CardTitle>
                <CardDescription>Tạo cấu trúc bài viết, dàn ý chi tiết và content brief</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SelectField label="Model" value={settings.agent_content_strategist_model || 'gemini-2.0-flash'} onChange={(v) => handleChange('agent_content_strategist_model', v)} options={[
                  { value: 'gemini-2.0-flash', label: 'Google Gemini 2.0 Flash (Khuyến nghị)' },
                  { value: 'gemini-2.0-flash-lite', label: 'Google Gemini 2.0 Flash Lite (Nhanh)' },
                ]} />
                <InputField label="Timeout (giây)" value={settings.pipeline_strategist_timeout_seconds || '180'} onChange={(v) => handleChange('pipeline_strategist_timeout_seconds', v)} type="number" placeholder="180" />
                <TextareaField label="System Instruction" value={settings.agent_content_strategist_system_instruction || ''} onChange={(v) => handleChange('agent_content_strategist_system_instruction', v)} placeholder="Để trống để dùng hướng dẫn mặc định..." hint="Tùy chỉnh prompt hệ thống" rows={8} />
              </CardContent>
            </Card>

            {/* Agent 4: Content Writer */}
            <Card className="border-0 shadow-md border-l-4 border-l-amber-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-500" /> Agent 4: Content Writer
                  <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-semibold ml-auto">Google Gemini</span>
                </CardTitle>
                <CardDescription>Viết bài SEO đầy đủ HTML, tự tạo prompt ảnh minh họa chi tiết</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SelectField label="Model" value={settings.agent_content_writer_model || 'gemini-2.0-flash'} onChange={(v) => handleChange('agent_content_writer_model', v)} options={[
                  { value: 'gemini-2.0-flash', label: 'Google Gemini 2.0 Flash (Khuyến nghị)' },
                  { value: 'gemini-2.0-flash-lite', label: 'Google Gemini 2.0 Flash Lite (Nhanh)' },
                ]} />
                <InputField label="Timeout (giây)" value={settings.pipeline_content_writer_timeout_seconds || '420'} onChange={(v) => handleChange('pipeline_content_writer_timeout_seconds', v)} type="number" placeholder="420" />
                <TextareaField label="System Instruction" value={settings.agent_content_writer_system_instruction || ''} onChange={(v) => handleChange('agent_content_writer_system_instruction', v)} placeholder="Để trống để dùng hướng dẫn mặc định (sẽ tự build với context doanh nghiệp)..." hint="Tùy chỉnh prompt hệ thống. Lưu ý: Nếu để trống, system prompt sẽ được tự động build với thông tin doanh nghiệp." rows={8} />
              </CardContent>
            </Card>

            {/* Agent 5: SEO Optimizer */}
            <Card className="border-0 shadow-md border-l-4 border-l-emerald-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-emerald-500" /> Agent 5: SEO Optimizer
                  <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-semibold ml-auto">Google Gemini</span>
                </CardTitle>
                <CardDescription>Tối ưu meta tags, từ khóa, structured data cho bài viết</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SelectField label="Model" value={settings.agent_seo_optimizer_model || 'gemini-2.0-flash'} onChange={(v) => handleChange('agent_seo_optimizer_model', v)} options={[
                  { value: 'gemini-2.0-flash', label: 'Google Gemini 2.0 Flash (Khuyến nghị)' },
                  { value: 'gemini-2.0-flash-lite', label: 'Google Gemini 2.0 Flash Lite (Nhanh)' },
                ]} />
                <SelectField label="Auto FAQ Schema" value={settings.enable_faq_schema || 'true'} onChange={(v) => handleChange('enable_faq_schema', v)} options={[
                  { value: 'true', label: 'Bật' },
                  { value: 'false', label: 'Tắt' },
                ]} hint="Tự chèn JSON-LD FAQPage khi bài có khối FAQ" />
                <SelectField label="Auto Internal Linking" value={settings.auto_internal_linking || 'true'} onChange={(v) => handleChange('auto_internal_linking', v)} options={[
                  { value: 'true', label: 'Bật' },
                  { value: 'false', label: 'Tắt' },
                ]} hint="Tự chèn internal link dựa trên bảng linking rules" />
                <InputField label="Số internal links tối đa / bài" value={settings.internal_links_per_article || '3'} onChange={(v) => handleChange('internal_links_per_article', v)} type="number" placeholder="3" />
                <InputField label="Timeout (giây)" value={settings.pipeline_seo_optimizer_timeout_seconds || '180'} onChange={(v) => handleChange('pipeline_seo_optimizer_timeout_seconds', v)} type="number" placeholder="180" />
                <TextareaField label="System Instruction" value={settings.agent_seo_optimizer_system_instruction || ''} onChange={(v) => handleChange('agent_seo_optimizer_system_instruction', v)} placeholder="Để trống để dùng hướng dẫn mặc định..." hint="Tùy chỉnh prompt hệ thống" rows={8} />
              </CardContent>
            </Card>

            {/* Agent 6: Quality Reviewer */}
            <Card className="border-0 shadow-md border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-500" /> Agent 6: Quality Reviewer
                  <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-semibold ml-auto">Google Gemini</span>
                </CardTitle>
                <CardDescription>Chấm điểm SEO + AIO, kiểm tra chất lượng và đề xuất chỉnh sửa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SelectField label="Model" value={settings.agent_quality_reviewer_model || 'gemini-2.0-flash'} onChange={(v) => handleChange('agent_quality_reviewer_model', v)} options={[
                  { value: 'gemini-2.0-flash', label: 'Google Gemini 2.0 Flash (Khuyến nghị)' },
                  { value: 'gemini-2.0-flash-lite', label: 'Google Gemini 2.0 Flash Lite (Nhanh)' },
                ]} />
                <InputField label="Timeout (giây)" value={settings.pipeline_quality_reviewer_timeout_seconds || '180'} onChange={(v) => handleChange('pipeline_quality_reviewer_timeout_seconds', v)} type="number" placeholder="180" />
                <TextareaField label="System Instruction" value={settings.agent_quality_reviewer_system_instruction || ''} onChange={(v) => handleChange('agent_quality_reviewer_system_instruction', v)} placeholder="Để trống để dùng hướng dẫn mặc định..." hint="Tùy chỉnh prompt hệ thống" rows={8} />
              </CardContent>
            </Card>

            {/* Agent 7: Image Generator */}
            <Card className="border-0 shadow-md border-l-4 border-l-pink-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-pink-500" /> Agent 7: Image Generator
                  <span className="text-[10px] bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full font-semibold ml-auto">DALL-E / Gemini</span>
                </CardTitle>
                <CardDescription>Tạo ảnh cover, ảnh minh họa từ prompt của Content Writer, lưu bản nháp</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SelectField label="Nhà cung cấp ảnh" value={settings.image_provider} onChange={(v) => handleChange('image_provider', v)} options={[
                  { value: 'dalle', label: 'OpenAI DALL-E 3 (Mặc định)' },
                  { value: 'banana', label: 'API tùy chỉnh' },
                ]} />
                <InputField label="Phong cách ảnh" value={settings.image_style} onChange={(v) => handleChange('image_style', v)} placeholder="professional photography, modern urban setting..." hint="Mô tả phong cách ảnh AI sẽ tạo" />
                <div className="grid md:grid-cols-2 gap-4">
                  <InputField label="Ảnh minh họa tối thiểu" value={settings.pipeline_min_inline_images || '2'} onChange={(v) => handleChange('pipeline_min_inline_images', v)} type="number" placeholder="2" />
                  <InputField label="Ảnh minh họa tối đa" value={settings.pipeline_max_inline_images || '5'} onChange={(v) => handleChange('pipeline_max_inline_images', v)} type="number" placeholder="5" />
                </div>
                <InputField label="Timeout (giây)" value={settings.pipeline_image_generator_timeout_seconds || '360'} onChange={(v) => handleChange('pipeline_image_generator_timeout_seconds', v)} type="number" placeholder="360" />
                <TextareaField label="System Instruction" value={settings.agent_image_generator_system_instruction || ''} onChange={(v) => handleChange('agent_image_generator_system_instruction', v)} placeholder="Để trống để dùng hướng dẫn mặc định..." hint="Tùy chỉnh prompt hệ thống cho image generation" rows={8} />
              </CardContent>
            </Card>

            {/* Watermark Settings */}
            <Card className="border-0 shadow-md border-l-4 border-l-slate-400">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-slate-500" /> Watermark tự động
                </CardTitle>
                <CardDescription>Tự động gắn watermark cho tất cả ảnh (AI tạo và người dùng upload)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="font-semibold text-slate-900">Bật Watermark</p>
                    <p className="text-sm text-slate-500 mt-0.5">Gắn watermark trước khi lưu ảnh lên server</p>
                  </div>
                  <button
                    onClick={() => handleChange('watermark_enabled', settings.watermark_enabled === 'true' ? 'false' : 'true')}
                    className={cn(
                      'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                      settings.watermark_enabled === 'true' ? 'bg-amber-500' : 'bg-slate-300'
                    )}
                  >
                    <span className={cn(
                      'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                      settings.watermark_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'
                    )} />
                  </button>
                </div>
                {settings.watermark_enabled === 'true' && (
                  <>
                    <InputField label="Chữ watermark" value={settings.watermark_text || 'SignsHaus'} onChange={(v) => handleChange('watermark_text', v)} placeholder="SignsHaus" />
                    <div className="grid md:grid-cols-2 gap-4">
                      <SelectField label="Vị trí" value={settings.watermark_position || 'bottom-right'} onChange={(v) => handleChange('watermark_position', v)} options={[
                        { value: 'bottom-right', label: 'Dưới phải' },
                        { value: 'bottom-left', label: 'Dưới trái' },
                        { value: 'center', label: 'Giữa' },
                      ]} />
                      <InputField label="Độ mờ (0.1 - 1.0)" value={settings.watermark_opacity || '0.3'} onChange={(v) => handleChange('watermark_opacity', v)} placeholder="0.3" hint="0.3 = nhạt, 1.0 = đậm" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== SCHEDULE TAB ===== */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" /> Lịch chạy tự động
                </CardTitle>
                <CardDescription>AI Pipeline tự động chạy theo lịch để tạo bài viết mới</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="font-semibold text-slate-900">Tự động chạy Pipeline</p>
                    <p className="text-sm text-slate-500 mt-0.5">AI sẽ tự nghiên cứu và viết bài theo lịch</p>
                  </div>
                  <button
                    onClick={() => handleChange('schedule_enabled', settings.schedule_enabled === 'true' ? 'false' : 'true')}
                    className={cn(
                      'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                      settings.schedule_enabled === 'true' ? 'bg-amber-500' : 'bg-slate-300'
                    )}
                  >
                    <span className={cn(
                      'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                      settings.schedule_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'
                    )} />
                  </button>
                </div>

                {settings.schedule_enabled === 'true' && (
                  <>
                    <SelectField
                      label="Khoảng cách chạy"
                      value={settings.schedule_interval}
                      onChange={(v) => handleChange('schedule_interval', v)}
                      options={[
                        { value: '6', label: 'Mỗi 6 giờ' },
                        { value: '12', label: 'Mỗi 12 giờ (Khuyến nghị)' },
                        { value: '24', label: 'Mỗi ngày (24 giờ)' },
                        { value: '48', label: 'Mỗi 2 ngày (48 giờ)' },
                        { value: '168', label: 'Mỗi tuần (168 giờ)' },
                      ]}
                    />
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">Lưu ý</p>
                          <p className="text-xs text-amber-700 mt-1">
                            Bật cron trên server (hoặc Vercel Cron) để route /api/cron/pipeline được gọi định kỳ.
                            Biến môi trường CRON_SECRET phải trùng với Authorization Bearer token của cron job.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-sm font-medium text-slate-800">Lần chạy tự động gần nhất</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {settings.pipeline_last_run_at
                          ? new Date(settings.pipeline_last_run_at).toLocaleString('vi-VN')
                          : 'Chưa có dữ liệu'}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-emerald-500" /> Lịch chạy SEO Audit
                </CardTitle>
                <CardDescription>Tự động quét sitemap và re-scan các trang SEO đã cũ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="font-semibold text-slate-900">Bật SEO Audit tự động</p>
                    <p className="text-sm text-slate-500 mt-0.5">Cron sẽ gọi /api/cron/seo-audit theo lịch</p>
                  </div>
                  <button
                    onClick={() => handleChange('seo_schedule_enabled', settings.seo_schedule_enabled === 'true' ? 'false' : 'true')}
                    className={cn(
                      'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                      settings.seo_schedule_enabled === 'true' ? 'bg-emerald-500' : 'bg-slate-300'
                    )}
                  >
                    <span className={cn(
                      'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                      settings.seo_schedule_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'
                    )} />
                  </button>
                </div>

                {settings.seo_schedule_enabled === 'true' && (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <InputField
                        label="Khoảng cách chạy SEO (giờ)"
                        value={settings.seo_schedule_interval || '24'}
                        onChange={(v) => handleChange('seo_schedule_interval', v)}
                        type="number"
                        placeholder="24"
                      />
                      <InputField
                        label="Số URL sitemap scan mỗi lần"
                        value={settings.seo_bulk_scan_limit || '25'}
                        onChange={(v) => handleChange('seo_bulk_scan_limit', v)}
                        type="number"
                        placeholder="25"
                      />
                      <InputField
                        label="Trang cũ hơn bao nhiêu ngày"
                        value={settings.seo_stale_days || '7'}
                        onChange={(v) => handleChange('seo_stale_days', v)}
                        type="number"
                        placeholder="7"
                      />
                      <InputField
                        label="Số trang re-scan mỗi lần"
                        value={settings.seo_rescan_limit || '20'}
                        onChange={(v) => handleChange('seo_rescan_limit', v)}
                        type="number"
                        placeholder="20"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-emerald-800">Lưu ý cấu hình Cron</p>
                          <p className="text-xs text-emerald-700 mt-1">
                            Vercel đã lên lịch /api/cron/seo-audit. Cần đảm bảo CRON_SECRET hợp lệ để route chạy tự động.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-sm font-medium text-slate-800">Lần chạy SEO Audit gần nhất</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {settings.seo_last_run_at
                          ? new Date(settings.seo_last_run_at).toLocaleString('vi-VN')
                          : 'Chưa có dữ liệu'}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== SEO TAB ===== */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-amber-500" /> Cài đặt SEO Website
                </CardTitle>
                <CardDescription>Cấu hình thẻ meta cho trang chủ và chia sẻ mạng xã hội</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputField
                  label="Tiêu đề trang"
                  value={settings.seo_title}
                  onChange={(v) => handleChange('seo_title', v)}
                  placeholder="Nhập tiêu đề trang (Độ dài tối ưu không vượt quá 70 ký tự)"
                />
                <InputField
                  label="Mô tả trang"
                  value={settings.seo_description}
                  onChange={(v) => handleChange('seo_description', v)}
                  placeholder="Nhập mô tả trang (Độ dài tối ưu không vượt quá 160 ký tự)"
                />
                <InputField
                  label="Từ khoá về trang"
                  value={settings.seo_keywords}
                  onChange={(v) => handleChange('seo_keywords', v)}
                  placeholder="Nhập từ khoá về trang. Ví dụ: Landing Page, LadiPage"
                />
                <ImageField
                  label="Hình ảnh khi chia sẻ"
                  value={settings.seo_og_image}
                  onChange={(v) => handleChange('seo_og_image', v)}
                  placeholder="Nhập đường dẫn hình ảnh (K/thước khuyên dùng 1200x630px)"
                />
                <ImageField
                  label="Hình ảnh Favicon"
                  value={settings.site_favicon}
                  onChange={(v) => handleChange('site_favicon', v)}
                  placeholder="Nhập đường dẫn hình ảnh (K/thước khuyên dùng 256x256px)"
                  aspectRatio={1}
                  maxWidth={512}
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-500" /> Cài đặt SEO (AI Agent)
                </CardTitle>
                <CardDescription>Cấu hình cho AI Agent tối ưu bài viết</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <TextareaField
                  label="Khu vực SEO tập trung"
                  value={settings.seo_focus_areas}
                  onChange={(v) => handleChange('seo_focus_areas', v)}
                  placeholder="Makati, BGC, Quezon City, Pasig..."
                  hint="AI sẽ đề cập tự nhiên các địa phương này trong bài viết"
                />
                <TextareaField
                  label="Từ khóa gốc"
                  value={settings.target_keywords_seed}
                  onChange={(v) => handleChange('target_keywords_seed', v)}
                  placeholder="signage, business signs, LED signage..."
                  hint="Từ khóa nền tảng để AI mở rộng nghiên cứu"
                />
                <InputField
                  label="Đối thủ cạnh tranh"
                  value={settings.competitors}
                  onChange={(v) => handleChange('competitors', v)}
                  placeholder="Company A, Company B..."
                  hint="AI phân tích content gap so với đối thủ"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== API TAB ===== */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            {/* Main Provider Selection */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="h-5 w-5 text-amber-500" /> Nhà cung cấp AI chính (AI Provider)
                </CardTitle>
                <CardDescription>Dùng làm mặc định khi Agent chưa chọn model cụ thể</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SelectField
                  label="AI Service Provider (Mặc định)"
                  value={settings.ai_provider}
                  onChange={(v) => handleChange('ai_provider', v)}
                  options={[
                    { value: 'openai', label: 'OpenAI (GPT-5.2, DALL-E 3)' },
                    { value: 'gemini', label: 'Google Gemini (2.0 Flash)' },
                    { value: 'anthropic', label: 'Anthropic Claude (Sonnet 4)' },
                  ]}
                  hint="Chỉ dùng làm fallback. Mỗi agent tự chọn provider dựa trên model đã chọn ở tab Agents."
                />
              </CardContent>
            </Card>

            {/* OpenAI Config */}
            {/* OpenAI Config */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5 text-emerald-500" /> OpenAI API
                </CardTitle>
                <CardDescription>API key được cấu hình qua biến môi trường (.env.local)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800">OpenAI đã kết nối</p>
                    <p className="text-xs text-emerald-600">API Key được cấu hình qua OPENAI_API_KEY trong .env.local</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gemini Config */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" /> Google Gemini API
                </CardTitle>
                <CardDescription>Cấu hình API Key của Google Gemini</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputField
                  label="Gemini API Key"
                  value={settings.GEMINI_API_KEY}
                  onChange={(v) => handleChange('GEMINI_API_KEY', v)}
                  type="password"
                  placeholder="AIzaSy..."
                  hint="Lấy key tại: aistudio.google.com"
                />

                {/* Gemini Status & Test */}
                {settings.GEMINI_API_KEY ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Google Gemini đã kết nối</p>
                        <p className="text-xs text-blue-600">API Key đã được lưu. Hệ thống sẵn sàng sử dụng Gemini 2.x.</p>
                      </div>
                    </div>

                    {/* Test Button */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={async () => {
                          setTesting(true);
                          setTestResult(null);
                          try {
                            const res = await fetch('/api/admin/test-gemini', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ apiKey: settings.GEMINI_API_KEY })
                            });

                            if (res.ok) {
                              const data = await res.json();
                              if (data.success) {
                                setTestResult('success');
                                alert(`Kết nối thành công!\nModel đang sử dụng: ${data.model || 'Unknown'}\n\nLưu ý: Hệ thống đã tự động tìm model phù hợp nhất với Key của bạn.`);
                              } else {
                                console.error('Gemini Test Failed:', data);
                                setTestResult('error');
                                alert(`Lỗi: ${data.error}`);
                              }
                            } else {
                              const errData = await res.json();
                              console.error('Gemini Test HTTP Error:', res.status, errData);
                              setTestResult('error');
                              alert(`Lỗi kết nối: ${errData.error || res.statusText}`); // Show specific error
                            }
                          } catch (e: unknown) {
                            const err = e instanceof Error ? e : new Error(String(e));
                            console.error('Gemini Test Exception:', err);
                            setTestResult('error');
                            alert(`Lỗi hệ thống: ${err.message}`);
                          } finally {
                            setTesting(false);
                          }
                        }}
                        disabled={testing}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                      >
                        {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                        Test kết nối Gemini
                      </button>
                      {testResult === 'success' && (
                        <span className="text-sm text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" /> Kết nối thành công!
                        </span>
                      )}
                      {testResult === 'error' && (
                        <span className="text-sm text-red-600 flex items-center gap-1">
                          <XCircle className="h-4 w-4" /> Lỗi: Không thể kết nối (Kiểm tra Key)
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600 text-xs bg-amber-50 p-2 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    Cần nhập API Key và Lưu để sử dụng Gemini.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Perplexity API */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="h-5 w-5 text-orange-500" /> Perplexity AI API
                </CardTitle>
                <CardDescription>Dùng cho Auto-Research Analyst và SEO Research Expert</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputField
                  label="Perplexity API Key"
                  value={settings.PERPLEXITY_API_KEY}
                  onChange={(v) => handleChange('PERPLEXITY_API_KEY', v)}
                  type="password"
                  placeholder="pplx-..."
                  hint="Lấy key tại: perplexity.ai/settings/api"
                />
                {settings.PERPLEXITY_API_KEY ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 border border-orange-200">
                    <CheckCircle className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Perplexity đã kết nối</p>
                      <p className="text-xs text-orange-600">API Key đã được lưu. Agents 1-2 sẽ sử dụng Perplexity Sonar Pro.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600 text-xs bg-amber-50 p-2 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    Cần nhập API Key và Lưu để sử dụng Perplexity cho research agents.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Claude / Anthropic Config */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="h-5 w-5 text-orange-500" /> Anthropic Claude API
                </CardTitle>
                <CardDescription>Cấu hình API Key của Anthropic Claude</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputField
                  label="Anthropic API Key"
                  value={settings.ANTHROPIC_API_KEY}
                  onChange={(v) => handleChange('ANTHROPIC_API_KEY', v)}
                  type="password"
                  placeholder="sk-ant-..."
                  hint="Lấy key tại: console.anthropic.com"
                />
                {settings.ANTHROPIC_API_KEY ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 border border-orange-200">
                    <CheckCircle className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Anthropic Claude đã kết nối</p>
                      <p className="text-xs text-orange-600">API Key đã được lưu. Có thể chọn model Claude cho từng Agent.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600 text-xs bg-amber-50 p-2 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    Cần nhập API Key và Lưu để sử dụng Claude.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Custom Image API */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-purple-500" /> API tạo ảnh tùy chỉnh
                </CardTitle>
                <CardDescription>Kết nối API bên ngoài để tạo ảnh (thay thế DALL-E)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.image_provider === 'banana' ? (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <InputField label="API Endpoint" value={settings.banana_endpoint} onChange={(v) => handleChange('banana_endpoint', v)} placeholder="https://your-api.com/predict" />
                      <InputField label="API Key / Token" value={settings.banana_api_key} onChange={(v) => handleChange('banana_api_key', v)} type="password" placeholder="sk-..." />
                    </div>
                    <InputField label="Model Key (Tùy chọn)" value={settings.banana_model_key} onChange={(v) => handleChange('banana_model_key', v)} placeholder="model-v1" />
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleTestConnection}
                        disabled={testing || !settings.banana_endpoint}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                      >
                        {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                        Test kết nối
                      </button>
                      {testResult === 'success' && (
                        <span className="text-sm text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" /> Sẵn sàng
                        </span>
                      )}
                      {testResult === 'error' && (
                        <span className="text-sm text-red-600 flex items-center gap-1">
                          <XCircle className="h-4 w-4" /> Lỗi kết nối
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-sm text-slate-500">
                      Đang sử dụng DALL-E 3. Chuyển sang tab &quot;AI Agents&quot; → Agent 4 để chọn API tùy chỉnh.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== TRACKING TAB ===== */}
        {activeTab === 'tracking' && (
          <div className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" /> Tracking & Analytics
                </CardTitle>
                <CardDescription>Cấu hình mã theo dõi cho website (Google, Facebook, TikTok)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputField
                  label="Google Analytics 4 Measure ID"
                  value={settings.google_analytics_id}
                  onChange={(v) => handleChange('google_analytics_id', v)}
                  placeholder="G-XXXXXXXXXX"
                  hint="Mã đo lường GA4"
                />
                <InputField
                  label="Facebook Pixel ID"
                  value={settings.facebook_pixel_id}
                  onChange={(v) => handleChange('facebook_pixel_id', v)}
                  placeholder="123456789012345"
                  hint="ID Pixel của Facebook Ads của bạn"
                />
                <InputField
                  label="Google Ads Conversion ID"
                  value={settings.google_ads_id}
                  onChange={(v) => handleChange('google_ads_id', v)}
                  placeholder="AW-XXXXXXXXX"
                  hint="ID theo dõi chuyển đổi Google Ads (bắt đầu bằng AW-)"
                />
                <InputField
                  label="TikTok Pixel ID"
                  value={settings.tiktok_pixel_id}
                  onChange={(v) => handleChange('tiktok_pixel_id', v)}
                  placeholder="CXXXXXXXXXXXXX"
                  hint="ID Pixel của TikTok Ads"
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
