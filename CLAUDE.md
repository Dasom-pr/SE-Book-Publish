# 앱제작 - Claude 가이드

## 프로젝트 개요
Enumalabs 플랫폼용 웹 앱을 개발하는 디렉토리.
반드시 상위 폴더의 `../USERAPP_GUIDE.md`를 따른다.

## 핵심 규칙
- 모호한 부분은 추측하지 말고 `AskUserQuestion`으로 확인
- 앱 이름: **소문자 + 숫자 + 하이픈(`-`)만** 사용
- 영구 데이터는 `/app/storage/` 하위에만 저장 (재배포 시 다른 경로는 삭제됨)
- Conventional Commits 사용: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
- 커밋 전 `/simplify` 실행 권장
- 대용량 파일(.mp4, .pt, .zip 등)은 Git에 커밋하지 말 것

## Enumalabs 플랫폼
- 인증: Google OAuth → Gateway가 자동 처리 (앱에서 로그인 UI 불필요)
- 사용자 정보: `X-User-Email`, `X-User-Name`, `X-User-Id` HTTP 헤더로 전달
- 로그아웃: `https://enumalabs.com/accounts/logout/` 링크로 이동
- 배포: `https://enumalabs.com/import/` 에서 ZIP 업로드 (AI가 Dockerfile 자동 생성)

## 현재 앱 목록

| 앱 이름 | 폴더 | 설명 |
|---------|------|------|
| enuma-book-publish | `enuma-book-publish/` | Enuma 책 제작·출판 앱 (React + Vite + Tailwind) |
