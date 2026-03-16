export interface GameModeSEO {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  heroDescription: string;
  rules: string[];
  whyPlayersLoveIt: string[];
  faqs: { question: string; answer: string }[];
  keywords: string[];
  accentColor: string;
}

export const GAME_MODE_SEO: Record<string, GameModeSEO> = {
  "career-path": {
    slug: "career-path",
    title: "Career Path",
    accentColor: "#2EFC5D",
    metaTitle: "Career Path Quiz - Guess the Footballer | Football IQ",
    metaDescription:
      "Can you name the footballer from their career history? Play the daily Career Path quiz free in your browser. A new puzzle every day — no download needed.",
    heroDescription:
      "A mystery footballer's career is laid out before you — clubs, years, appearances. Can you name the player before all clues are revealed?",
    rules: [
      "A footballer's career history is shown with the player's name hidden.",
      "Each step reveals a club and the years the player was there.",
      "Type your guess at any time using the search bar.",
      "Wrong guesses unlock the next career step as a hint.",
      "The fewer clues you need, the higher your score.",
    ],
    whyPlayersLoveIt: [
      "Tests deep knowledge of player careers and transfer histories across all eras.",
      "A new puzzle drops every day — build a streak and compete with friends.",
      "One-tap sharing means you can brag (or commiserate) instantly on social.",
    ],
    faqs: [
      {
        question: "How does the Career Path football quiz work?",
        answer:
          "You are shown a footballer's career history with the player's name hidden. Guess the player from the clubs and years shown. Each wrong guess reveals the next career step as a hint. The fewer clues you use, the higher your score.",
      },
      {
        question: "Is Career Path free to play?",
        answer:
          "Yes! Career Path is free to play every day in your browser at football-iq.app. No download required and no account needed.",
      },
      {
        question: "How often is there a new Career Path puzzle?",
        answer:
          "A new Career Path puzzle is published every day. Come back daily to test your football knowledge and maintain your streak.",
      },
      {
        question: "What kind of players appear in Career Path?",
        answer:
          "Career Path features players from all eras and leagues — legends from the 80s and 90s through to current Premier League stars. The difficulty varies day to day, from household names to cult heroes.",
      },
    ],
    keywords: [
      "career path quiz",
      "guess the footballer",
      "football career quiz",
      "player career history quiz",
      "daily football quiz",
      "footballer guessing game",
    ],
  },

  "transfer-guess": {
    slug: "transfer-guess",
    title: "Transfer Guess",
    accentColor: "#FACC15",
    metaTitle: "Transfer Guess - Name the Player from a Transfer | Football IQ",
    metaDescription:
      "Can you identify the footballer from just one transfer? Daily Transfer Guess puzzle free in your browser. Test your football transfer knowledge.",
    heroDescription:
      "One transfer. Two clubs. One mystery player. Use the hints to figure out who made the move — nationality, position, fee, and year are all clues.",
    rules: [
      "A single transfer is shown: from club, to club, and transfer fee.",
      "Three additional hints are available: the year, the player's position, and their nationality flag.",
      "Type your guess using the player search bar.",
      "Each wrong guess reveals the next available hint.",
      "Identify the player using as few hints as possible.",
    ],
    whyPlayersLoveIt: [
      "Recalls iconic and obscure transfers that only true football fans will remember.",
      "Hints build tension — you can guess early and look like a genius or wait for more clues.",
      "Daily puzzle format keeps the competition fresh every single day.",
    ],
    faqs: [
      {
        question: "How does Transfer Guess work?",
        answer:
          "A football transfer is shown — the selling club, the buying club, and the transfer fee. Your job is to name the player who made that move. Use the year, position, and nationality hints to narrow it down.",
      },
      {
        question: "Is Transfer Guess free?",
        answer:
          "Yes. Transfer Guess is free to play in your browser at football-iq.app/play/transfer-guess. No account or app download required.",
      },
      {
        question: "What transfers appear in Transfer Guess?",
        answer:
          "Transfer Guess features moves from all eras and leagues — big-money blockbusters, surprising free transfers, and cult moves from lower divisions. Every day brings a different transfer.",
      },
      {
        question: "Can I play old Transfer Guess puzzles?",
        answer:
          "Premium subscribers can access the full archive of past Transfer Guess puzzles. Free players get today's puzzle every day.",
      },
    ],
    keywords: [
      "transfer guess",
      "football transfer quiz",
      "guess the transfer",
      "name the player transfer",
      "daily football transfer game",
      "football trivia transfers",
    ],
  },

  connections: {
    slug: "connections",
    title: "Connections",
    accentColor: "#3B82F6",
    metaTitle: "Football Connections - Group Players into Categories | Football IQ",
    metaDescription:
      "Group 16 footballers into 4 hidden categories. The daily football connections puzzle — like NYT Connections but for football fans. Free to play.",
    heroDescription:
      "Sixteen footballers. Four hidden groups. Can you work out what connects them before you run out of lives? Inspired by NYT Connections, built for football obsessives.",
    rules: [
      "A grid of 16 footballers is displayed. Find the 4 groups of 4 that share a hidden connection.",
      "Select 4 players and tap Submit to make a guess.",
      "Correct groups are revealed with a colour — yellow, green, blue, or purple.",
      "Categories are colour-coded from easy (yellow) to very hard (purple).",
      "You have 4 lives — each wrong guess costs one life.",
    ],
    whyPlayersLoveIt: [
      "Connections range from obvious to deviously tricky — satisfying at every level.",
      "Inspired by the viral NYT Connections format, rebuilt entirely for football fans.",
      "Share your colour grid and spark debates with friends about the hardest groups.",
    ],
    faqs: [
      {
        question: "How do you play Football Connections?",
        answer:
          "Select 4 footballers from a grid of 16 that share a hidden connection and submit your guess. Correct groups reveal with a colour. You have 4 mistakes before the game ends. Categories range from easy (yellow) to very hard (purple).",
      },
      {
        question: "How is Football Connections different from NYT Connections?",
        answer:
          "Football Connections uses 16 footballers instead of words. You group them into 4 hidden categories based on what they share — same club, same country, same award, or other football connections. It is entirely football-themed with handcrafted daily puzzles.",
      },
      {
        question: "Is there a free daily football connections puzzle?",
        answer:
          "Yes. Football IQ publishes a new Connections puzzle regularly at football-iq.app/play/connections. Free to play in your browser with no account needed.",
      },
      {
        question: "What kinds of connections are used?",
        answer:
          "Connections can be based on shared clubs, international teams, managers, awards, shirt numbers, transfer destinations, or any other football theme. Purple category connections are usually the most unexpected.",
      },
    ],
    keywords: [
      "football connections",
      "football connections game",
      "NYT connections football",
      "footballer connections puzzle",
      "daily football connections",
      "group footballers game",
    ],
  },

  "topical-quiz": {
    slug: "topical-quiz",
    title: "Topical Quiz",
    accentColor: "#FF6B6B",
    metaTitle: "Topical Football Quiz - 5 Questions on This Week's Headlines | Football IQ",
    metaDescription:
      "Test your knowledge of this week's football news with 5 topical questions. Free daily football quiz in your browser. New questions every week.",
    heroDescription:
      "Five questions. This week's football headlines. How closely have you been following the beautiful game? The Topical Quiz tests current events, not just history.",
    rules: [
      "Answer 5 multiple-choice questions about recent football news and events.",
      "Each question has 4 possible answers — select the one you think is correct.",
      "There is no time limit — take your time on each question.",
      "Questions are refreshed regularly to reflect the latest matches and news.",
      "Your score out of 5 is revealed at the end with detailed explanations.",
    ],
    whyPlayersLoveIt: [
      "Keeps you honest about how well you actually follow the football week.",
      "Questions cover results, transfers, stats, and talking points from across the game.",
      "Perfect for settling pub arguments about what actually happened this week.",
    ],
    faqs: [
      {
        question: "What is the Topical Football Quiz?",
        answer:
          "The Topical Quiz is a 5-question multiple-choice quiz about recent football events. Questions cover match results, transfers, manager news, stats, and other talking points from the current football week.",
      },
      {
        question: "How often are Topical Quiz questions updated?",
        answer:
          "Topical Quiz questions are updated regularly to reflect the latest football news. New questions are published each week so the content stays current.",
      },
      {
        question: "Is the Topical Quiz free to play?",
        answer:
          "Yes. The Topical Quiz is free to play in your browser at football-iq.app/play/topical-quiz. No download or account required.",
      },
      {
        question: "What leagues and competitions does the Topical Quiz cover?",
        answer:
          "The Topical Quiz covers all major competitions including the Premier League, Champions League, La Liga, Serie A, international football, and transfer news from around the world.",
      },
    ],
    keywords: [
      "topical football quiz",
      "football quiz this week",
      "current football questions",
      "football news quiz",
      "weekly football quiz",
      "football trivia current events",
    ],
  },

  timeline: {
    slug: "timeline",
    title: "Timeline",
    accentColor: "#F59E0B",
    metaTitle: "Football Timeline - Sort Events in Chronological Order | Football IQ",
    metaDescription:
      "Can you sort 6 football events into the correct chronological order? Daily Timeline puzzle free in your browser. A unique football history game.",
    heroDescription:
      "Six moments from football history. One correct order. Whether it is a player's career milestones or a club's trophies — can you sort them from first to last?",
    rules: [
      "Six football events are shown in a scrambled order.",
      "Drag and drop the events to arrange them in chronological order (earliest first).",
      "Submit your ordering when you are happy with the sequence.",
      "Each event correctly placed contributes to your score.",
      "The fewer attempts you need, the better your result.",
    ],
    whyPlayersLoveIt: [
      "Tests your sense of football history, not just individual facts.",
      "Covering players, clubs, tournaments, and moments across decades of the game.",
      "Deceptively tricky — events from the same era are particularly challenging to order.",
    ],
    faqs: [
      {
        question: "How does the Football Timeline game work?",
        answer:
          "You are given 6 football events in a scrambled order. Drag and drop them to arrange them chronologically — earliest at the top. The events might be moments from a player's career, a club's history, or major tournament milestones.",
      },
      {
        question: "Is Football Timeline free to play?",
        answer:
          "Yes. The Timeline puzzle is free to play every day in your browser at football-iq.app/play/timeline. No account or app download needed.",
      },
      {
        question: "What subjects does the Timeline cover?",
        answer:
          "Timeline puzzles cover a wide range of subjects: a player's career milestones, a club's trophy history, World Cup winners in order, transfer windows, and more. Each daily puzzle has a different theme.",
      },
      {
        question: "How often does a new Timeline puzzle come out?",
        answer:
          "A new Timeline puzzle is published every day. Come back each day to test your knowledge of football history.",
      },
    ],
    keywords: [
      "football timeline game",
      "football history quiz",
      "sort football events",
      "chronological football quiz",
      "football events order",
      "football history game",
    ],
  },
};
