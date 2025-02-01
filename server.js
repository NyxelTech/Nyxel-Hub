require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const cors = require("cors");
const { Telegraf } = require("telegraf");

const app = express();
app.use(express.json());
app.use(cors());

// Initialize the Telegram bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// MongoDB setup (for storing users)
mongoose.connect("mongodb://localhost:27017/nyxel-hub", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = mongoose.model("User", new mongoose.Schema({
  telegramId: String,
  username: String,
  role: { type: String, default: "user" },
}));

// API for Telegram authentication
app.post("/api/auth/telegram", async (req, res) => {
  const { telegramId, username } = req.body;
  if (!telegramId || !username) return res.status(400).json({ error: "Missing data" });

  let user = await User.findOne({ telegramId });
  if (!user) {
    user = new User({ telegramId, username, role: "user" });
    await user.save();
  }

  const token = jwt.sign({ telegramId, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, role: user.role });
});

// Telegram /start command
bot.command("start", (ctx) => {
  const user = ctx.message.from;
  ctx.reply(`Welcome, ${user.username}! To log in, click here:\n\nhttps://yourfrontend.com/login?telegramId=${user.id}&username=${user.username}`);
});

bot.launch();

// Start the server
app.listen(5000, () => console.log("Server running on port 5000"));
