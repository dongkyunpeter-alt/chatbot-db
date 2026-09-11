import { useEffect, useRef, useState } from "react";

// const API = "https://chatbot-db-back.onrender.com";
const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const hasInitialized = useRef(false);
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 저장된 세션 목록을 불러옵니다.
  const loadSessions = async () => {
    const res = await fetch(`${API}/sessions`);
    const data = await res.json();
    setSessions(data.sessions);
    return data.sessions;
  };

  // 선택한 세션의 메시지를 불러옵니다.
  const loadMsg = async (id) => {
    if (!id) {
      setMsgs([]);
      return;
    }

    const res = await fetch(`${API}/sessions/${id}/messages`);
    const data = await res.json();
    setMsgs(data.messages);
  };

  const openSession = (id) => {
    setSessionId(id);
    loadMsg(id);
  };

  const newSession = async () => {
    const res = await fetch(`${API}/sessions`, { method: "POST" });
    const data = await res.json();

    await loadSessions();
    setSessionId(data.id);
    setMsgs([]);
  };

  useEffect(() => {
    // 개발 모드의 Strict Mode가 effect를 다시 실행해도 초기 세션은 한 번만 만듭니다.
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const loadInitialSession = async () => {
      const sessionRes = await fetch(`${API}/sessions`);
      const sessionData = await sessionRes.json();
      let list = sessionData.sessions;

      // 첫 실행처럼 저장된 대화가 없을 때도, 바로 선택할 수 있는 세션을 만듭니다.
      if (list.length === 0) {
        const createRes = await fetch(`${API}/sessions`, { method: "POST" });
        const newSessionData = await createRes.json();
        list = [{ id: newSessionData.id, title: newSessionData.title }];
      }

      setSessions(list);

      const firstSessionId = list[0].id;
      const messageRes = await fetch(`${API}/sessions/${firstSessionId}/messages`);
      const messageData = await messageRes.json();

      setSessionId(firstSessionId);
      setMsgs(messageData.messages);
    };

    loadInitialSession();
  }, []);
  // 수정할 세션의 id, title로 선택
  const startRename = (s) => {
    setEditId(s.id);
    setEditTitle(s.title);
  };
  // 세션 타이틀 수정
  const saveTitle = async (id) => {
    await fetch(`${API}/sessions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle }),
    });
    setEditId(null);
    await loadSessions();
  };

  const removeSession = async (id) => {
    await fetch(`${API}/sessions/${id}`, { method: "DELETE" });
    const list = await loadSessions();
    const next = list.length > 0 ? list[0].id : null;
    setSessionId(next);
    loadMsg(next);
  };

  const send = async () => {
    if (!input.trim() || !sessionId) return;

    const text = input;
    setInput("");
    setLoading(true);

    await fetch(`${API}/sessions/${sessionId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    await loadMsg(sessionId);
    await loadSessions();
    setLoading(false);
  };

  const onKey = (e) => {
    if (e.key === "Enter") send();
  };

  return (
    <div className="app">
      <aside className="side">
        <div className="brand"><span className="brand-mark">✦</span><span>mong</span></div>
        <button className="new" onClick={newSession}>
          <span>＋</span> 새 대화
        </button>
        <p className="session-label">내 대화</p>
        <ul className="session-list">
          {sessions.map((s) => (
            <li key={s.id} className={s.id === sessionId ? "session on" : "session"}>
              {editId === s.id ? (
                <span className="rename">
                  <input aria-label="대화 제목" autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  <button onClick={() => saveTitle(s.id)}>저장</button>
                </span>
              ) : (
                <>
                  <button className="session-title" onClick={() => openSession(s.id)}>
                    {s.title}
                  </button>
                  <span className="session-tools">
                    <button aria-label={`${s.title} 제목 수정`} onClick={() => startRename(s)}>✎</button>
                    <button aria-label={`${s.title} 삭제`} onClick={() => removeSession(s.id)}>×</button>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
        <div className="side-footer">AI와 편안하게 대화해 보세요.</div>
      </aside>

      <main className="chat">
        <header className="chat-header">
          <div><p className="eyebrow">AI COMPANION</p><h1>무엇을 도와드릴까요?</h1></div>
          <span className="status"><i /> 온라인</span>
        </header>
        <div className="box" aria-live="polite">
          {msgs.length === 0 && !loading && (
            <section className="welcome">
              <div className="bot-orb">✦</div>
              <p className="welcome-kicker">READY WHEN YOU ARE</p>
              <h2>가볍게, 무엇이든<br />물어보세요.</h2>
              <p>아이디어를 정리하거나 궁금한 것을 함께 찾아볼 수 있어요.</p>
            </section>
          )}
          {msgs.map((msg) => (
            <div key={msg.id} className={msg.role}>
              <div className="message-meta">{msg.role === "user" ? "나" : "mong"}</div><p>{msg.text}</p>
            </div>
          ))}
          {loading && <p className="loading"><span /> 답변을 준비하고 있어요</p>}
        </div>

        <div className="input-row">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} placeholder="무엇이든 물어보세요" aria-label="메시지 입력" />
          <button onClick={send} disabled={!input.trim() || loading} aria-label="메시지 전송">↑</button>
        </div>
        <p className="input-hint">Enter를 눌러 전송</p>
      </main>
    </div>
  );
}
