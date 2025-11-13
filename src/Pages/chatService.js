export const fetchAIResponse = async (userMessage) => {
  const msg = userMessage.toLowerCase().trim();

  const responses = [
    // Greetings
    { keywords: ["hello", "hi", "hey"], reply: "Hey there! 👋 Welcome to SkillSwap! How can I help you today?" },
    { keywords: ["hey bot"], reply: "Hello! 😄 I'm your SkillBot, here to help you navigate SkillSwap!" },

    // Learning & Teaching
    { keywords: ["learn", "learning"], reply: "Want to learn something new? 😎 Go to the 'All' section and filter by 'Learn' to find skills!" },
    { keywords: ["teach", "teaching"], reply: "Ready to share your skills? 🙌 Check the 'All' section and filter by 'Teach' to get started." },

    // Profile & points
    { keywords: ["profile"], reply: "Your profile shows your skills, badges, and progress. 💪 Keep it updated to shine!" },
    { keywords: ["points", "score"], reply: "Earn points by learning, teaching, or completing activities. 🎯 More points = higher leaderboard rank!" },
    { keywords: ["badges", "achievement"], reply: "Earn badges 🏅 by completing learning goals or teaching sessions. Show them off in your profile!" },

    // Mentors & chat
    { keywords: ["mentor", "help"], reply: "Need a mentor? 🤓 Connect with them through the 'All' section or check their profile!" },
    { keywords: ["chat", "skillbot"], reply: "You can ask me anything about SkillSwap! 😄 From learning tips to rewards, I got you!" },
    { keywords: ["message"], reply: "Go to the chat section 💬 to message your mentor or peers directly!" },

    // Events, workshops
    { keywords: ["events", "workshops"], reply: "Exciting workshops coming soon! 📅 Check the homepage to join events." },
    { keywords: ["join"], reply: "Head to the Events page 📅 to join upcoming workshops and learning sessions!" },

    // Navigation & sections
    { keywords: ["all"], reply: "Use the 'All' section to filter by Learn or Teach 🎯 to find exactly what you need." },
    { keywords: ["skills", "projects"], reply: "You can view all your projects and skills in the 'My Skills' section. 🚀 Keep building!" },
    { keywords: ["notifications"], reply: "Check your notifications 🔔 to stay updated on new messages, projects, or events!" },

    // Feedback & help
    { keywords: ["faq"], reply: "Check the FAQ section 📚 on the homepage for quick answers to common questions." },
    { keywords: ["feedback"], reply: "Share your thoughts! 💌 Leave feedback for mentors or learners after sessions." },
    { keywords: ["contact"], reply: "Need help? 💬 Reach out through the Contact page or just ask me, SkillBot!" },

    // Account actions
    { keywords: ["signup", "register"], reply: "Ready to join? 📝 Head to Sign Up and start your SkillSwap journey!" },
    { keywords: ["login", "signin"], reply: "Already have an account? 🔑 Use the Login page to continue your adventure!" },

    // About & team
    { keywords: ["about", "team"], reply: "SkillSwap is where students teach & learn from each other! 🤝 Learn, teach, and grow together!" },

    // Default fallback
    { keywords: ["default"], reply: "Hmm 🤔 I didn't get that. Try asking differently or use keywords like 'Learn', 'Teach', or 'Projects'." }
  ];

  // Find matching rule
  for (let r of responses) {
    for (let k of r.keywords) {
      if (msg.includes(k)) return r.reply;
    }
  }

  return "Hmm 🤔 I didn't get that. Try using a keyword like 'Learn', 'Teach', or 'Projects'!";
};
