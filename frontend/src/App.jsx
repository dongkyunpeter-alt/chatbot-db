import { useEffect, useState } from "react";

const API = "https://chatbot-db-back.onrender.com";
// const API = "http://localhost:8000";

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
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
    const loadInitialSession = async () => {
      const sessionRes = await fetch(`${API}/sessions`);
      const sessionData = await sessionRes.json();
      const list = sessionData.sessions;

      setSessions(list);

      if (list.length > 0) {
        const firstSessionId = list[0].id;
        const messageRes = await fetch(`${API}/sessions/${firstSessionId}/messages`);
        const messageData = await messageRes.json();

        setSessionId(firstSessionId);
        setMsgs(messageData.messages);
      }
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
        <button className="new" onClick={newSession}>
          + 새 대화
        </button>
        <ul className="session-list">
          {sessions.map((s) => (
            <li key={s.id} className={s.id === sessionId ? "session on" : "session"}>
              {console.log("edit", editId)}
              {console.log("session", s.id)}

              {editId === s.id ? (
                <span className="rename">
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  <button onClick={() => saveTitle(s.id)}>저장</button>
                </span>
              ) : (
                <>
                  <button className="session-title" onClick={() => openSession(s.id)}>
                    {s.title}
                  </button>
                  <span className="session-tools">
                    <button onClick={() => startRename(s)}>수정</button>
                    <button onClick={() => removeSession(s.id)}>삭제</button>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      </aside>

      <main className="chat">
        <div className="box">
          {msgs.map((msg) => (
            <div key={msg.id} className={msg.role}>
              <p>{msg.text}</p>
            </div>
          ))}
          {loading && <p className="loading">생각 중...</p>}
        </div>

        <div className="input-row">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} placeholder="메시지를 입력하세요" />
          <button onClick={send}>전송</button>
        </div>
      </main>
    </div>
  );
}
