# chatbot-db

## 공개 데모

프런트엔드는 GitHub Pages로 자동 배포됩니다.

- 데모: https://dongkyunpeter-alt.github.io/chatbot-db/
- 백엔드 API 문서: https://chatbot-db-back.onrender.com/docs

`main` 브랜치의 `frontend` 변경 사항이 GitHub Actions를 통해 자동으로 빌드·배포됩니다.

FastAPI, React, SQLite로 만든 대화 세션 관리 챗봇입니다. AI 응답은 Hugging Face의 OpenAI 호환 Chat Completions API를 통해 생성합니다.

## 구성

| 구분 | 실제 구성 |
| --- | --- |
| 프런트엔드 | React 19.2.8, Vite 8.2.2 |
| 백엔드 | Python 3.14.6, FastAPI, Uvicorn |
| 데이터베이스 | SQLite (`backend/chat.db`) |
| AI 모델 | `Qwen/Qwen3-4B-Instruct-2507` |
| AI API | Hugging Face Router (`https://router.huggingface.co/v1/chat/completions`) |
| 프런트엔드 API 주소 | `http://localhost:8000` |

## 기능

- 대화 세션 생성, 목록 조회, 이름 변경, 삭제
- 세션별 메시지 조회 및 저장
- 이전 대화 내용을 포함해 AI 응답 생성
- SQLite 외래 키와 `ON DELETE CASCADE`를 이용한 세션 삭제 시 메시지 동시 삭제

## 실행 방법

### 1. 백엔드

`backend/.env`에 Hugging Face 토큰을 설정합니다.

```env
HF_TOKEN=your_hugging_face_token
```

그다음 백엔드를 실행합니다.

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### 2. 프런트엔드

별도 터미널에서 실행합니다.

```powershell
cd frontend
npm install
npm run dev
```

개발 서버가 표시한 주소(일반적으로 `http://localhost:5173`)로 접속합니다.

## API

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| `POST` | `/chat` | 단일 메시지로 AI 응답 생성 |
| `GET` | `/sessions` | 세션 목록 조회 |
| `POST` | `/sessions` | 세션 생성 |
| `GET` | `/sessions/{session_id}/messages` | 세션의 메시지 조회 |
| `POST` | `/sessions/{session_id}/messages` | 메시지 저장 및 AI 응답 생성 |
| `PUT` | `/sessions/{session_id}` | 세션 제목 변경 |
| `DELETE` | `/sessions/{session_id}` | 세션 삭제 |

## 측정 및 검증 결과

아래 값은 2026-09-11에 현재 저장소 상태에서 측정했습니다. 데이터베이스 내용은 대화 사용에 따라 달라집니다.

| 항목 | 실측값 |
| --- | --- |
| SQLite 세션 수 | 3 |
| SQLite 메시지 수 | 10 |
| `backend/chat.db` 크기 | 28,672 bytes (28 KiB) |
| `GET /sessions` 응답 | HTTP 200, 세션 3개 |
| 프런트엔드 프로덕션 빌드 | 성공 (18개 모듈, 580 ms) |
| 빌드 JS 크기 | 195.05 kB / gzip 61.81 kB |
| ESLint | 통과 |

## 데이터베이스 테이블

- `sessions`: `id`, `title`, `created_at`
- `messages`: `id`, `session_id`, `role`, `text`, `created_at`

`messages.session_id`는 `sessions.id`를 참조합니다.
