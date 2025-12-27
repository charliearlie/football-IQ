-- Football IQ Development Seed Data
-- Seeds 35 puzzles (5 modes x 7 days) and 10 match_data rows
-- Date range: CURRENT_DATE - 3 days to CURRENT_DATE + 3 days
-- Execute via Supabase MCP: apply_migration or execute_sql

-- ============================================
-- MATCH DATA (10 rows for Goalscorer Recall)
-- ============================================
INSERT INTO match_data (external_id, home_team, away_team, home_score, away_score, competition, match_date, goalscorers, processed) VALUES
  ('match-001', 'Arsenal', 'Chelsea', 3, 1, 'Premier League', '2024-04-23',
   '[{"scorer":"Saka","minute":15,"team":"home"},{"scorer":"Havertz","minute":34,"team":"home"},{"scorer":"Martinelli","minute":67,"team":"home"},{"scorer":"Palmer","minute":78,"team":"away"}]'::jsonb, true),
  ('match-002', 'Manchester City', 'Liverpool', 2, 2, 'Premier League', '2024-03-10',
   '[{"scorer":"Haaland","minute":23,"team":"home"},{"scorer":"Salah","minute":45,"team":"away"},{"scorer":"De Bruyne","minute":56,"team":"home"},{"scorer":"Nunez","minute":89,"team":"away"}]'::jsonb, true),
  ('match-003', 'Real Madrid', 'Barcelona', 3, 2, 'La Liga', '2024-04-21',
   '[{"scorer":"Vinicius Jr","minute":12,"team":"home"},{"scorer":"Bellingham","minute":33,"team":"home"},{"scorer":"Yamal","minute":54,"team":"away"},{"scorer":"Lewandowski","minute":67,"team":"away"},{"scorer":"Rodrygo","minute":88,"team":"home"}]'::jsonb, true),
  ('match-004', 'Bayern Munich', 'Borussia Dortmund', 4, 0, 'Bundesliga', '2024-03-30',
   '[{"scorer":"Kane","minute":18,"team":"home"},{"scorer":"Kane","minute":45,"team":"home"},{"scorer":"Musiala","minute":62,"team":"home"},{"scorer":"Sane","minute":79,"team":"home"}]'::jsonb, true),
  ('match-005', 'PSG', 'Marseille', 2, 1, 'Ligue 1', '2024-03-17',
   '[{"scorer":"Mbappe","minute":25,"team":"home"},{"scorer":"Aubameyang","minute":50,"team":"away"},{"scorer":"Dembele","minute":73,"team":"home"}]'::jsonb, true),
  ('match-006', 'Juventus', 'AC Milan', 1, 0, 'Serie A', '2024-04-02',
   '[{"scorer":"Vlahovic","minute":82,"team":"home"}]'::jsonb, true),
  ('match-007', 'Atletico Madrid', 'Real Sociedad', 2, 1, 'La Liga', '2024-03-24',
   '[{"scorer":"Griezmann","minute":38,"team":"home"},{"scorer":"Oyarzabal","minute":55,"team":"away"},{"scorer":"Morata","minute":71,"team":"home"}]'::jsonb, true),
  ('match-008', 'Tottenham', 'Manchester United', 3, 2, 'Premier League', '2024-04-14',
   '[{"scorer":"Son","minute":11,"team":"home"},{"scorer":"Hojlund","minute":29,"team":"away"},{"scorer":"Maddison","minute":44,"team":"home"},{"scorer":"Rashford","minute":68,"team":"away"},{"scorer":"Johnson","minute":90,"team":"home"}]'::jsonb, true),
  ('match-009', 'Inter Milan', 'Napoli', 1, 1, 'Serie A', '2024-03-17',
   '[{"scorer":"Lautaro Martinez","minute":36,"team":"home"},{"scorer":"Osimhen","minute":72,"team":"away"}]'::jsonb, true),
  ('match-010', 'Newcastle', 'Aston Villa', 3, 0, 'Premier League', '2024-04-07',
   '[{"scorer":"Isak","minute":22,"team":"home"},{"scorer":"Gordon","minute":51,"team":"home"},{"scorer":"Guimaraes","minute":77,"team":"home"}]'::jsonb, true);

-- ============================================
-- DAILY PUZZLES - DAY -3 (3 days ago)
-- ============================================
INSERT INTO daily_puzzles (game_mode, puzzle_date, content, difficulty, status, source) VALUES
  ('career_path', CURRENT_DATE - INTERVAL '3 days',
   '{"answer":"Erling Haaland","career_steps":[{"type":"club","text":"Bryne FK","year":"2016"},{"type":"club","text":"Molde FK","year":"2017-2019"},{"type":"club","text":"RB Salzburg","year":"2019-2020"},{"type":"club","text":"Borussia Dortmund","year":"2020-2022"},{"type":"club","text":"Manchester City","year":"2022-"}]}'::jsonb,
   'medium', 'live', 'manual'),
  ('guess_the_transfer', CURRENT_DATE - INTERVAL '3 days',
   '{"answer":"Jude Bellingham","from_club":"Borussia Dortmund","to_club":"Real Madrid","year":2023,"fee":"103M","hints":["English midfielder","Wore number 22","Champions League winner 2024"]}'::jsonb,
   'easy', 'live', 'manual'),
  ('guess_the_goalscorers', CURRENT_DATE - INTERVAL '3 days',
   '{"home_team":"Arsenal","away_team":"Chelsea","home_score":3,"away_score":1,"competition":"Premier League","match_date":"23 Apr 2024","goals":[{"scorer":"Saka","minute":15,"team":"home"},{"scorer":"Havertz","minute":34,"team":"home"},{"scorer":"Martinelli","minute":67,"team":"home"},{"scorer":"Palmer","minute":78,"team":"away"}]}'::jsonb,
   'hard', 'live', 'manual'),
  ('tic_tac_toe', CURRENT_DATE - INTERVAL '3 days',
   '{"rows":["Real Madrid","Barcelona","Bayern Munich"],"columns":["Brazil","France","Germany"],"valid_answers":{"0":["Vinicius Jr","Rodrygo","Militao"],"1":["Mbappe","Tchouameni","Camavinga"],"2":["Kroos","Rudiger"],"3":["Raphinha","Dani Alves"],"4":["Dembele","Kounde"],"5":["Ter Stegen"],"6":["Coutinho"],"7":["Coman","Hernandez","Upamecano"],"8":["Muller","Kimmich","Sane","Musiala"]}}'::jsonb,
   'medium', 'live', 'manual'),
  ('topical_quiz', CURRENT_DATE - INTERVAL '3 days',
   '{"topic":"Champions League 2024","questions":[]}'::jsonb,
   'medium', 'live', 'manual');

-- ============================================
-- DAILY PUZZLES - DAY -2 (2 days ago)
-- ============================================
INSERT INTO daily_puzzles (game_mode, puzzle_date, content, difficulty, status, source) VALUES
  ('career_path', CURRENT_DATE - INTERVAL '2 days',
   '{"answer":"Kylian Mbappe","career_steps":[{"type":"club","text":"AS Monaco","year":"2015-2017"},{"type":"loan","text":"Paris Saint-Germain","year":"2017-2018"},{"type":"club","text":"Paris Saint-Germain","year":"2018-2024"},{"type":"club","text":"Real Madrid","year":"2024-"}]}'::jsonb,
   'easy', 'live', 'manual'),
  ('guess_the_transfer', CURRENT_DATE - INTERVAL '2 days',
   '{"answer":"Declan Rice","from_club":"West Ham","to_club":"Arsenal","year":2023,"fee":"105M","hints":["English midfielder","Wore number 41","Former West Ham captain"]}'::jsonb,
   'medium', 'live', 'manual'),
  ('guess_the_goalscorers', CURRENT_DATE - INTERVAL '2 days',
   '{"home_team":"Manchester City","away_team":"Liverpool","home_score":2,"away_score":2,"competition":"Premier League","match_date":"10 Mar 2024","goals":[{"scorer":"Haaland","minute":23,"team":"home"},{"scorer":"Salah","minute":45,"team":"away"},{"scorer":"De Bruyne","minute":56,"team":"home"},{"scorer":"Nunez","minute":89,"team":"away"}]}'::jsonb,
   'medium', 'live', 'manual'),
  ('tic_tac_toe', CURRENT_DATE - INTERVAL '2 days',
   '{"rows":["Manchester United","Chelsea","Liverpool"],"columns":["Portugal","Spain","Netherlands"],"valid_answers":{"0":["Bruno Fernandes","Ronaldo","Nani"],"1":["Mata","De Gea","Herrera"],"2":["Van de Beek","Van Nistelrooy","Blind"],"3":["Joao Felix","Enzo Fernandez"],"4":["Morata","Azpilicueta","Pedro"],"5":["Wijnaldum","Van Dijk","Gravenberch"],"6":["Diogo Jota"],"7":["Torres","Luis Garcia"],"8":["Kuyt","Babel"]}}'::jsonb,
   'hard', 'live', 'manual'),
  ('topical_quiz', CURRENT_DATE - INTERVAL '2 days',
   '{"topic":"Euro 2024 Qualifiers","questions":[]}'::jsonb,
   'medium', 'live', 'manual');

-- ============================================
-- DAILY PUZZLES - DAY -1 (yesterday)
-- ============================================
INSERT INTO daily_puzzles (game_mode, puzzle_date, content, difficulty, status, source) VALUES
  ('career_path', CURRENT_DATE - INTERVAL '1 day',
   '{"answer":"Mohamed Salah","career_steps":[{"type":"club","text":"El Mokawloon","year":"2010-2012"},{"type":"club","text":"Basel","year":"2012-2014"},{"type":"club","text":"Chelsea","year":"2014-2015"},{"type":"loan","text":"Fiorentina","year":"2015"},{"type":"loan","text":"Roma","year":"2015-2016"},{"type":"club","text":"Roma","year":"2016-2017"},{"type":"club","text":"Liverpool","year":"2017-"}]}'::jsonb,
   'medium', 'live', 'manual'),
  ('guess_the_transfer', CURRENT_DATE - INTERVAL '1 day',
   '{"answer":"Enzo Fernandez","from_club":"Benfica","to_club":"Chelsea","year":2023,"fee":"121M","hints":["Argentine midfielder","World Cup 2022 winner","Wore number 8"]}'::jsonb,
   'hard', 'live', 'manual'),
  ('guess_the_goalscorers', CURRENT_DATE - INTERVAL '1 day',
   '{"home_team":"Real Madrid","away_team":"Barcelona","home_score":3,"away_score":2,"competition":"La Liga","match_date":"21 Apr 2024","goals":[{"scorer":"Vinicius Jr","minute":12,"team":"home"},{"scorer":"Bellingham","minute":33,"team":"home"},{"scorer":"Yamal","minute":54,"team":"away"},{"scorer":"Lewandowski","minute":67,"team":"away"},{"scorer":"Rodrygo","minute":88,"team":"home"}]}'::jsonb,
   'hard', 'live', 'manual'),
  ('tic_tac_toe', CURRENT_DATE - INTERVAL '1 day',
   '{"rows":["Arsenal","Tottenham","West Ham"],"columns":["England","France","Argentina"],"valid_answers":{"0":["Saka","Rice","Ramsdale"],"1":["Saliba","Koscielny"],"2":["Di Maria"],"3":["Kane","Maddison"],"4":["Lloris","Sissoko"],"5":["Lamela","Lo Celso"],"6":["Antonio","Noble"],"7":["Payet","Diarra"],"8":["Mascherano","Tevez","Higuain","Di Maria"]}}'::jsonb,
   'easy', 'live', 'manual'),
  ('topical_quiz', CURRENT_DATE - INTERVAL '1 day',
   '{"topic":"Premier League Title Race","questions":[]}'::jsonb,
   'medium', 'live', 'manual');

-- ============================================
-- DAILY PUZZLES - DAY 0 (today)
-- ============================================
INSERT INTO daily_puzzles (game_mode, puzzle_date, content, difficulty, status, source) VALUES
  ('career_path', CURRENT_DATE,
   '{"answer":"Cristiano Ronaldo","career_steps":[{"type":"club","text":"Sporting CP","year":"2002-2003"},{"type":"club","text":"Manchester United","year":"2003-2009"},{"type":"club","text":"Real Madrid","year":"2009-2018"},{"type":"club","text":"Juventus","year":"2018-2021"},{"type":"club","text":"Manchester United","year":"2021-2022"},{"type":"club","text":"Al-Nassr","year":"2023-"}]}'::jsonb,
   'easy', 'live', 'manual'),
  ('guess_the_transfer', CURRENT_DATE,
   '{"answer":"Neymar","from_club":"Barcelona","to_club":"PSG","year":2017,"fee":"222M","hints":["Brazilian forward","World record fee","Wore number 10"]}'::jsonb,
   'easy', 'live', 'manual'),
  ('guess_the_goalscorers', CURRENT_DATE,
   '{"home_team":"Bayern Munich","away_team":"Borussia Dortmund","home_score":4,"away_score":0,"competition":"Bundesliga","match_date":"30 Mar 2024","goals":[{"scorer":"Kane","minute":18,"team":"home"},{"scorer":"Kane","minute":45,"team":"home"},{"scorer":"Musiala","minute":62,"team":"home"},{"scorer":"Sane","minute":79,"team":"home"}]}'::jsonb,
   'medium', 'live', 'manual'),
  ('tic_tac_toe', CURRENT_DATE,
   '{"rows":["Manchester City","PSG","Juventus"],"columns":["Belgium","Argentina","Portugal"],"valid_answers":{"0":["De Bruyne","Kompany"],"1":["Aguero","Otamendi","Alvarez"],"2":["Bernardo Silva","Joao Cancelo","Dias"],"3":["Meunier","Witsel"],"4":["Messi","Di Maria","Paredes","Icardi"],"5":["Nuno Mendes","Danilo"],"6":["Lukaku"],"7":["Dybala","Higuain"],"8":["Ronaldo","Joao Cancelo"]}}'::jsonb,
   'medium', 'live', 'manual'),
  ('topical_quiz', CURRENT_DATE,
   '{"topic":"Ballon d Or Winners","questions":[]}'::jsonb,
   'medium', 'live', 'manual');

-- ============================================
-- DAILY PUZZLES - DAY +1 (tomorrow)
-- ============================================
INSERT INTO daily_puzzles (game_mode, puzzle_date, content, difficulty, status, source) VALUES
  ('career_path', CURRENT_DATE + INTERVAL '1 day',
   '{"answer":"Lionel Messi","career_steps":[{"type":"club","text":"Barcelona","year":"2004-2021"},{"type":"club","text":"Paris Saint-Germain","year":"2021-2023"},{"type":"club","text":"Inter Miami","year":"2023-"}]}'::jsonb,
   'easy', 'live', 'manual'),
  ('guess_the_transfer', CURRENT_DATE + INTERVAL '1 day',
   '{"answer":"Harry Kane","from_club":"Tottenham","to_club":"Bayern Munich","year":2023,"fee":"100M","hints":["English striker","All-time PL top scorer","Never won a trophy at Spurs"]}'::jsonb,
   'medium', 'live', 'manual'),
  ('guess_the_goalscorers', CURRENT_DATE + INTERVAL '1 day',
   '{"home_team":"PSG","away_team":"Marseille","home_score":2,"away_score":1,"competition":"Ligue 1","match_date":"17 Mar 2024","goals":[{"scorer":"Mbappe","minute":25,"team":"home"},{"scorer":"Aubameyang","minute":50,"team":"away"},{"scorer":"Dembele","minute":73,"team":"home"}]}'::jsonb,
   'easy', 'live', 'manual'),
  ('tic_tac_toe', CURRENT_DATE + INTERVAL '1 day',
   '{"rows":["Inter Milan","AC Milan","Napoli"],"columns":["France","Argentina","Netherlands"],"valid_answers":{"0":["Thuram","Pavard"],"1":["Lautaro Martinez","Correa"],"2":["Dumfries","De Vrij"],"3":["Maignan","Theo Hernandez"],"4":["Higuain"],"5":["Reijnders"],"6":["Osimhen"],"7":["Di Lorenzo"],"8":["Kvaratskhelia"]}}'::jsonb,
   'medium', 'live', 'manual'),
  ('topical_quiz', CURRENT_DATE + INTERVAL '1 day',
   '{"topic":"World Cup History","questions":[]}'::jsonb,
   'medium', 'live', 'manual');

-- ============================================
-- DAILY PUZZLES - DAY +2 (2 days from now)
-- ============================================
INSERT INTO daily_puzzles (game_mode, puzzle_date, content, difficulty, status, source) VALUES
  ('career_path', CURRENT_DATE + INTERVAL '2 days',
   '{"answer":"Robert Lewandowski","career_steps":[{"type":"club","text":"Znicz Pruszkow","year":"2006-2008"},{"type":"club","text":"Lech Poznan","year":"2008-2010"},{"type":"club","text":"Borussia Dortmund","year":"2010-2014"},{"type":"club","text":"Bayern Munich","year":"2014-2022"},{"type":"club","text":"Barcelona","year":"2022-"}]}'::jsonb,
   'medium', 'live', 'manual'),
  ('guess_the_transfer', CURRENT_DATE + INTERVAL '2 days',
   '{"answer":"Joao Felix","from_club":"Benfica","to_club":"Atletico Madrid","year":2019,"fee":"126M","hints":["Portuguese forward","Golden Boy winner","Wore number 7"]}'::jsonb,
   'hard', 'live', 'manual'),
  ('guess_the_goalscorers', CURRENT_DATE + INTERVAL '2 days',
   '{"home_team":"Tottenham","away_team":"Manchester United","home_score":3,"away_score":2,"competition":"Premier League","match_date":"14 Apr 2024","goals":[{"scorer":"Son","minute":11,"team":"home"},{"scorer":"Hojlund","minute":29,"team":"away"},{"scorer":"Maddison","minute":44,"team":"home"},{"scorer":"Rashford","minute":68,"team":"away"},{"scorer":"Johnson","minute":90,"team":"home"}]}'::jsonb,
   'hard', 'live', 'manual'),
  ('tic_tac_toe', CURRENT_DATE + INTERVAL '2 days',
   '{"rows":["Atletico Madrid","Sevilla","Valencia"],"columns":["Spain","France","Portugal"],"valid_answers":{"0":["Morata","Koke","Saul"],"1":["Griezmann","Lemar"],"2":["Joao Felix"],"3":["Navas","Ramos","Rakitic"],"4":["Ocampos"],"5":["Andre Silva"],"6":["Soler","Gaya"],"7":["Kondogbia"],"8":["Guedes","Goncalo Guedes"]}}'::jsonb,
   'easy', 'live', 'manual'),
  ('topical_quiz', CURRENT_DATE + INTERVAL '2 days',
   '{"topic":"Transfer Records","questions":[]}'::jsonb,
   'medium', 'live', 'manual');

-- ============================================
-- DAILY PUZZLES - DAY +3 (3 days from now)
-- ============================================
INSERT INTO daily_puzzles (game_mode, puzzle_date, content, difficulty, status, source) VALUES
  ('career_path', CURRENT_DATE + INTERVAL '3 days',
   '{"answer":"Kevin De Bruyne","career_steps":[{"type":"club","text":"Genk","year":"2008-2012"},{"type":"club","text":"Chelsea","year":"2012-2014"},{"type":"loan","text":"Werder Bremen","year":"2012-2013"},{"type":"club","text":"VfL Wolfsburg","year":"2014-2015"},{"type":"club","text":"Manchester City","year":"2015-"}]}'::jsonb,
   'medium', 'live', 'manual'),
  ('guess_the_transfer', CURRENT_DATE + INTERVAL '3 days',
   '{"answer":"Romelu Lukaku","from_club":"Everton","to_club":"Manchester United","year":2017,"fee":"84M","hints":["Belgian striker","Chelsea flop","Now at Roma"]}'::jsonb,
   'medium', 'live', 'manual'),
  ('guess_the_goalscorers', CURRENT_DATE + INTERVAL '3 days',
   '{"home_team":"Newcastle","away_team":"Aston Villa","home_score":3,"away_score":0,"competition":"Premier League","match_date":"7 Apr 2024","goals":[{"scorer":"Isak","minute":22,"team":"home"},{"scorer":"Gordon","minute":51,"team":"home"},{"scorer":"Guimaraes","minute":77,"team":"home"}]}'::jsonb,
   'easy', 'live', 'manual'),
  ('tic_tac_toe', CURRENT_DATE + INTERVAL '3 days',
   '{"rows":["Leicester","Leeds","Southampton"],"columns":["England","France","Nigeria"],"valid_answers":{"0":["Vardy","Maddison","Chilwell"],"1":["Kante","Mahrez"],"2":["Iheanacho","Ndidi"],"3":["Phillips","Bamford"],"4":["Raphinha"],"5":["Forshaw"],"6":["Ward-Prowse","Walcott"],"7":["Mane"],"8":["Eze"]}}'::jsonb,
   'hard', 'live', 'manual'),
  ('topical_quiz', CURRENT_DATE + INTERVAL '3 days',
   '{"topic":"FA Cup Finals","questions":[]}'::jsonb,
   'medium', 'live', 'manual');
