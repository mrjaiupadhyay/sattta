// Simple in-browser state (no real backend, demo only)
const INITIAL_BALANCE = 10000;

const matches = [
  {
    id: "m1",
    teams: "Mumbai vs Delhi",
    league: "Cricket League",
    startTime: "Today 7:30 PM",
    odds: {
      team1: 1.9,
      team2: 2.1,
      draw: 3.4,
    },
  },
  {
    id: "m2",
    teams: "Barcelona vs Madrid",
    league: "Football Super Cup",
    startTime: "Today 10:00 PM",
    odds: {
      team1: 2.2,
      team2: 1.8,
      draw: 3.1,
    },
  },
  {
    id: "m3",
    teams: "India vs Pakistan",
    league: "Champions Trophy",
    startTime: "Tomorrow 6:00 PM",
    odds: {
      team1: 2.5,
      team2: 2.0,
      draw: 3.8,
    },
  },
];

let balance = INITIAL_BALANCE;
let investments = []; // { id, matchId, matchLabel, outcome, odds, amount, status }
let history = []; // resolved investments

// DOM elements
const balanceAmountEl = document.getElementById("balance-amount");
const resetBalanceBtn = document.getElementById("reset-balance-btn");

const matchesListEl = document.getElementById("matches-list");
const matchSelectEl = document.getElementById("match-select");
const outcomeSelectEl = document.getElementById("outcome-select");
const amountInputEl = document.getElementById("amount-input");
const investFormEl = document.getElementById("invest-form");
const formMessageEl = document.getElementById("form-message");

const investmentsListEl = document.getElementById("investments-list");

const resolveMatchSelectEl = document.getElementById("resolve-match-select");
const resolveRandomBtn = document.getElementById("resolve-random-btn");
const resolveMessageEl = document.getElementById("resolve-message");
const historyListEl = document.getElementById("history-list");

// Helpers
function formatCurrency(amount) {
  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function getMatchById(id) {
  return matches.find((m) => m.id === id);
}

function getOutcomeLabel(outcomeKey) {
  if (outcomeKey === "team1") return "Team 1";
  if (outcomeKey === "team2") return "Team 2";
  if (outcomeKey === "draw") return "Draw";
  return outcomeKey;
}

function setFormMessage(message, type) {
  formMessageEl.textContent = message;
  formMessageEl.className = "form-message";
  if (type === "error") formMessageEl.classList.add("error");
  if (type === "success") formMessageEl.classList.add("success");
}

function setResolveMessage(message, type) {
  resolveMessageEl.textContent = message;
  resolveMessageEl.className = "resolve-message";
  if (type === "good") resolveMessageEl.classList.add("good");
  if (type === "bad") resolveMessageEl.classList.add("bad");
}

// Render functions
function renderBalance() {
  balanceAmountEl.textContent = formatCurrency(balance);
}

function renderMatches() {
  matchesListEl.innerHTML = "";

  matches.forEach((match) => {
    const card = document.createElement("div");
    card.className = "match-card";

    const matchInvested = investments.some(
      (inv) => inv.matchId === match.id && inv.status === "open"
    );

    card.innerHTML = `
      <div class="match-top">
        <div class="teams">
          <span>${match.teams}</span>
          <span class="match-meta">${match.league}</span>
          <span class="match-meta">${match.startTime}</span>
        </div>
        <div class="odds">
          <span>Team 1: ${match.odds.team1.toFixed(2)}x</span>
          <span>Team 2: ${match.odds.team2.toFixed(2)}x</span>
          <span>Draw: ${match.odds.draw.toFixed(2)}x</span>
        </div>
      </div>
      <div class="match-footer">
        <span>${matchInvested ? "You have open investment" : ""}</span>
        <span class="status-pill">${matchInvested ? "Active" : "Open"}</span>
      </div>
    `;

    matchesListEl.appendChild(card);
  });
}

function populateMatchSelects() {
  matchSelectEl.innerHTML = "";
  resolveMatchSelectEl.innerHTML = "";

  matches.forEach((match) => {
    const opt1 = document.createElement("option");
    opt1.value = match.id;
    opt1.textContent = `${match.teams} (${match.league})`;
    matchSelectEl.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = match.id;
    opt2.textContent = `${match.teams} (${match.league})`;
    resolveMatchSelectEl.appendChild(opt2);
  });

  // Trigger outcome options for first match
  updateOutcomeOptions();
}

function updateOutcomeOptions() {
  const matchId = matchSelectEl.value;
  const match = getMatchById(matchId);
  outcomeSelectEl.innerHTML = "";

  if (!match) return;

  ["team1", "team2", "draw"].forEach((key) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = `${getOutcomeLabel(key)} (${match.odds[key].toFixed(
      2
    )}x)`;
    outcomeSelectEl.appendChild(opt);
  });
}

function renderInvestments() {
  investmentsListEl.innerHTML = "";

  const openInvestments = investments.filter((inv) => inv.status === "open");

  if (openInvestments.length === 0) {
    investmentsListEl.classList.add("empty-state");
    investmentsListEl.innerHTML = "<p>No investments yet. Place your first one!</p>";
    return;
  }

  investmentsListEl.classList.remove("empty-state");

  openInvestments.forEach((inv) => {
    const match = getMatchById(inv.matchId);
    const card = document.createElement("div");
    card.className = "investment-card";

    card.innerHTML = `
      <div class="card-row">
        <span class="card-row-label">${match?.teams || "Match"}</span>
        <span class="pill pending">Pending</span>
      </div>
      <div class="card-row">
        <span class="card-row-label">Outcome</span>
        <span class="card-row-value">${getOutcomeLabel(inv.outcome)} (${
      inv.odds.toFixed(2)
    }x)</span>
      </div>
      <div class="card-row">
        <span class="card-row-label">Amount</span>
        <span class="card-row-value">${formatCurrency(inv.amount)}</span>
      </div>
      <div class="card-row">
        <span class="card-row-label">Potential Return</span>
        <span class="card-row-value">${formatCurrency(
          Math.round(inv.amount * inv.odds)
        )}</span>
      </div>
    `;

    investmentsListEl.appendChild(card);
  });
}

function renderHistory() {
  historyListEl.innerHTML = "";

  if (history.length === 0) {
    historyListEl.classList.add("empty-state");
    historyListEl.innerHTML = "<p>No history yet. Resolve a match to see results.</p>";
    return;
  }

  historyListEl.classList.remove("empty-state");

  history.forEach((item) => {
    const match = getMatchById(item.matchId);
    const card = document.createElement("div");
    card.className = "history-card";

    const pillClass = item.result === "win" ? "win" : "loss";
    const pillLabel = item.result === "win" ? "Profit" : "Loss";

    card.innerHTML = `
      <div class="card-row">
        <span class="card-row-label">${match?.teams || "Match"}</span>
        <span class="pill ${pillClass}">${pillLabel}</span>
      </div>
      <div class="card-row">
        <span class="card-row-label">Your Outcome</span>
        <span class="card-row-value">${getOutcomeLabel(item.outcome)} (${
      item.odds.toFixed(2)
    }x)</span>
      </div>
      <div class="card-row">
        <span class="card-row-label">Stake</span>
        <span class="card-row-value">${formatCurrency(item.amount)}</span>
      </div>
      <div class="card-row">
        <span class="card-row-label">P&L</span>
        <span class="card-row-value">${item.result === "win" ? "+" : "-"}${formatCurrency(
      Math.abs(item.pnl)
    )}</span>
      </div>
    `;

    historyListEl.appendChild(card);
  });
}

// Event handlers
function handleInvestSubmit(event) {
  event.preventDefault();
  setFormMessage("", "");

  const matchId = matchSelectEl.value;
  const outcome = outcomeSelectEl.value;
  const amount = Number(amountInputEl.value);

  if (!matchId || !outcome || !amount || Number.isNaN(amount)) {
    setFormMessage("Please fill all fields correctly.", "error");
    return;
  }

  if (amount < 100) {
    setFormMessage("Minimum amount is ₹100.", "error");
    return;
  }

  if (amount > balance) {
    setFormMessage("You don't have enough balance.", "error");
    return;
  }

  const match = getMatchById(matchId);
  if (!match) {
    setFormMessage("Invalid match selected.", "error");
    return;
  }

  const odds = match.odds[outcome];
  if (!odds) {
    setFormMessage("Invalid outcome selected.", "error");
    return;
  }

  // Deduct balance and add investment
  balance -= amount;
  const inv = {
    id: `inv_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    matchId,
    outcome,
    odds,
    amount,
    status: "open",
  };
  investments.push(inv);

  renderBalance();
  renderInvestments();
  renderMatches();

  amountInputEl.value = "";
  setFormMessage("Investment placed successfully!", "success");
}

function handleResetBalance() {
  balance = INITIAL_BALANCE;
  investments = [];
  history = [];
  setFormMessage("", "");
  setResolveMessage("", "");
  renderBalance();
  renderMatches();
  renderInvestments();
  renderHistory();
}

function handleResolveRandom() {
  const matchId = resolveMatchSelectEl.value;
  const match = getMatchById(matchId);
  if (!match) {
    setResolveMessage("Invalid match selected.", "bad");
    return;
  }

  const openForMatch = investments.filter(
    (inv) => inv.matchId === matchId && inv.status === "open"
  );

  if (openForMatch.length === 0) {
    setResolveMessage("No open investments for this match.", "bad");
    return;
  }

  const outcomes = ["team1", "team2", "draw"];
  const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];

  let totalWin = 0;
  let totalStake = 0;

  openForMatch.forEach((inv) => {
    totalStake += inv.amount;
    let pnl = -inv.amount;
    let result = "loss";

    if (inv.outcome === randomOutcome) {
      const winAmount = Math.round(inv.amount * inv.odds);
      pnl = winAmount - inv.amount;
      result = "win";
      totalWin += winAmount;
      balance += winAmount;
    }

    inv.status = "closed";
    history.unshift({
      matchId: inv.matchId,
      outcome: inv.outcome,
      odds: inv.odds,
      amount: inv.amount,
      result,
      pnl,
    });
  });

  renderBalance();
  renderInvestments();
  renderHistory();
  renderMatches();

  if (totalWin > 0) {
    setResolveMessage(
      `Result: ${getOutcomeLabel(
        randomOutcome
      )}. You won ${formatCurrency(totalWin)} on this match!`,
      "good"
    );
  } else {
    setResolveMessage(
      `Result: ${getOutcomeLabel(
        randomOutcome
      )}. All your investments on this match lost.`,
      "bad"
    );
  }
}

// Init
function init() {
  renderBalance();
  renderMatches();
  populateMatchSelects();
  renderInvestments();
  renderHistory();

  matchSelectEl.addEventListener("change", updateOutcomeOptions);
  investFormEl.addEventListener("submit", handleInvestSubmit);
  resetBalanceBtn.addEventListener("click", handleResetBalance);
  resolveRandomBtn.addEventListener("click", handleResolveRandom);
}

document.addEventListener("DOMContentLoaded", init);

