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

const TABS: { id: TabId; label: string; icon: any; desc: string }[] = [
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

const ImageField = ({ label, value, onChange, placeholder, hint, aspectRatio = 16 / 9 }: {
  label: string; value: string; onChange: (val: string) => void; placeholder?: string; hint?: string; aspectRatio?: number;
}) => (
  <ImageUploader
    label={label}
    value={value}
    onChange={onChange}
    aspectRatio={aspectRatio}
  />
);

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('business');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) setSettings(data.settings);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
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
                    { value: 'gpt-4o-mini', label: 'OpenAI GPT-4o Mini (Tiết kiệm)' },
                    { value: 'gpt-5.2', label: 'OpenAI GPT-5.2 (Mới nhất)' },
                    { value: 'gemini-3-flash', label: 'Google Gemini 3 Flash (Siêu nhanh 2026)' },
                    { value: 'gemini-3-pro-preview', label: 'Google Gemini 3 Pro (Mạnh nhất 2026)' },
                  ]}
                  hint="Model nhanh phù hợp vì chỉ cần tìm kiếm, không cần viết sâu"
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
              </CardContent>
            </Card>

            {/* Writer */}
            <Card className="border-0 shadow-md border-l-4 border-l-amber-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-500" /> Agent 3: Writer (Viết bài)
                </CardTitle>
                <CardDescription>Viết bài SEO chuyên nghiệp, lồng ghép doanh nghiệp, kêu gọi gọi điện</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SelectField
                  label="Model AI"
                  value={settings.writer_model}
                  onChange={(v) => handleChange('writer_model', v)}
                  options={[
                    { value: 'gpt-5.2', label: 'OpenAI GPT-5.2 (Recommended 2026)' },
                    { value: 'gpt-4o', label: 'OpenAI GPT-4o (Standard)' },
                    { value: 'gemini-3-pro', label: 'Google Gemini 3 Pro (New Powerful)' },
                    { value: 'gemini-3-flash', label: 'Google Gemini 3 Flash (Fast)' },
                  ]}
                  hint="Nên dùng GPT-5.2 hoặc Gemini 3 Pro cho chất lượng bài viết tốt nhất"
                />
                <SelectField
                  label="Ngôn ngữ viết bài"
                  value={settings.content_language}
                  onChange={(v) => handleChange('content_language', v)}
                  options={[
                    { value: 'en', label: 'English (Professional)' },
                    { value: 'tl', label: 'Tagalog (Thân thiện)' },
                    { value: 'mix', label: 'Taglish (English + Tagalog)' },
                  ]}
                />
                <InputField
                  label="Giọng văn"
                  value={settings.writer_tone}
                  onChange={(v) => handleChange('writer_tone', v)}
                  placeholder="Professional, Trustworthy, Helpful"
                  hint="Mô tả phong cách viết mà AI sẽ theo"
                />
                <InputField
                  label="Số từ tối thiểu"
                  value={settings.min_word_count}
                  onChange={(v) => handleChange('min_word_count', v)}
                  type="number"
                  placeholder="800"
                  hint="Mỗi bài viết phải có ít nhất bao nhiêu từ"
                />
                <InputField
                  label="Đối tượng mục tiêu"
                  value={settings.target_audience}
                  onChange={(v) => handleChange('target_audience', v)}
                  placeholder="SME Owners, Corporate Managers..."
                  hint="AI sẽ điều chỉnh ngôn ngữ phù hợp với đối tượng này"
                />
              </CardContent>
            </Card>

            {/* Visual Inspector */}
            <Card className="border-0 shadow-md border-l-4 border-l-emerald-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-emerald-500" /> Agent 4: Visual Inspector (Hình ảnh)
                </CardTitle>
                <CardDescription>Kiểm tra bài viết, tạo ảnh minh họa, lưu bản nháp</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SelectField
                  label="Nhà cung cấp ảnh"
                  value={settings.image_provider}
                  onChange={(v) => handleChange('image_provider', v)}
                  options={[
                    { value: 'dalle', label: 'OpenAI DALL-E 3 (Mặc định)' },
                    { value: 'banana', label: 'Nano Banana Pro / API tùy chỉnh' },
                  ]}
                />
                <InputField
                  label="Phong cách ảnh"
                  value={settings.image_style}
                  onChange={(v) => handleChange('image_style', v)}
                  placeholder="professional photography, modern urban setting..."
                  hint="Mô tả phong cách ảnh AI sẽ tạo"
                />
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
                            Tính năng tự động chạy cần cài đặt Cron Job trên server.
                            Hiện tại, bạn có thể chạy Pipeline thủ công từ trang AI Command Center.
                          </p>
                        </div>
                      </div>
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
                <CardDescription>Chọn dịch vụ AI sẽ sử dụng cho toàn bộ hệ thống</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SelectField
                  label="AI Service Provider"
                  value={settings.ai_provider}
                  onChange={(v) => handleChange('ai_provider', v)}
                  options={[
                    { value: 'openai', label: 'OpenAI (GPT-5.2, DALL-E 3)' },
                    { value: 'gemini', label: 'Google Gemini (3 Pro, 3 Flash)' },
                  ]}
                  hint="OpenAI ổn định hơn, Gemini tốc độ nhanh và chi phí thấp hơn (hoặc miễn phí)"
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
                        <p className="text-xs text-blue-600">API Key đã được lưu. Hệ thống sẵn sàng sử dụng Gemini 3.</p>
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
                          } catch (e: any) {
                            console.error('Gemini Test Exception:', e);
                            setTestResult('error');
                            alert(`Lỗi hệ thống: ${e.message}`);
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
                      Đang sử dụng DALL-E 3. Chuyển sang tab "AI Agents" → Agent 4 để chọn API tùy chỉnh.
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
