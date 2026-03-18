# Non-Blog SEO Prompt Templates (VN)

Tai lieu nay cung cap template san cho 3 loai non-blog page:
- Service page
- About page
- Solution page

Muc tieu: draft dau tien da co day du SEO fields, de `Analyze Quality` dat diem cao ma khong phu thuoc qua nhieu vao `Auto-fix Draft`.

## Huong dan su dung nhanh

1. Chon dung template theo loai trang.
2. Dien cac bien `{{...}}`.
3. Gui Prompt tao draft.
4. Gui Prompt SEO QA de AI tu kiem va tu sua.
5. Dan ket qua vao CMS va chay `Analyze Quality`.

---

## 1) Template - Service Page

### 1.1 Form dien thong tin

```txt
PRIMARY_KEYWORD={{...}}
SECONDARY_KEYWORDS={{kw1, kw2, kw3}}
SEARCH_INTENT={{commercial | transactional | informational}}
BRAND={{...}}
AUDIENCE={{...}}
SERVICE_NAME={{...}}
USP={{...}}
SERVICE_AREAS={{...}}
PRICING_HINT={{...}}
CTA={{Nhan bao gia | Dat lich tu van | Goi ngay...}}
INTERNAL_LINKS={{anchor1|https://... ; anchor2|https://...}}
WORD_COUNT={{900-1400}}
TONE={{chuyen nghiep, ro rang, thuyet phuc}}
```

### 1.2 Prompt tao draft

```txt
Ban la Senior SEO Content Writer cho Service Page tieng Viet.

Muc tieu:
- Tao noi dung chuyen doi tot va than thien SEO (target >= 80 khi Analyze Quality).
- Viet tu nhien, khong nhoi keyword, dung search intent.

Dau vao:
- Primary keyword: {{PRIMARY_KEYWORD}}
- Secondary keywords: {{SECONDARY_KEYWORDS}}
- Search intent: {{SEARCH_INTENT}}
- Brand: {{BRAND}}
- Audience: {{AUDIENCE}}
- Service name: {{SERVICE_NAME}}
- USP: {{USP}}
- Service areas: {{SERVICE_AREAS}}
- Pricing hint: {{PRICING_HINT}}
- CTA: {{CTA}}
- Internal links: {{INTERNAL_LINKS}}
- Target length: {{WORD_COUNT}}
- Tone: {{TONE}}

Yeu cau bat buoc:
1) SEO fields
- SEO title 50-60 ky tu, co primary keyword gan dau.
- Meta description 140-155 ky tu, co primary keyword 1 lan va CTA.
- Slug ngan, lowercase, khong dau, dung dau gach noi.

2) Cau truc
- 1 H1 duy nhat (khong trung 100% voi SEO title).
- Co H2/H3 hop ly.
- Mo bai 40-70 tu: van de + loi ich chinh.
- Co section "Quy trinh", "Bang gia" (neu khong co so cu the thi mo ta nguyen tac bao gia), "FAQ".

3) SEO noi dung
- Primary keyword xuat hien tu nhien tai: H1, 100 tu dau, it nhat 1 H2, ket bai.
- Co it nhat 2 internal links tu danh sach cho truoc.
- Co bullet list cho loi ich/diem khac biet.

4) Chuyen doi
- Neu ro cam ket dich vu, loi ich do duoc.
- Co CTA ro o giua bai va cuoi bai.

Chi tra ve dung dinh dang sau:
- seo_title:
- meta_description:
- slug:
- h1:
- outline:
- body_markdown:
- faq:
- internal_links_used:
- final_cta:
```

---

## 2) Template - About Page

### 2.1 Form dien thong tin

```txt
PRIMARY_KEYWORD={{...}}
SECONDARY_KEYWORDS={{kw1, kw2, kw3}}
BRAND={{...}}
FOUNDED_YEAR={{...}}
MISSION={{...}}
VISION={{...}}
CORE_VALUES={{...}}
PROOF_POINTS={{giai thuong/chung nhan/so lieu uy tin}}
AUDIENCE={{...}}
CTA={{Lien he | Xem du an | Dat lich trao doi}}
INTERNAL_LINKS={{anchor1|https://... ; anchor2|https://...}}
WORD_COUNT={{700-1200}}
TONE={{chan thanh, chuyen nghiep, dang tin}}
```

### 2.2 Prompt tao draft

```txt
Ban la Senior SEO Content Writer cho trang About Page tieng Viet.

Muc tieu:
- Viet trang gioi thieu thuong hieu ro rang, dang tin, co SEO on-page day du.
- Toi uu de dat diem SEO cao ngay sau Analyze Quality.

Dau vao:
- Primary keyword: {{PRIMARY_KEYWORD}}
- Secondary keywords: {{SECONDARY_KEYWORDS}}
- Brand: {{BRAND}}
- Founded year: {{FOUNDED_YEAR}}
- Mission: {{MISSION}}
- Vision: {{VISION}}
- Core values: {{CORE_VALUES}}
- Proof points: {{PROOF_POINTS}}
- Audience: {{AUDIENCE}}
- CTA: {{CTA}}
- Internal links: {{INTERNAL_LINKS}}
- Target length: {{WORD_COUNT}}
- Tone: {{TONE}}

Yeu cau bat buoc:
1) SEO fields
- SEO title 50-60 ky tu, co primary keyword.
- Meta description 140-155 ky tu, co primary keyword + gia tri thuong hieu.
- Slug ngan, lowercase, khong dau.

2) Cau truc
- 1 H1 duy nhat, khong trung 100% SEO title.
- Co section: Cua chung toi, Su menh tam nhin, Gia tri cot loi, Vi sao dang tin, FAQ.
- Mo bai gon 40-70 tu.

3) SEO noi dung
- Primary keyword dat tai H1, doan mo dau, it nhat 1 H2, ket bai.
- Co toi thieu 2 internal links hop ngu canh.
- Cau van ngan, ro, tranh khoa truong.

4) Thuong hieu
- Giong van nhat quan.
- Neu co so lieu/chung nhan thi trinh bay than trong, khong phong dai.

Chi tra ve dung dinh dang sau:
- seo_title:
- meta_description:
- slug:
- h1:
- outline:
- body_markdown:
- faq:
- internal_links_used:
- final_cta:
```

---

## 3) Template - Solution Page

### 3.1 Form dien thong tin

```txt
PRIMARY_KEYWORD={{...}}
SECONDARY_KEYWORDS={{kw1, kw2, kw3}}
SEARCH_INTENT={{commercial | informational}}
BRAND={{...}}
AUDIENCE={{...}}
PAIN_POINTS={{...}}
SOLUTION_OVERVIEW={{...}}
FEATURES={{...}}
USE_CASES={{...}}
DIFFERENTIATORS={{...}}
CTA={{Yeu cau demo | Nhan tu van giai phap...}}
INTERNAL_LINKS={{anchor1|https://... ; anchor2|https://...}}
WORD_COUNT={{1000-1600}}
TONE={{phan tich, thuyet phuc, huong ket qua}}
```

### 3.2 Prompt tao draft

```txt
Ban la Senior SEO Content Writer cho Solution Page tieng Viet.

Muc tieu:
- Trinh bay van de -> giai phap -> loi ich -> buoc tiep theo mot cach ro rang.
- Toi uu on-page SEO de diem Analyze Quality cao tu ban draft dau.

Dau vao:
- Primary keyword: {{PRIMARY_KEYWORD}}
- Secondary keywords: {{SECONDARY_KEYWORDS}}
- Search intent: {{SEARCH_INTENT}}
- Brand: {{BRAND}}
- Audience: {{AUDIENCE}}
- Pain points: {{PAIN_POINTS}}
- Solution overview: {{SOLUTION_OVERVIEW}}
- Features: {{FEATURES}}
- Use cases: {{USE_CASES}}
- Differentiators: {{DIFFERENTIATORS}}
- CTA: {{CTA}}
- Internal links: {{INTERNAL_LINKS}}
- Target length: {{WORD_COUNT}}
- Tone: {{TONE}}

Yeu cau bat buoc:
1) SEO fields
- SEO title 50-60 ky tu, co primary keyword gan dau.
- Meta description 140-155 ky tu, co keyword + loi ich + CTA.
- Slug ngan, lowercase, khong dau.

2) Cau truc
- 1 H1 duy nhat (khong trung 100% SEO title).
- Section nen co: Van de hien tai, Giai phap de xuat, Tinh nang noi bat, Loi ich kinh doanh, Truong hop ap dung, FAQ.
- Mo bai 40-70 tu.

3) SEO noi dung
- Primary keyword o H1, 100 tu dau, it nhat 1 H2, ket bai.
- Secondary keywords phan bo tu nhien.
- It nhat 2 internal links tu danh sach.
- Co bullet list cho tinh nang/loi ich.

4) Chuyen doi
- Co CTA giua bai + cuoi bai.
- Nhan manh ket qua va buoc hanh dong tiep theo.

Chi tra ve dung dinh dang sau:
- seo_title:
- meta_description:
- slug:
- h1:
- outline:
- body_markdown:
- faq:
- internal_links_used:
- final_cta:
```

---

## 4) Prompt SEO QA (dung chung cho moi loai non-blog)

```txt
Ban dong vai SEO QA. Kiem tra draft theo checklist. Muc nao fail thi tu sua va in lai ban cuoi.

Checklist pass/fail:
- [ ] SEO title 50-60 ky tu
- [ ] Meta description 140-155 ky tu
- [ ] SEO title va H1 khong trung 100%
- [ ] Co dung 1 H1
- [ ] Primary keyword co trong H1, mo bai, it nhat 1 H2, ket bai
- [ ] Co >= 2 internal links hop ngu canh
- [ ] Co FAQ 3-5 cau
- [ ] Cau van tu nhien, khong nhoi keyword
- [ ] Co CTA ro rang o cuoi bai

Chi tra ve:
1) FINAL_DRAFT da sua
2) CHECKLIST_RESULT ngan gon (pass/fail)
```

---

## 5) Checklist van hanh de tranh SEO = 10

- Luon map day du 3 truong SEO: `seo_title`, `meta_description`, `slug` truoc khi Analyze.
- Dam bao `PRIMARY_KEYWORD` da duoc dien vao field focus keyword (neu CMS co).
- Buoc QA bat buoc: chay Prompt SEO QA 1 lan truoc khi dan vao CMS.
- Kiem tra internal links hop le, khong de URL rong.
- Neu van diem thap, doi chieu goi y trong Content Quality va bo sung dung truong dang thieu.
