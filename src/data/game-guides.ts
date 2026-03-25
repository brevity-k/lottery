// Static "How to Play" guides for each lottery game.
// Content is factual, entertainment/informational only — no prediction language.
// Sources: official lottery websites, src/lib/lotteries/config.ts, docs/verified-facts.md.
export const GAME_GUIDES: Record<string, string> = {
  powerball: `
<h3>How to Play Powerball</h3>
<p>Powerball is a multi-state lottery game available in 45 states, Washington D.C., Puerto Rico, and the U.S. Virgin Islands. Each ticket costs <strong>$2</strong>.</p>
<h4>Picking Your Numbers</h4>
<p>Choose <strong>5 white ball numbers</strong> from 1 to 69 and <strong>1 red Powerball number</strong> from 1 to 26. You can pick your own numbers or use a Quick Pick, where the terminal selects numbers randomly. Approximately 70–80% of all Powerball tickets sold are Quick Pick selections, and a similar share of jackpot winners have used Quick Pick.</p>
<h4>Optional Add-Ons</h4>
<ul>
  <li><strong>Power Play (+$1):</strong> Multiplies non-jackpot prizes by 2x, 3x, 4x, 5x, or 10x. The 10x multiplier is available only when the jackpot is $150 million or less. The $1 million second-tier prize is always doubled to $2 million with Power Play.</li>
  <li><strong>Double Play (+$1):</strong> Available in select states — your numbers are entered into a separate drawing with a top prize of $10 million.</li>
</ul>
<h4>Draw Schedule</h4>
<p>Drawings are held <strong>Monday, Wednesday, and Saturday at 10:59 PM ET</strong>. Results are available on official lottery websites and on this site shortly after each drawing.</p>
<h4>Jackpot &amp; Prizes</h4>
<p>There are 9 prize tiers, from $4 up to the jackpot. Jackpots start at $20 million and grow with each rollover. Winners may choose a lump-sum cash payment (typically 50–60% of the advertised jackpot) or a 30-payment annuity. Both options are subject to federal and applicable state income taxes.</p>
<h4>Where to Buy</h4>
<p>Tickets are sold at authorized retailers in all participating states. Some states also offer online purchases through their official lottery websites or apps. Players must meet their state's minimum age requirement (18 in most states).</p>
<p><em>Powerball is for entertainment purposes only. Past results do not predict future outcomes. Please play responsibly.</em></p>
  `.trim(),

  'mega-millions': `
<h3>How to Play Mega Millions</h3>
<p>Mega Millions is available in 45 states, Washington D.C., and the U.S. Virgin Islands. Following a major overhaul in April 2025, each ticket now costs <strong>$5</strong> and includes an automatic prize multiplier at no extra charge.</p>
<h4>Picking Your Numbers</h4>
<p>Choose <strong>5 white ball numbers</strong> from 1 to 70 and <strong>1 gold Mega Ball number</strong> from 1 to 24. Quick Pick is available and is used by approximately 70–80% of all players. The jackpot odds are 1 in 290,472,336 — slightly better than before the April 2025 update, when the Mega Ball pool was reduced from 25 to 24 numbers.</p>
<h4>Automatic Multiplier (Since April 2025)</h4>
<p>Every $5 ticket includes an automatic <strong>2x, 3x, 4x, 5x, or 10x multiplier</strong> applied to all non-jackpot prizes. The old $1 Megaplier add-on has been retired. This means a $1,000 third-tier prize could be worth up to $10,000 with the 10x multiplier.</p>
<h4>Draw Schedule</h4>
<p>Drawings are held <strong>Tuesday and Friday at 11:00 PM ET</strong>. Results are published on official lottery websites and on this site shortly after each drawing.</p>
<h4>Jackpot &amp; Prizes</h4>
<p>There are 9 prize tiers, from $2 up to the jackpot. Since April 2025, jackpots start at $50 million (up from the previous $20 million). Winners choose between a lump-sum cash payment or a 30-payment annuity. Both are subject to federal and applicable state taxes.</p>
<h4>Where to Buy</h4>
<p>Tickets are sold at authorized retailers in all participating states. Online purchases are available in select states through official lottery websites. Players must be at least 18 years old in most states.</p>
<p><em>Mega Millions is for entertainment purposes only. Past results do not predict future outcomes. Please play responsibly.</em></p>
  `.trim(),

  cash4life: `
<h3>How to Play Cash4Life</h3>
<p><strong>Note: Cash4Life was retired on February 21, 2026.</strong> No new tickets are being sold. Historical results and statistics remain available for reference. Cash4Life has been replaced by <a href="/millionaire-for-life">Millionaire for Life</a>, which launched on February 22, 2026.</p>
<h4>How It Worked</h4>
<p>Cash4Life was a multi-state lottery game available in 10 states. Each ticket cost <strong>$2</strong>. Players chose <strong>5 numbers</strong> from 1 to 60 and <strong>1 Cash Ball number</strong> from 1 to 4. Drawings were held daily at <strong>9:00 PM ET</strong>.</p>
<h4>Top Prizes</h4>
<ul>
  <li><strong>First prize:</strong> $1,000 per day for life (jackpot odds: 1 in 21,846,048)</li>
  <li><strong>Second prize:</strong> $1,000 per week for life</li>
</ul>
<p>Unlike traditional jackpot games, Cash4Life's top prizes were structured as lifetime annuities rather than a single lump sum or multi-year annuity. Winners received guaranteed income for life with a minimum guaranteed payout period.</p>
<h4>Quick Pick</h4>
<p>Players could use Quick Pick for random number selection. Drawings were held every day of the week, giving players daily opportunities to win.</p>
<p><em>Cash4Life was for entertainment purposes only. Historical data on this site is provided for informational and statistical reference only.</em></p>
  `.trim(),

  'ny-lotto': `
<h3>How to Play NY Lotto</h3>
<p>NY Lotto is New York State's flagship lottery game, one of the longest-running lotteries in the US. Each ticket costs <strong>$1</strong> and includes two plays (sets of numbers).</p>
<h4>Picking Your Numbers</h4>
<p>Choose <strong>6 numbers</strong> from 1 to 59. A <strong>bonus number</strong> is also drawn from the same 1–59 pool; it applies to the second-tier prize for players who match 5 of 6 main numbers. You can select your own numbers or use Quick Pick for random selection.</p>
<h4>Draw Schedule</h4>
<p>Drawings are held <strong>Wednesday and Saturday at 8:15 PM ET</strong>. Results are posted on the NY Lottery website and on this site after each drawing.</p>
<h4>Jackpot &amp; Prizes</h4>
<p>There are 5 prize tiers. The jackpot starts at $2 million and grows with each rollover. Jackpot odds are 1 in 45,057,474. The second-tier prize (5 numbers + bonus) is a fixed $100,000. Lower-tier prizes include $1,000 for matching 5 numbers, $25 for matching 4, and a free play for matching 3.</p>
<p>Jackpot winners choose between a lump-sum cash payment (roughly 60% of the advertised amount) or a 26-payment annuity paid over 25 years. Winnings are subject to federal and New York State income taxes.</p>
<h4>Where to Buy</h4>
<p>Tickets are sold at authorized New York State Lottery retailers throughout NY. Online purchases are available through the official NY Lottery app and website. Players must be at least 18 years old.</p>
<p><em>NY Lotto is for entertainment purposes only. Past results do not predict future outcomes. Please play responsibly.</em></p>
  `.trim(),

  take5: `
<h3>How to Play Take 5</h3>
<p>Take 5 is a New York daily numbers game with two drawings every day. Each ticket costs <strong>$1</strong> and offers relatively accessible odds compared to multi-state jackpot games.</p>
<h4>Picking Your Numbers</h4>
<p>Choose <strong>5 numbers</strong> from 1 to 39. There is no bonus number in Take 5. You can select your own numbers or use Quick Pick. The jackpot odds are 1 in 575,757 — dramatically better than Powerball or Mega Millions, though the prizes are correspondingly smaller.</p>
<h4>Draw Schedule</h4>
<p>Take 5 has <strong>two drawings every day</strong>: a <strong>midday drawing at 2:30 PM ET</strong> and an <strong>evening drawing at 10:30 PM ET</strong>, seven days a week. Your ticket is valid for both draws on the date printed unless you specify a single draw.</p>
<h4>Prizes</h4>
<p>All Take 5 prizes are <strong>pari-mutuel</strong> — the prize amounts vary based on ticket sales and the number of winners in each drawing. Approximate typical prizes:</p>
<ul>
  <li><strong>Match 5 (Jackpot):</strong> Approximately $57,500 (varies)</li>
  <li><strong>Match 4:</strong> Approximately $500 (varies)</li>
  <li><strong>Match 3:</strong> Approximately $25 (varies)</li>
  <li><strong>Match 2:</strong> Free Play ticket</li>
</ul>
<p>Overall odds of winning any prize are approximately 1 in 8.</p>
<h4>Where to Buy</h4>
<p>Tickets are sold at authorized New York State Lottery retailers. Take 5 tickets are also available through the official NY Lottery app. Players must be at least 18 years old.</p>
<p><em>Take 5 is for entertainment purposes only. Pari-mutuel prize amounts vary and are not guaranteed. Past results do not predict future outcomes. Please play responsibly.</em></p>
  `.trim(),

  'millionaire-for-life': `
<h3>How to Play Millionaire for Life</h3>
<p>Millionaire for Life is New York's newest lottery game, launched on <strong>February 22, 2026</strong>, replacing Cash4Life. Each ticket costs <strong>$5</strong>.</p>
<h4>Picking Your Numbers</h4>
<p>Choose <strong>5 numbers</strong> from 1 to 58 and <strong>1 Millionaire Ball number</strong> from 1 to 5. You can select your own numbers or use Quick Pick for random selection. The jackpot odds are 1 in 22,910,580.</p>
<h4>Draw Schedule</h4>
<p>Drawings are held <strong>daily at 11:15 PM ET</strong>, seven days a week. Results are posted on the NY Lottery website and on this site after each drawing.</p>
<h4>Top Prizes</h4>
<ul>
  <li><strong>First prize (5 + Millionaire Ball):</strong> $1,000,000 per year for life — a guaranteed annual annuity paid for the winner's lifetime.</li>
  <li><strong>Second prize (5 numbers):</strong> $25,000 per year for life.</li>
</ul>
<p>Lower-tier fixed prizes are available for matching 4 numbers with or without the Millionaire Ball, and for matching 3 numbers with the Millionaire Ball. All prizes are subject to federal and applicable state income taxes.</p>
<h4>Where to Buy</h4>
<p>Tickets are sold at authorized New York State Lottery retailers and through the official NY Lottery app and website. Players must be at least 18 years old.</p>
<p><em>Millionaire for Life is for entertainment purposes only. Past results do not predict future outcomes. Please play responsibly.</em></p>
  `.trim(),
};
