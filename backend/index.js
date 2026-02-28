import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* ---------------- DATABASE ---------------- */

mongoose.connect("mongodb://127.0.0.1:27017/AI")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("Mongo Error:", err));

/* ---------------- SCHEMAS ---------------- */

const chatSchema = new mongoose.Schema({
  userId: String,
  title: String,
  messages: [
    {
      type: { type: String },
      text: String
    }
  ]
}, { timestamps: true });

const Chat = mongoose.model("Chat", chatSchema);

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String
});

const User = mongoose.model("User", userSchema);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/* ---------------- CHAT ---------------- */

app.post("/chat", async (req, res) => {
  const { prompt, chatId, userId } = req.body;

  if (!prompt || !userId) {
    return res.status(400).json({ message: "Prompt and user required" });
  }

  try {
    let chat;

    if (chatId) {
      chat = await Chat.findById(chatId);
    }

    if (!chat) {
      chat = new Chat({
        userId,
        title: prompt.slice(0, 25),
        messages: []
      });
    }

    chat.messages.push({ type: "user", text: prompt });

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openrouter/auto",
        messages: [
          { role: "system", content: "You are a helpful AI." },
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const aiText = response.data.choices[0].message.content;

    chat.messages.push({ type: "ai", text: aiText });

    await chat.save();

    res.json(chat);

  } catch (err) {
    console.log(err.response?.data || err.message);
    res.status(500).json({ message: "AI Error" });
  }
});

/* ---------------- GET CHATS ---------------- */

app.get("/chats/:userId", async (req, res) => {
  const chats = await Chat.find({ userId: req.params.userId })
    .sort({ createdAt: -1 });

  res.json(chats);
});

/* ---------------- SIGNUP ---------------- */

app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = new User({ name, email, password: hashed });
  await user.save();

  res.json({ message: "User created" });
});

/* ---------------- LOGIN ---------------- */

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: "Wrong password" });

  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  });
});

/* ---------------- SERVER ---------------- */

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

