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

  "higher-lower": {
    slug: "higher-lower",
    title: "Higher or Lower",
    accentColor: "#4ECDC4",
    metaTitle: "Higher or Lower Football - Compare Player Stats | Football IQ",
    metaDescription:
      "Higher or lower? Compare real player transfer fees, goals, caps and ratings in this addictive daily football guessing game. Free in the Football IQ app.",
    heroDescription:
      "One stat at a time. Higher or lower than the last one? Build a streak by guessing correctly across transfer fees, goals scored, international caps, and Wikipedia views.",
    rules: [
      "A starting player and stat is shown — for example, Erling Haaland's 2024-25 goal tally.",
      "A second player appears with the same stat hidden. Guess Higher or Lower.",
      "Get it right and the second player becomes the new benchmark, with another mystery player to compare.",
      "Each correct guess builds your streak. One wrong answer ends the run.",
      "Mix up the categories: transfer fees, league goals, international caps, market value, club appearances.",
    ],
    whyPlayersLoveIt: [
      "Pure streak game — addictive risk/reward at every step.",
      "Forces you to remember relative stats, not absolute ones, which separates real fans from the rest.",
      "Different category each session keeps it endlessly replayable.",
    ],
    faqs: [
      {
        question: "How does Higher or Lower football work?",
        answer:
          "You compare two footballers across the same statistic — transfer fee, goals, caps or rating — and guess whether the second value is higher or lower. Each correct guess advances you to the next comparison and lengthens your streak.",
      },
      {
        question: "What categories does Higher or Lower cover?",
        answer:
          "The Football IQ Higher or Lower mode covers transfer fees, career goals, international caps, market values, league appearances and Wikipedia popularity — chosen to test breadth, not just headline players.",
      },
      {
        question: "Where can I play Higher or Lower for football?",
        answer:
          "Higher or Lower is one of the 11 game modes available exclusively in the Football IQ mobile app. Download free on the App Store and start a streak today.",
      },
      {
        question: "Is Higher or Lower based on real player data?",
        answer:
          "Yes — every comparison uses real player data sourced from public databases. Stats are refreshed regularly so the values reflect current career numbers.",
      },
    ],
    keywords: [
      "higher or lower football",
      "football higher lower game",
      "football stats game",
      "compare footballers game",
      "football transfer fee game",
      "footballer guessing streak game",
    ],
  },

  "starting-xi": {
    slug: "starting-xi",
    title: "Starting XI",
    accentColor: "#2EFC5D",
    metaTitle: "Starting XI Quiz - Name the Missing Players | Football IQ",
    metaDescription:
      "Can you name the missing footballers in iconic starting XIs? Test your lineup memory with the daily Starting XI quiz in the Football IQ app.",
    heroDescription:
      "An iconic starting eleven is laid out on the formation board. Some shirts are blank. Can you fill in the missing players from memory?",
    rules: [
      "A famous starting XI is displayed on the pitch — could be a club's title-winning side, a World Cup final lineup, or a manager's iconic team sheet.",
      "Some positions are revealed; others are hidden behind blank shirts.",
      "Type the missing player names — partial matches are accepted with smart auto-complete.",
      "The fewer hints you reveal, the higher your score.",
      "Complete the full XI to clear the puzzle.",
    ],
    whyPlayersLoveIt: [
      "Tests your memory of full lineups, not just the famous names.",
      "Covers iconic squads from every era — invincibles, treble winners, World Cup champions.",
      "The 'forgotten' XI players are the satisfying ones to remember.",
    ],
    faqs: [
      {
        question: "What is Starting XI in Football IQ?",
        answer:
          "Starting XI is a daily lineup quiz where you fill in the missing players from an iconic football starting eleven. From the Arsenal Invincibles to Brazil 1970, every famous lineup is fair game.",
      },
      {
        question: "Which lineups appear in Starting XI?",
        answer:
          "Lineups span club and international football: Champions League winners, World Cup finalists, league title-winning teams, manager debut XIs, and historic cup final teams from across the past 50 years.",
      },
      {
        question: "How do I play Starting XI?",
        answer:
          "Starting XI is part of the Football IQ mobile app, available free on the App Store. The web version of Football IQ has 5 daily puzzles; Starting XI is one of 6 additional modes you unlock by downloading the app.",
      },
      {
        question: "Are partial player names accepted?",
        answer:
          "Yes — Football IQ uses smart auto-complete, so you only need to type enough characters to disambiguate. Common nicknames and short surnames are matched too.",
      },
    ],
    keywords: [
      "starting xi quiz",
      "football lineup quiz",
      "name the starting eleven",
      "football team quiz",
      "iconic football lineups",
      "guess the lineup game",
    ],
  },

  "who-am-i": {
    slug: "who-am-i",
    title: "Who Am I?",
    accentColor: "#9B59B6",
    metaTitle: "Who Am I? Football Player Quiz - 5 Clue Reveal | Football IQ",
    metaDescription:
      "Five progressive clues. One mystery footballer. Can you guess them before the final reveal? Play Who Am I? free in the Football IQ app.",
    heroDescription:
      "Five clues, getting easier with each one. Identify the mystery footballer as quickly as you can — the earlier you guess, the higher your score.",
    rules: [
      "Five clues are revealed one at a time. Clue 1 is the cryptic — the kind only obsessives will spot. Clue 5 is a giveaway.",
      "Guess at any point. Skip a clue if you want to wait for more info.",
      "Each wrong guess reveals the next clue automatically.",
      "Score is highest when you guess on clue 1 or 2 and falls with each clue used.",
      "A new mystery player drops every day.",
    ],
    whyPlayersLoveIt: [
      "Progressive reveal mechanic creates real tension — do you guess now or wait?",
      "Clues blend nationality, position, club history, trivia and stats — every type of fan has a chance.",
      "Bragging rights when you nail it on clue one.",
    ],
    faqs: [
      {
        question: "How does Who Am I? work in Football IQ?",
        answer:
          "Who Am I? reveals five progressive clues about a mystery footballer. The first clue is deliberately cryptic; the fifth is a near-giveaway. Guess as early as you can to score the highest.",
      },
      {
        question: "What kinds of clues are used?",
        answer:
          "Clues mix biographical detail (birthplace, position, age), career history (clubs, transfers), achievements (titles, awards) and trivia (shirt numbers, distinguishing features). Every clue is verifiable from public sources.",
      },
      {
        question: "Where can I play Who Am I?",
        answer:
          "Who Am I? is in the Football IQ mobile app, free on the App Store. It is one of six exclusive modes alongside the five daily puzzles available on football-iq.app.",
      },
      {
        question: "How often is the Who Am I? puzzle updated?",
        answer:
          "A new Who Am I? mystery footballer is featured every day. Streaks are tracked across days so you can compete with friends.",
      },
    ],
    keywords: [
      "who am i football quiz",
      "guess the footballer clues",
      "football mystery player game",
      "footballer guessing game",
      "5 clue football quiz",
      "daily mystery footballer",
    ],
  },

  "the-grid": {
    slug: "the-grid",
    title: "The Grid",
    accentColor: "#F59E0B",
    metaTitle: "The Grid - 3x3 Football Player Grid Quiz | Football IQ",
    metaDescription:
      "Fill a 3x3 grid where each cell needs a player matching two criteria — one from the row, one from the column. Daily football grid puzzle in the app.",
    heroDescription:
      "Three rows, three columns, nine cells. Each cell needs a player who satisfies both intersecting criteria. The rarer the player you find, the higher your rarity score.",
    rules: [
      "A 3x3 grid is shown. Each row and column has a criterion — a club, a competition, an award, a nationality.",
      "Each cell needs a player who satisfies both the row and column criteria.",
      "Type a player name into the cell — the system validates against real data.",
      "Rarity scoring: the more obscure your valid pick, the higher your score for that cell.",
      "Fill all 9 cells to complete the grid. Compare your rarity score to the global average.",
    ],
    whyPlayersLoveIt: [
      "Creates 'aha' moments when you remember an obscure transfer or short loan spell.",
      "Rarity scoring rewards depth of knowledge over recall of obvious names.",
      "Inspired by Immaculate Grid but tuned entirely to football.",
    ],
    faqs: [
      {
        question: "What is The Grid in Football IQ?",
        answer:
          "The Grid is a 3x3 football puzzle where each cell needs a player who satisfies the criteria of both their row and column — for example, played for Liverpool AND scored in a Champions League final.",
      },
      {
        question: "How does rarity scoring work?",
        answer:
          "Each cell awards points based on how often global players have picked the same name. Pick an obvious answer (Steven Gerrard for a Liverpool cell) and you score lower; pick a deep cut and you score much higher.",
      },
      {
        question: "How is The Grid different from Immaculate Grid?",
        answer:
          "The Grid uses the same intersecting-criteria mechanic but is built entirely around football — clubs, leagues, competitions, awards, nationalities. Every criterion is football-specific and verified against real player data.",
      },
      {
        question: "Where can I play The Grid?",
        answer:
          "The Grid is exclusive to the Football IQ mobile app, available free on the App Store. The web version of Football IQ has 5 daily puzzles; The Grid is one of 6 app-only modes.",
      },
    ],
    keywords: [
      "football grid game",
      "immaculate grid football",
      "football 3x3 grid quiz",
      "football intersection puzzle",
      "daily football grid",
      "footballer grid game",
    ],
  },

  "the-chain": {
    slug: "the-chain",
    title: "The Chain",
    accentColor: "#3B82F6",
    metaTitle: "The Chain - Link Footballers Through Shared Clubs | Football IQ",
    metaDescription:
      "Build a chain of footballers where each player shares a club with the previous. The deeper the chain, the higher your score. Daily Football IQ app puzzle.",
    heroDescription:
      "Start with one player. Add another who shared a club with them. Then another who shared a club with the second. How long can you make the chain before you get stuck?",
    rules: [
      "A starting footballer is shown.",
      "Add a player who shared at least one club with the starting player.",
      "Add another who shared a club with player 2 — and so on.",
      "Each link must be a real shared-club pairing, validated automatically against real career data.",
      "The longer your chain before a dead end, the higher your score. Today's chain is shared globally.",
    ],
    whyPlayersLoveIt: [
      "Combines memory, lateral thinking and football archaeology.",
      "Forces you to remember journeyman careers and squad rotations from every era.",
      "Sharing your chain on social drives debate — 'how did you get from Pirlo to Sissoko in 12 moves?'",
    ],
    faqs: [
      {
        question: "How does The Chain work in Football IQ?",
        answer:
          "You start with one footballer and build a chain by adding players who each shared at least one club with the previous link. The longer the chain you build before hitting a dead end, the higher your score.",
      },
      {
        question: "Are loan spells counted as shared clubs?",
        answer:
          "Yes — loan spells, youth-team appearances and short cup-tied stints all count as a shared club. Football IQ uses comprehensive career data so even brief overlaps register.",
      },
      {
        question: "Where can I play The Chain?",
        answer:
          "The Chain is part of the Football IQ mobile app, free on the App Store. It is one of 11 game modes, including six exclusive to the app.",
      },
      {
        question: "Is there a global leaderboard for The Chain?",
        answer:
          "Yes — the daily chain is shared globally, so you can compare your chain length against the average and the top scorer of the day.",
      },
    ],
    keywords: [
      "football chain game",
      "link footballers shared clubs",
      "football connection chain",
      "footballer chain game",
      "shared club football puzzle",
      "daily football chain",
    ],
  },

  threads: {
    slug: "threads",
    title: "Threads",
    accentColor: "#FF6B6B",
    metaTitle: "Threads - Identify the Football Club from Kit History | Football IQ",
    metaDescription:
      "Six kits, one mystery club. Use the home and away kit history to identify the football club in the daily Threads puzzle. Available in the Football IQ app.",
    heroDescription:
      "Six historical kits — home and away across different decades. Can you identify the club from their threads alone? No badges, no sponsors, just shirts.",
    rules: [
      "Six historic kits are shown. Badges and primary sponsor logos are removed.",
      "All six kits belong to the same club, drawn from different eras.",
      "Type your guess — the system accepts club names and common nicknames.",
      "Each wrong guess reveals one additional clue: a decade label, a competition the kit was worn in, or a key player who wore it.",
      "Solve in as few clues as possible to maximise your score.",
    ],
    whyPlayersLoveIt: [
      "Tests visual memory — kit-spotting is one of football's purest fan skills.",
      "Vintage kits unlock nostalgia for fans who watched in that era.",
      "Sharing the reveal sparks debate about which kit was the best (or worst) of the bunch.",
    ],
    faqs: [
      {
        question: "What is Threads in Football IQ?",
        answer:
          "Threads is a kit-identification puzzle. You're shown six historic kits — home and away across different decades — all from the same mystery club. Identify the club from the kits alone.",
      },
      {
        question: "Which kits are used in Threads?",
        answer:
          "Threads uses verified historic home and away kits, with badges and primary sponsors removed. Kits span from the 1980s to the present and cover clubs across the major European leagues plus international football.",
      },
      {
        question: "Where can I play Threads?",
        answer:
          "Threads is exclusive to the Football IQ mobile app, free to download on the App Store. The web version offers 5 daily puzzles; Threads is one of 6 app-only modes.",
      },
      {
        question: "Are training kits or third kits ever shown?",
        answer:
          "Sometimes — third kits and special-edition shirts (anniversary kits, throwback releases) feature in harder puzzles to test true kit-collector knowledge.",
      },
    ],
    keywords: [
      "football kit quiz",
      "guess the club from kit",
      "football shirt quiz",
      "football kit history game",
      "name the football club kit",
      "football threads game",
    ],
  },

  "goalscorer-recall": {
    slug: "goalscorer-recall",
    title: "Goalscorer Recall",
    accentColor: "#FF4D00",
    metaTitle: "Goalscorer Recall - Name Every Scorer from Classic Matches | Football IQ",
    metaDescription:
      "Can you name every scorer from a classic football match? Test your memory in Goalscorer Recall — one of 11 game modes in the Football IQ app.",
    heroDescription:
      "A classic football match is shown. Final score is given. Can you name every goalscorer — and the minute they scored — without looking it up?",
    rules: [
      "A famous match is selected — could be a Champions League final, a World Cup classic, a derby thriller.",
      "The teams and final score are revealed.",
      "Type each goalscorer's name. The system validates and locks each correct entry.",
      "Optional: name the minute too for bonus points.",
      "Solve in as few hints as possible. Hints reveal a player's club, position or initials.",
    ],
    whyPlayersLoveIt: [
      "The forgotten goalscorer in a famous match is always the satisfying one.",
      "Tests detail memory — most fans recall the result, few recall every scorer.",
      "Builds an oral history feel — every match becomes a story you re-tell.",
    ],
    faqs: [
      {
        question: "What is Goalscorer Recall?",
        answer:
          "Goalscorer Recall asks you to name every player who scored in a classic football match. The teams and final score are given; you fill in the names (and optionally the minutes) from memory.",
      },
      {
        question: "Which matches feature in Goalscorer Recall?",
        answer:
          "Matches range from World Cup finals and Champions League classics to memorable derbies and underdog upsets. Every match used has verified scorer data.",
      },
      {
        question: "Where can I play Goalscorer Recall?",
        answer:
          "Goalscorer Recall is one of six app-exclusive modes in the Football IQ mobile app, available free on the App Store.",
      },
      {
        question: "Do I need to name the minute as well?",
        answer:
          "Naming the minute is optional and earns bonus points. The base puzzle is solved by naming every scorer correctly.",
      },
    ],
    keywords: [
      "name every goalscorer",
      "football match goalscorer quiz",
      "classic football match quiz",
      "guess the scorers football",
      "football final goalscorer game",
      "match recall football game",
    ],
  },

  "top-tens": {
    slug: "top-tens",
    title: "Top Tens",
    accentColor: "#FACC15",
    metaTitle: "Top Tens - Guess the Top 10 in Each Football Category | Football IQ",
    metaDescription:
      "Can you name all 10 in football's biggest categories — top scorers, most caps, fastest goals? Daily Top Tens football puzzle in the Football IQ app.",
    heroDescription:
      "One category. Ten correct answers. From all-time Premier League top scorers to fastest hat-tricks ever. Can you name every player in the list?",
    rules: [
      "A category is shown — for example, 'Premier League's all-time top scorers'.",
      "There are 10 correct answers. Type as many as you can.",
      "The list reveals each correct guess in order, so you see your progress.",
      "There's no time limit, but every guess counts toward your accuracy.",
      "Hit all 10 to clear the puzzle — partial scores still earn ranking points.",
    ],
    whyPlayersLoveIt: [
      "The 'one I always forget' moment is what brings people back daily.",
      "Forces broad knowledge across categories most fans only half-remember.",
      "Quick-fire format — most rounds take under three minutes.",
    ],
    faqs: [
      {
        question: "How does Top Tens work?",
        answer:
          "Top Tens shows you a category — top scorers, most-capped players, fastest goals — and asks you to name all 10 correct entries. Each correct name slots into the list as you go.",
      },
      {
        question: "What categories appear in Top Tens?",
        answer:
          "Categories range from all-time records (most Ballons d'Or, most Champions League goals) to era-specific lists (top scorers of the 2010s) and quirky stats (most red cards, fastest hat-tricks).",
      },
      {
        question: "Where can I play Top Tens?",
        answer:
          "Top Tens is exclusive to the Football IQ mobile app, free on the App Store. The web version of Football IQ has 5 daily puzzles; Top Tens is one of 6 app-only modes.",
      },
      {
        question: "Is there a daily Top Tens leaderboard?",
        answer:
          "Yes — every day's Top Tens puzzle has a global leaderboard tracking how many of the 10 you got and how quickly you found them.",
      },
    ],
    keywords: [
      "top 10 football quiz",
      "name the top 10 footballers",
      "football top 10 guessing game",
      "all time top 10 football",
      "football records quiz",
      "daily top 10 football",
    ],
  },

  "whos-that": {
    slug: "whos-that",
    title: "Who's That?",
    accentColor: "#00E5FF",
    metaTitle: "Who's That? Wordle for Footballers | Football IQ",
    metaDescription:
      "Wordle for football fans. Six guesses. Yellow and green tiles tell you which attributes you got right. Daily Who's That? puzzle in the Football IQ app.",
    heroDescription:
      "Six guesses. Each guess reveals which attributes match the mystery player — nationality, position, age, club, league. Yellow and green tiles guide you to the answer.",
    rules: [
      "Type any footballer name as your first guess.",
      "Tiles light up green when an attribute matches exactly (nationality, position, age range, club, league).",
      "Tiles light up yellow when an attribute is close but not exact (same continent, similar position).",
      "Use the feedback to narrow down to the mystery player within six guesses.",
      "Share your colour grid like Wordle — without spoiling the answer.",
    ],
    whyPlayersLoveIt: [
      "The Wordle format every football fan has been waiting for.",
      "Daily ritual — same puzzle worldwide each day.",
      "Spoiler-free shareable grid drives social conversation.",
    ],
    faqs: [
      {
        question: "What is Who's That?",
        answer:
          "Who's That? is the Wordle for footballers. You have six guesses to identify a mystery player. Each guess reveals coloured tiles showing which attributes — nationality, position, age, club, league — match the mystery player.",
      },
      {
        question: "What do the colours mean?",
        answer:
          "Green means an exact match on that attribute. Yellow means a close match (e.g. same continent for nationality, similar position). Grey means no match. Use the colours to narrow down to the mystery player.",
      },
      {
        question: "Where can I play Who's That?",
        answer:
          "Who's That? is exclusive to the Football IQ mobile app, free on the App Store. The web version has 5 daily puzzles; Who's That? is one of 6 app-only modes.",
      },
      {
        question: "Is the Who's That? puzzle the same for everyone each day?",
        answer:
          "Yes — like Wordle, every player worldwide gets the same Who's That? puzzle each day. This makes the share grids meaningful when you compare with friends.",
      },
    ],
    keywords: [
      "wordle football",
      "football wordle game",
      "footballer wordle",
      "guess the footballer attributes",
      "daily football wordle",
      "football guessing game daily",
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
