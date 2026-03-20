# Enuma Book Publish App - 설계 문서

## 목적
kitkitschool-web `/library`의 책 템플릿 포맷(bookinfo.csv + library_books.json)과 호환되는
책 제작·출판 웹 앱. 사용자가 책 정보를 입력하고 페이지 내용을 편집한 뒤 ZIP으로 출판할 수 있다.

## 앱 정보
- 앱 이름: `enuma-book-publish`
- 도메인: `enuma-book-publish.enumalabs.com`
- 기술 스택: React 18 + TypeScript + Vite + Tailwind CSS
- 배포: node:18-alpine(빌드) → nginx:alpine(서빙) 멀티스테이지 Docker

## 2-Step Wizard 구조

### Step 1: 책 기본 정보
1. 제목 (text input)
2. 저자 - Written by / Illustrated by (text input ×2)
3. 책 주제 (select: 동물/자연/숫자/알파벳/사회/과학/기타)
4. 책 난이도 (radio 5단계: 입문 Lv.1 ~ 심화 Lv.5)

> 책 총 글자 수: Step 2에서 페이지 입력 시 실시간 자동 카운트 (공백 제외)

### Step 2: 책 내용 설정
- **상단 툴바**: `[+ 페이지 추가]` `[선택 페이지 삭제]` 텍스트 버튼
- **페이지 카드**: 체크박스 + 페이지번호 + 텍스트 입력 + 이미지 업로드(미리보기) + 자동생성 버튼
- **성우 선택**: 남성/여성/아이 + 각 옵션 옆 `▶ 테스트` 버튼 (Web Speech API)
- **발간 언어**: 한국어 🇰🇷 / English 🇺🇸 / Bahasa Indonesia 🇮🇩
- **하단 바**: `[← 이전]` — `총 글자 수(공백 제외): N자` — `[📚 책 출판하기]`

## 출력 포맷
ZIP 다운로드 (kitkitschool-web 호환):
```
{bookId}/
├── bookinfo.csv
├── credit.txt
├── library_entry.json
└── page/
    ├── page_1.png
    └── ...
```

## 파일 구조
```
enuma-book-publish/
├── Dockerfile
├── nginx.conf
├── package.json
└── src/
    ├── App.tsx
    ├── context/BookContext.tsx
    ├── types/book.ts
    ├── pages/
    │   ├── Step1MetaPage.tsx
    │   └── Step2ContentPage.tsx
    ├── components/
    │   ├── StepIndicator.tsx
    │   ├── PageEditor.tsx
    │   └── ImageUploader.tsx
    └── utils/exportBook.ts
```
