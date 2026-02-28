import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { FaUserCircle } from "react-icons/fa";
import logo from "./assets/logo.png";
import { FaMicrophone, FaPaperPlane } from "react-icons/fa";

function App() {

  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [mode, setMode] = useState("chat"); 


  const [authData, setAuthData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const bottomRef = useRef(null);

  /* ---------------- LOAD USER ---------------- */
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  /* ---------------- LOAD CHATS ---------------- */
  useEffect(() => {
    if (!user) return;

    fetch(`http://localhost:3000/chats/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setChats(data);
      });
  }, [user]);

  const currentChat = chats.find(c => c._id === activeChat);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages]);

  /* ---------------- SEND MESSAGE ---------------- */
  const sendMessage = async () => {
  if (!message.trim() || !user) return;

  const userMessage = message;
  setMessage("");

  const isNewChat = activeChat === null;

  // TEMP CHAT UPDATE (SHOW MESSAGE INSTANTLY)
  const tempChat = {
    _id: activeChat || Date.now().toString(),
    title: userMessage.slice(0, 25),
    messages: [
      ...(currentChat?.messages || []),
      { type: "user", text: userMessage },
      { type: "ai", text: "Typing..." }
    ]
  };

  if (isNewChat) {
    setChats(prev => [tempChat, ...prev]);
  } else {
    setChats(prev =>
      prev.map(c =>
        c._id === activeChat ? tempChat : c
      )
    );
  }

  setActiveChat(tempChat._id);

  try {
    const res = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: userMessage,
        chatId: isNewChat ? null : activeChat,
        userId: user.id
      })
    });

    const updatedChat = await res.json();

    // Replace temp chat with real chat from DB
    setChats(prev =>
      prev.map(c =>
        c._id === tempChat._id ? updatedChat : c
      )
    );

    setActiveChat(updatedChat._id);

  } catch (err) {
    console.log(err);
  }
};

  /* ---------------- AUTH ---------------- */

  const handleAuth = async () => {
    const endpoint = isLogin ? "login" : "signup";

    const res = await fetch(`http://localhost:3000/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authData)
    });

    const data = await res.json();

    if (isLogin && data.user) {
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      setShowAuth(false);
    } else if (!isLogin) {
      alert("Account created. Please login.");
      setIsLogin(true);
    } else {
      alert(data.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setChats([]);
    setActiveChat(null);
    setShowProfile(false);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: darkMode ? "#0f172a" : "#f3f4f6",
        color: darkMode ? "white" : "#111"
      }}
    >

      {/* SIDEBAR */}
      <div
        style={{
          width: "260px",
          background: darkMode ? "#111827" : "#e5e7eb",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}
      >
        <div style={{ padding: "20px" }}>
          <img src={logo} alt="logo" style={{ width: "150px", marginBottom: "20px" }} />

          {user && (
            <>
              <button
                onClick={() => setActiveChat(null)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#2563eb",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                + New Chat
              </button>

              


              {/* CHAT HISTORY */}
              <div style={{ marginTop: "20px" }}>
                {chats.map(chat => (
                  <div
                    key={chat._id}
                    onClick={() => setActiveChat(chat._id)}
                    style={{
                      padding: "10px",
                      marginBottom: "8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      background:
                        activeChat === chat._id
                          ? "#2563eb"
                          : darkMode
                          ? "#1f2937"
                          : "#ffffff",
                      color:
                        activeChat === chat._id
                          ? "white"
                          : darkMode
                          ? "#f1f1f1"
                          : "#111"
                    }}
                  >
                    {chat.title}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* PROFILE + THEME */}
        <div
          style={{
            padding: "15px",
            borderTop: "1px solid #444",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          {user ? (
            <div style={{ position: "relative" }}>
              <FaUserCircle
                size={28}
                style={{ cursor: "pointer" }}
                onClick={() => setShowProfile(!showProfile)}
              />

              {showProfile && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "40px",
                    left: 0,
                    background: darkMode ? "#1f2937" : "#fff",
                    padding: "12px",
                    borderRadius: "10px",
                    width: "200px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                  }}
                >
                  <p style={{ fontWeight: "bold" }}>{user.name}</p>
                  <p style={{ fontSize: "13px", opacity: 0.7 }}>{user.email}</p>

                  <button
                    onClick={logout}
                    style={{
                      marginTop: "10px",
                      width: "100%",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "none",
                      background: "#ef4444",
                      color: "white",
                      cursor: "pointer"
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "none",
                background: "#2563eb",
                color: "white",
                cursor: "pointer"
              }}
            >
              Login
            </button>
          )}

          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "none",
              background: "#2563eb",
              color: "white",
              cursor: "pointer"
            }}
          >
            {darkMode ? "Light" : "Dark"}
          </button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "30px" }}>

        {!user ? (
          <h2>Please login to start chatting</h2>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {currentChat?.messages?.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
                    marginBottom: "20px"
                  }}
                >
                  <div
                    style={{
                      maxWidth: "75%",
                      padding: "14px 18px",
                      borderRadius: "14px",
                      background:
                        msg.type === "user"
                          ? "#2563eb"
                          : darkMode
                          ? "#1f2937"
                          : "#ffffff"
                    }}
                  >
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div
  style={{
    position: "relative",
    marginTop: "20px"
  }}
>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      background: darkMode ? "#1e293b" : "#ffffff",
      borderRadius: "50px",
      padding: "10px 15px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
    }}
  >
    <input
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
      placeholder="Ask anything"
      style={{
        flex: 1,
        border: "none",
        outline: "none",
        background: "transparent",
        color: darkMode ? "white" : "#111",
        fontSize: "15px"
      }}
    />

    {/* Mic Button */}
    <button
      style={{
        background: "transparent",
        border: "none",
        color: darkMode ? "#aaa" : "#444",
        cursor: "pointer",
        marginRight: "10px"
      }}
    >
      <FaMicrophone size={18} />
    </button>

    {/* Send Button */}
    <button
      onClick={sendMessage}
      style={{
        background: "#2563eb",
        border: "none",
        borderRadius: "50%",
        width: "38px",
        height: "38px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: "white"
      }}
    >
      <FaPaperPlane size={14} />
    </button>
  </div>
</div>
          </>
        )}
      </div>

      {/* AUTH MODAL SAME AS YOUR OLD */}
      {showAuth && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <div style={{
            background: darkMode ? "#1f2937" : "#fff",
            padding: "30px",
            borderRadius: "12px",
            width: "350px"
          }}>
            <h2>{isLogin ? "Login" : "Sign Up"}</h2>

            {!isLogin && (
              <input
                placeholder="Full Name"
                onChange={(e) =>
                  setAuthData({ ...authData, name: e.target.value })
                }
                style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
              />
            )}

            <input
              placeholder="Email"
              onChange={(e) =>
                setAuthData({ ...authData, email: e.target.value })
              }
              style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
            />

            <input
              type="password"
              placeholder="Password"
              onChange={(e) =>
                setAuthData({ ...authData, password: e.target.value })
              }
              style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
            />

            <button
              onClick={handleAuth}
              style={{
                width: "100%",
                padding: "10px",
                background: "#2563eb",
                border: "none",
                borderRadius: "6px",
                color: "white"
              }}
            >
              {isLogin ? "Login" : "Sign Up"}
            </button>

            <p onClick={() => setIsLogin(!isLogin)} style={{ cursor: "pointer", marginTop: "10px" }}>
              {isLogin ? "Don't have account? Sign Up" : "Already have account? Login"}
            </p>

            <button onClick={() => setShowAuth(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;