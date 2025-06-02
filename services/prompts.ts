// Collection of journaling prompts
const journalPrompts = [
  "What made you smile today?",
  "Describe a challenge you're currently facing and three potential solutions.",
  "What are you grateful for today?",
  "If you could talk to your past self from one year ago, what advice would you give?",
  "What are your top three priorities right now, and why?",
  "Describe a person who has positively influenced your life recently.",
  "What are you looking forward to in the coming week?",
  "Reflect on a mistake you made recently. What did you learn?",
  "What boundaries do you need to set or maintain in your life right now?",
  "Describe your ideal day. What elements from this vision can you incorporate into your life now?",
  "What self-care activities have you been neglecting lately?",
  "Describe a recent moment when you felt completely at peace.",
  "What are three things you can do to be kinder to yourself?",
  "What would you do if you weren't afraid?",
  "Write about a book, movie, or conversation that changed your perspective recently.",
  "What habits would you like to develop, and which ones would you like to break?",
  "Describe something beautiful you noticed today that others might have missed.",
  "What does success mean to you, beyond external validation?",
  "How have your priorities changed over the past few years?",
  "What's something you're proud of that you haven't given yourself enough credit for?"
];

// Simulated delay to mimic network request
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get a random journaling prompt
 */
export const getRandomPrompt = async (): Promise<string> => {
  // Simulate API call
  await delay(400);
  
  const randomIndex = Math.floor(Math.random() * journalPrompts.length);
  return journalPrompts[randomIndex];
};

/**
 * Get all available prompts
 */
export const getAllPrompts = async (): Promise<string[]> => {
  // Simulate API call
  await delay(600);
  
  return journalPrompts;
};