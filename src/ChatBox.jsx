import { doc, setDoc } from "firebase/firestore";

import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from "firebase/firestore";

const ChatBox = ({ chatId, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!chatId) return;

    const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
  const msgs = snapshot.docs.map(doc => doc.data());
  setMessages(msgs);

  // ✅ Mark last message as read for current user
  if (msgs.length > 0) {
    const lastTimestamp = msgs[msgs.length - 1].timestamp;
    const readRef = doc(db, "chats", chatId, "lastRead", currentUserId);
    setDoc(readRef, { timestamp: lastTimestamp }, { merge: true });
  }
});

    return () => unsubscribe();
  }, [chatId]);

  const sendMessage = async () => {
    if (newMessage.trim() === "") return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: newMessage,
      senderId: currentUserId,
      timestamp: serverTimestamp()
    });
    setNewMessage("");
  };

  return (
    <div style={{ border: "1px solid gray", padding: "10px", maxHeight: "300px", overflowY: "scroll" }}>
      <div>
        {messages.map((msg, index) => (
          <div key={index} style={{ textAlign: msg.senderId === currentUserId ? "right" : "left" }}>
            <b>{msg.senderId === currentUserId ? "You" : "Them"}:</b> {msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default ChatBox;
