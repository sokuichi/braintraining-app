      const $ = (selector) => document.querySelector(selector);
      const $$ = (selector) => Array.from(document.querySelectorAll(selector));
      const STORAGE_KEY = "smart101TrainingStateV4";

      const moduleInfo = {
        aim: {
          label: "Aim Trainer",
          short: "Aim",
          code: "AIM",
          view: "aim",
          skill: "reaction control",
          quest: "Complete one aim round",
          description: "Adaptive target drills for reaction, accuracy, and mouse control."
        },
        questions: {
          label: "Question Gym",
          short: "Logic",
          code: "QST",
          view: "questions",
          skill: "reasoning",
          quest: "Finish one generated quiz",
          description: "Generated sequences, arithmetic, analogy, logic, and pattern questions."
        },
        memory: {
          label: "Memory Lab",
          short: "Memory",
          code: "MEM",
          view: "memory",
          skill: "working memory",
          quest: "Complete one n-back stream",
          description: "Adaptive n-back trials for updating, monitoring, and recall precision."
        },
        focus: {
          label: "Focus Switch",
          short: "Focus",
          code: "FCS",
          view: "focus",
          skill: "attention control",
          quest: "Complete one Stroop set",
          description: "Color-word conflict drills for inhibition and response control."
        },
        creativity: {
          label: "Creative Sprint",
          short: "Ideas",
          code: "CRT",
          view: "creativity",
          skill: "divergent thinking",
          quest: "Score one idea sprint",
          description: "Divergent thinking drills with targets for volume and variety."
        },
        analogy: {
          label: "Transfer Lab",
          short: "Transfer",
          code: "TRN",
          view: "analogy",
          skill: "analogical thinking",
          quest: "Submit one mapping",
          description: "Far-domain analogy mapping for creative problem solving."
        }
      };

      const defaultState = {
        xp: 0,
        sessions: 0,
        streak: 1,
        lastVisit: "",
        questDate: "",
        quests: {},
        settings: {
          sfx: true,
          volume: 0.35,
          customCursor: true,
          lowMotion: false,
          adaptive: true,
          density: 1
        },
        modules: {
          aim: { difficulty: 1, xp: 0, sessions: 0, best: 0, recent: [], lastNote: "Ready" },
          questions: { difficulty: 1, xp: 0, sessions: 0, best: 0, recent: [], lastNote: "Ready" },
          memory: { difficulty: 1, xp: 0, sessions: 0, best: 0, recent: [], lastNote: "Ready" },
          focus: { difficulty: 1, xp: 0, sessions: 0, best: 0, recent: [], lastNote: "Ready" },
          creativity: { difficulty: 1, xp: 0, sessions: 0, best: 0, recent: [], lastNote: "Ready" },
          analogy: { difficulty: 1, xp: 0, sessions: 0, best: 0, recent: [], lastNote: "Ready" }
        },
        history: []
      };

      let state = loadState();
      let currentView = "dashboard";
      let creativeMethod = "diverge";

      const aimRound = {
        active: false,
        duration: 22,
        remaining: 0,
        hits: 0,
        misses: 0,
        streak: 0,
        best: 0,
        goal: 10,
        targetLife: 1450,
        targetSize: 76,
        tickTimer: 0,
        moveTimer: 0
      };

      const quiz = {
        active: false,
        answered: 0,
        correct: 0,
        target: 6,
        current: null,
        locked: false
      };

      const creative = {
        active: false,
        seconds: 75,
        remaining: 0,
        timer: 0,
        prompt: ""
      };

      const memory = {
        active: false,
        n: 1,
        trial: 0,
        total: 12,
        correct: 0,
        sequence: [],
        current: null,
        answered: false,
        timer: 0
      };

      const focus = {
        active: false,
        trial: 0,
        total: 12,
        correct: 0,
        reactionTotal: 0,
        currentColor: "",
        shownAt: 0,
        answered: false
      };

      const audio = {
        ctx: null,
        armed: false
      };

      const analogySources = [
        { domain: "jazz improvisation", distance: "near", structures: ["timing", "feedback", "variation"] },
        { domain: "skateboarding lines", distance: "near", structures: ["flow", "risk", "recovery"] },
        { domain: "restaurant prep", distance: "near", structures: ["mise en place", "batching", "service pressure"] },
        { domain: "city traffic", distance: "medium", structures: ["routing", "signals", "bottlenecks"] },
        { domain: "weather systems", distance: "medium", structures: ["pressure", "fronts", "forecasting"] },
        { domain: "escape rooms", distance: "medium", structures: ["clues", "locks", "team roles"] },
        { domain: "immune systems", distance: "far", structures: ["detection", "memory", "response"] },
        { domain: "coral reefs", distance: "far", structures: ["symbiosis", "niches", "resilience"] },
        { domain: "space mission control", distance: "far", structures: ["checklists", "telemetry", "abort criteria"] }
      ];

      const promptParts = {
        diverge: [
          "Generate many ways to train focus in under five minutes.",
          "List unusual uses for a timer, a target, and a notebook.",
          "Invent tiny games that make learning feel like aim practice.",
          "Create training rules that reward calm over speed.",
          "Generate alternative interfaces for practicing difficult things daily.",
          "List methods to make feedback feel useful instead of judgmental."
        ],
        constraint: [
          "Design a creativity drill using only one button and three words.",
          "Make a training idea that works without a scoreboard.",
          "Build a daily practice that must fit inside 90 seconds.",
          "Remove the most obvious feature from a study app and replace it.",
          "Make a training task that works with no text labels.",
          "Design a session that gets easier when the user slows down."
        ],
        combine: [
          "Combine aim training with memory practice in a single mechanic.",
          "Fuse a cooking timer with a creativity sprint.",
          "Merge a rhythm game, a journal, and a quiz into one practice loop.",
          "Combine chess puzzles with open-ended idea generation.",
          "Fuse a workout plan with a question generator.",
          "Combine analogies, reaction speed, and recall into one drill."
        ]
      };

      const toastLayer = $("#toastLayer");

      function clone(value) {
        return JSON.parse(JSON.stringify(value));
      }

      function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
      }

      function sample(items) {
        return items[Math.floor(Math.random() * items.length)];
      }

      function shuffle(items) {
        const copy = [...items];
        for (let i = copy.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
      }

      function todayKey() {
        return new Date().toISOString().slice(0, 10);
      }

      function yesterdayKey() {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        return date.toISOString().slice(0, 10);
      }

      function deepMerge(base, saved) {
        const output = clone(base);
        if (!saved || typeof saved !== "object") return output;
        Object.keys(saved).forEach((key) => {
          if (saved[key] && typeof saved[key] === "object" && !Array.isArray(saved[key]) && output[key]) {
            output[key] = deepMerge(output[key], saved[key]);
          } else {
            output[key] = saved[key];
          }
        });
        return output;
      }

      function loadState() {
        let saved = null;
        try {
          saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        } catch {
          saved = null;
        }
        const loaded = deepMerge(defaultState, saved);
        return refreshDailyState(loaded);
      }

      function refreshDailyState(nextState) {
        const today = todayKey();
        if (nextState.lastVisit !== today) {
          nextState.streak = nextState.lastVisit === yesterdayKey() ? nextState.streak + 1 : 1;
          nextState.lastVisit = today;
        }
        if (nextState.questDate !== today) {
          nextState.questDate = today;
          nextState.quests = {};
        }
        return nextState;
      }

      function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }

      function xpForLevel(level) {
        return Math.pow(level - 1, 2) * 260;
      }

      function levelFromXp(xp) {
        let level = 1;
        while (xp >= xpForLevel(level + 1)) level += 1;
        return level;
      }

      function levelProgress(xp) {
        const level = levelFromXp(xp);
        const start = xpForLevel(level);
        const end = xpForLevel(level + 1);
        return {
          level,
          current: xp - start,
          needed: end - start,
          percent: clamp(((xp - start) / (end - start)) * 100, 0, 100)
        };
      }

      function showToast(message) {
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.textContent = message;
        toastLayer.appendChild(toast);
        window.setTimeout(() => toast.remove(), 2800);
      }

      function armAudio() {
        if (audio.armed) {
          if (audio.ctx && audio.ctx.state === "suspended") audio.ctx.resume();
          return;
        }
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        audio.ctx = new AudioContext();
        if (audio.ctx.state === "suspended") audio.ctx.resume();
        audio.armed = true;
      }

      function playSfx(type) {
        if (!state.settings.sfx) return;
        armAudio();
        if (!audio.ctx) return;
        const ctx = audio.ctx;
        const volume = clamp(state.settings.volume, 0, 1);
        const now = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.0001, now);
        master.gain.exponentialRampToValueAtTime(0.22 * volume + 0.0001, now + 0.012);
        master.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        master.connect(ctx.destination);

        const patterns = {
          hit: [440, 660],
          correct: [520, 780, 1040],
          wrong: [220, 146],
          complete: [392, 523, 659, 784],
          level: [330, 495, 742],
          tick: [720]
        };

        (patterns[type] || patterns.hit).forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type === "wrong" ? "sawtooth" : "triangle";
          osc.frequency.setValueAtTime(freq, now + index * 0.045);
          gain.gain.setValueAtTime(0.0001, now + index * 0.045);
          gain.gain.exponentialRampToValueAtTime(0.55, now + index * 0.045 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.045 + 0.13);
          osc.connect(gain);
          gain.connect(master);
          osc.start(now + index * 0.045);
          osc.stop(now + index * 0.045 + 0.15);
        });
      }

      function applySettings() {
        document.body.classList.toggle("cursor-on", state.settings.customCursor);
        document.body.classList.toggle("motion-low", state.settings.lowMotion);
        document.body.dataset.density = String(state.settings.density);
        document.documentElement.style.setProperty("--density", state.settings.density);
        $("#settingSfx").checked = state.settings.sfx;
        $("#settingCursor").checked = state.settings.customCursor;
        $("#settingMotion").checked = state.settings.lowMotion;
        $("#settingAdaptive").checked = state.settings.adaptive;
        $("#settingVolume").value = Math.round(state.settings.volume * 100);
        $("#volumeLabel").textContent = `${Math.round(state.settings.volume * 100)}%`;
        $("#settingTheme").value = state.settings.density;
        $("#densityLabel").textContent = ["compact", "standard", "spacious"][state.settings.density] || "standard";
      }

      function saveSettingsFromForm() {
        state.settings.sfx = $("#settingSfx").checked;
        state.settings.customCursor = $("#settingCursor").checked;
        state.settings.lowMotion = $("#settingMotion").checked;
        state.settings.adaptive = $("#settingAdaptive").checked;
        state.settings.volume = Number($("#settingVolume").value) / 100;
        state.settings.density = Number($("#settingTheme").value);
        applySettings();
        saveState();
        playSfx("complete");
        showToast("Settings saved");
      }

      function setView(view) {
        currentView = view;
        $$(".view").forEach((panel) => panel.classList.remove("is-active"));
        $(`#view-${view}`).classList.add("is-active");
        $$(".nav-btn").forEach((button) => button.classList.toggle("is-active", button.dataset.view === view));
        const titles = {
          dashboard: ["Dashboard", "Choose a module, complete reps, and let the app adjust."],
          aim: ["Aim Trainer", "Click targets. The next round adapts to your accuracy."],
          questions: ["Question Gym", "Generated questions scale with your quiz results."],
          memory: ["Memory Lab", "Train updating by matching symbols and positions from N steps back."],
          focus: ["Focus Switch", "Answer ink color under word-color conflict."],
          creativity: ["Creative Sprint", "Train divergent output with timed prompts and constraints."],
          analogy: ["Transfer Lab", "Practice analogical transfer from distant domains."],
          progress: ["Progress", "Review sessions, difficulty changes, and module growth."],
          research: ["Research", "See the evidence and the objective scoring model."],
          settings: ["Settings", "Tune sound, cursor, motion, and adaptive behavior."]
        };
        $("#viewTitle").textContent = titles[view][0];
        $("#viewSubtitle").textContent = titles[view][1];
        if (view === "aim") resizeCanvas();
      }

      function moduleAverage(key) {
        const recent = state.modules[key].recent;
        if (!recent.length) return 0;
        return recent.reduce((sum, value) => sum + value, 0) / recent.length;
      }

      function difficultyNote(key) {
        const module = state.modules[key];
        const avg = moduleAverage(key);
        if (!module.sessions) return "Start";
        if (avg >= 0.82) return "Rising";
        if (avg < 0.45) return "Easing";
        return "Stable";
      }

      function recordSession(key, result) {
        const module = state.modules[key];
        const success = clamp(result.success, 0, 1);
        const xp = Math.max(0, Math.round(result.xp));
        const oldDifficulty = module.difficulty;

        module.recent.push(success);
        module.recent = module.recent.slice(-8);
        module.sessions += 1;
        module.xp += xp;
        module.best = Math.max(module.best, Math.round(success * 100));

        const avg = moduleAverage(key);
        if (state.settings.adaptive && module.recent.length >= 2 && avg >= 0.82) {
          module.difficulty = clamp(module.difficulty + 1, 1, 10);
          module.lastNote = "Raised difficulty after strong recent results.";
        } else if (state.settings.adaptive && module.recent.length >= 2 && avg < 0.45) {
          module.difficulty = clamp(module.difficulty - 1, 1, 10);
          module.lastNote = "Lowered difficulty so you can rebuild momentum.";
        } else if (!state.settings.adaptive) {
          module.lastNote = "Adaptive difficulty is off in settings.";
        } else {
          module.lastNote = "Held difficulty steady.";
        }

        state.xp += xp;
        state.sessions += 1;
        state.quests[key] = true;
        state.history.unshift({
          module: key,
          label: result.label,
          xp,
          success: Math.round(success * 100),
          difficulty: module.difficulty,
          previousDifficulty: oldDifficulty,
          time: new Date().toLocaleString()
        });
        state.history = state.history.slice(0, 18);
        saveState();
        renderAll();
        const diffText = module.difficulty > oldDifficulty ? "difficulty up" : module.difficulty < oldDifficulty ? "difficulty down" : "difficulty steady";
        playSfx(module.difficulty > oldDifficulty ? "level" : "complete");
        showToast(`+${xp} XP, ${diffText}`);
      }

      function renderAll() {
        renderHeader();
        renderDashboard();
        renderAimConfig();
        renderQuizStats();
        renderMemoryStats();
        renderFocusStats();
        renderCreativeConfig();
        renderAnalogyStats();
        renderProgress();
        applySettings();
      }

      function renderHeader() {
        const level = levelProgress(state.xp);
        $("#sideLevel").textContent = level.level;
        $("#topLevel").textContent = level.level;
        $("#dashLevel").textContent = level.level;
        $("#sideXpBar").style.width = `${level.percent}%`;
        $("#sideXpText").textContent = `${level.current}/${level.needed} XP`;
        $("#sideStreak").textContent = `streak ${state.streak}`;
        $("#topXp").textContent = state.xp;
        $("#dashXp").textContent = state.xp;
        $("#topStreak").textContent = state.streak;
        $("#dashStreak").textContent = state.streak;
        $("#topSessions").textContent = state.sessions;

        Object.keys(moduleInfo).forEach((key) => {
          const cap = key.charAt(0).toUpperCase() + key.slice(1);
          const nav = $(`#nav${cap}Meta`);
          if (nav) nav.textContent = `d${state.modules[key].difficulty}`;
        });
      }

      function renderDashboard() {
        const completed = Object.keys(moduleInfo).filter((key) => state.quests[key]).length;
        const total = Object.keys(moduleInfo).length;
        $("#dashToday").textContent = `${completed}/${total}`;
        $("#navDashboardMeta").textContent = `${completed}/${total}`;

        const moduleGrid = $("#moduleGrid");
        moduleGrid.innerHTML = "";
        Object.keys(moduleInfo).forEach((key) => {
          const info = moduleInfo[key];
          const module = state.modules[key];
          const card = document.createElement("section");
          card.className = "module-card";
          card.innerHTML = `
            <div class="module-card-top">
              <span class="module-icon">${info.code}</span>
              <span class="module-status">${state.quests[key] ? "done today" : "open quest"}</span>
            </div>
            <div class="module-meta">
              <span>${info.skill}</span>
              <span>d${module.difficulty} - ${difficultyNote(key)}</span>
            </div>
            <h3>${info.label}</h3>
            <p>${info.description}</p>
            <div class="bar" aria-hidden="true"><span style="width: ${clamp(module.xp / 900 * 100, 4, 100)}%"></span></div>
            <div class="mini-line" style="margin-top: 10px;">
              <span>${module.xp} XP</span>
              <span>${module.sessions} sessions</span>
            </div>
          `;
          const button = document.createElement("button");
          button.className = "btn small";
          button.type = "button";
          button.textContent = "Open module";
          button.addEventListener("click", () => setView(info.view));
          card.appendChild(button);
          moduleGrid.appendChild(card);
        });

        const questList = $("#questList");
        questList.innerHTML = "";
        Object.keys(moduleInfo).forEach((key) => {
          const info = moduleInfo[key];
          const item = document.createElement("li");
          item.className = state.quests[key] ? "is-done" : "";
          item.innerHTML = `
            <span class="quest-check">ok</span>
            <div><strong>${info.short}</strong><span>${info.quest}</span></div>
            <span>${state.quests[key] ? "done" : `d${state.modules[key].difficulty}`}</span>
          `;
          questList.appendChild(item);
        });

        const skillBars = $("#skillBars");
        skillBars.innerHTML = "";
        Object.keys(moduleInfo).forEach((key) => {
          const module = state.modules[key];
          const row = document.createElement("div");
          row.className = "skill-row";
          row.innerHTML = `
            <div class="skill-label"><span>${moduleInfo[key].skill}</span><span>${module.xp} XP</span></div>
            <div class="bar"><span style="width: ${clamp(module.xp / 1200 * 100, 2, 100)}%"></span></div>
          `;
          skillBars.appendChild(row);
        });
      }

      function aimConfig() {
        const d = state.modules.aim.difficulty;
        return {
          duration: 20 + d * 2,
          targetSize: clamp(82 - d * 5, 32, 82),
          targetLife: clamp(1550 - d * 92, 620, 1550),
          goal: 8 + d * 2
        };
      }

      function renderAimConfig() {
        const config = aimConfig();
        $("#aimDifficulty").textContent = state.modules.aim.difficulty;
        $("#aimTargetSize").textContent = `${config.targetSize}px`;
        $("#aimTargetLife").textContent = `${config.targetLife}ms`;
        $("#aimRoundGoal").textContent = `${config.goal} hits`;
        $("#aimAdaptiveNote").textContent = state.modules.aim.lastNote;
        $("#aimGoal").textContent = config.goal;
      }

      function startAimRound() {
        if (aimRound.active) return;
        const config = aimConfig();
        aimRound.active = true;
        aimRound.duration = config.duration;
        aimRound.remaining = config.duration;
        aimRound.hits = 0;
        aimRound.misses = 0;
        aimRound.streak = 0;
        aimRound.best = 0;
        aimRound.goal = config.goal;
        aimRound.targetLife = config.targetLife;
        aimRound.targetSize = config.targetSize;
        $("#aimTarget").style.setProperty("--target-size", `${config.targetSize}px`);
        $("#aimTarget").classList.add("is-live");
        $("#aimFeedback").textContent = "Round running. Hit targets before they move.";
        updateAimHud();
        moveTarget();
        aimRound.tickTimer = window.setInterval(() => {
          aimRound.remaining = Math.max(0, aimRound.remaining - 0.1);
          updateAimHud();
          if (aimRound.remaining <= 0) finishAimRound();
        }, 100);
      }

      function stopAimRound() {
        if (!aimRound.active) return;
        finishAimRound();
      }

      function updateAimHud() {
        $("#aimTime").textContent = aimRound.remaining.toFixed(1);
        $("#aimHits").textContent = aimRound.hits;
        $("#aimMisses").textContent = aimRound.misses;
        $("#aimBest").textContent = aimRound.best;
        $("#aimGoal").textContent = aimRound.goal;
      }

      function moveTarget() {
        window.clearTimeout(aimRound.moveTimer);
        if (!aimRound.active) return;
        const stage = $("#aimStage");
        const target = $("#aimTarget");
        const rect = stage.getBoundingClientRect();
        const margin = aimRound.targetSize * 0.8;
        const x = margin + Math.random() * Math.max(1, rect.width - margin * 2);
        const y = margin + Math.random() * Math.max(1, rect.height - margin * 2);
        target.style.left = `${x}px`;
        target.style.top = `${y}px`;
        aimRound.moveTimer = window.setTimeout(() => {
          if (!aimRound.active) return;
          aimRound.misses += 1;
          aimRound.streak = 0;
          updateAimHud();
          moveTarget();
        }, aimRound.targetLife);
      }

      function hitTarget(event) {
        if (!aimRound.active) return;
        event.stopPropagation();
        aimRound.hits += 1;
        aimRound.streak += 1;
        aimRound.best = Math.max(aimRound.best, aimRound.streak);
        showPop(event.clientX, event.clientY, "+hit");
        playSfx("hit");
        updateAimHud();
        moveTarget();
      }

      function missTarget(event) {
        if (!aimRound.active) return;
        if (event.target !== $("#aimStage") && event.target !== $("#fieldCanvas")) return;
        aimRound.misses += 1;
        aimRound.streak = 0;
        showPop(event.clientX, event.clientY, "miss");
        playSfx("wrong");
        updateAimHud();
      }

      function showPop(clientX, clientY, text) {
        const stage = $("#aimStage");
        const rect = stage.getBoundingClientRect();
        const pop = document.createElement("div");
        pop.className = "pop";
        pop.textContent = text;
        pop.style.left = `${clientX - rect.left}px`;
        pop.style.top = `${clientY - rect.top}px`;
        stage.appendChild(pop);
        window.setTimeout(() => pop.remove(), 700);
      }

      function finishAimRound() {
        window.clearInterval(aimRound.tickTimer);
        window.clearTimeout(aimRound.moveTimer);
        aimRound.active = false;
        $("#aimTarget").classList.remove("is-live");
        const attempts = aimRound.hits + aimRound.misses;
        if (!attempts) {
          $("#aimFeedback").textContent = "Round cancelled. No progress changed.";
          updateAimHud();
          return;
        }
        const accuracy = attempts ? aimRound.hits / attempts : 0;
        const goalRate = clamp(aimRound.hits / Math.max(1, aimRound.goal), 0, 1);
        const success = goalRate * 0.6 + accuracy * 0.4;
        const xp = aimRound.hits * 9 + aimRound.best * 8 + Math.round(accuracy * 80);
        $("#aimFeedback").textContent = `Round complete: ${aimRound.hits} hits, ${Math.round(accuracy * 100)}% accuracy, best streak ${aimRound.best}.`;
        recordSession("aim", { success, xp, label: `${aimRound.hits} hits, ${Math.round(accuracy * 100)}% accuracy` });
      }

      function numberOptions(answer, spread) {
        const options = new Set([answer]);
        while (options.size < 4) {
          const offset = Math.floor(Math.random() * spread) + 1;
          options.add(answer + (Math.random() > 0.5 ? offset : -offset));
        }
        return shuffle([...options]).map(String);
      }

      function generateQuestion() {
        const d = state.modules.questions.difficulty;
        const generators = [makeMathQuestion, makeSequenceQuestion, makeAnalogyQuestion, makeRuleQuestion, makeLogicQuestion, makeClassificationQuestion, makeWorkingRuleQuestion];
        return sample(generators)(d);
      }

      function makeMathQuestion(d) {
        const a = Math.floor(Math.random() * (8 + d * 5)) + 2;
        const b = Math.floor(Math.random() * (8 + d * 4)) + 2;
        const c = Math.floor(Math.random() * (3 + d)) + 2;
        const useMultiply = d >= 3 || Math.random() > 0.45;
        const answer = useMultiply ? a + b * c : a * b - c;
        return {
          type: "mental math",
          text: useMultiply ? `Solve: ${a} + ${b} x ${c}` : `Solve: ${a} x ${b} - ${c}`,
          answer: String(answer),
          options: numberOptions(answer, 8 + d * 4)
        };
      }

      function makeSequenceQuestion(d) {
        const start = Math.floor(Math.random() * 8) + 1;
        const step = Math.floor(Math.random() * (d + 3)) + 2;
        const growth = d >= 5 ? Math.floor(Math.random() * 3) + 1 : 0;
        const sequence = [];
        let value = start;
        let currentStep = step;
        for (let i = 0; i < 5; i += 1) {
          sequence.push(value);
          value += currentStep;
          currentStep += growth;
        }
        const answer = value;
        return {
          type: growth ? "growing sequence" : "sequence",
          text: `What comes next? ${sequence.join(", ")}, ?`,
          answer: String(answer),
          options: numberOptions(answer, 10 + d * 4)
        };
      }

      function makeAnalogyQuestion() {
        const set = sample([
          ["seed", "sprout", "spark", "flame", ["ash", "flame", "stone", "river"]],
          ["map", "route", "recipe", "meal", ["meal", "oven", "salt", "plate"]],
          ["question", "answer", "lock", "key", ["door", "key", "hinge", "room"]],
          ["practice", "skill", "pressure", "focus", ["noise", "focus", "speed", "luck"]],
          ["rough draft", "revision", "prototype", "iteration", ["iteration", "factory", "launch", "paint"]]
        ]);
        return {
          type: "verbal analogy",
          text: `${set[0]} is to ${set[1]} as ${set[2]} is to...`,
          answer: set[3],
          options: shuffle(set[4])
        };
      }

      function makeRuleQuestion(d) {
        const n = Math.floor(Math.random() * (10 + d * 3)) + 4;
        const answer = n % 2 === 0 ? n / 2 + d : n * 2 - d;
        return {
          type: "rule switch",
          text: `Rule: if the number is even, halve it then add ${d}. If odd, double it then subtract ${d}. Input: ${n}.`,
          answer: String(answer),
          options: numberOptions(answer, 9 + d * 3)
        };
      }

      function makeLogicQuestion(d) {
        const names = shuffle(["Ari", "Bo", "Cy", "Dee", "Eli", "Fay"]).slice(0, 3);
        const scores = shuffle([12 + d, 15 + d * 2, 18 + d * 3]);
        const order = names.map((name, index) => ({ name, score: scores[index] })).sort((a, b) => b.score - a.score);
        return {
          type: "deduction",
          text: `${names[0]} scored ${scores[0]}, ${names[1]} scored ${scores[1]}, and ${names[2]} scored ${scores[2]}. Who scored the most?`,
          answer: order[0].name,
          options: shuffle(names)
        };
      }

      function makeClassificationQuestion(d) {
        const sets = [
          [["triangle", "square", "circle"], "shape", ["shape", "animal", "weather", "tool"]],
          [["hammer", "saw", "drill"], "tool", ["planet", "tool", "emotion", "color"]],
          [["jazz", "blues", "salsa"], "music", ["mineral", "music", "vehicle", "fruit"]],
          [["debug", "compile", "deploy"], "software", ["software", "garden", "storm", "kitchen"]]
        ];
        const set = sample(sets);
        const extra = d >= 5 ? ` Extra clue: ${sample(["they are made by people", "they involve action", "they can be practiced"])}.` : "";
        return {
          type: "classification",
          text: `What category connects these? ${set[0].join(", ")}.${extra}`,
          answer: set[1],
          options: shuffle(set[2])
        };
      }

      function makeWorkingRuleQuestion(d) {
        const letters = shuffle(["A", "B", "C", "D", "E", "F"]);
        const shift = clamp(Math.ceil(d / 2), 1, 5);
        const answer = letters[shift];
        return {
          type: "working rule",
          text: `Letters: ${letters.join(" ")}. If the rule is "pick the item ${shift} spaces after the first letter," what do you pick?`,
          answer,
          options: shuffle(letters.slice(0, 4).includes(answer) ? letters.slice(0, 4) : [answer, ...letters.slice(0, 3)])
        };
      }

      function startQuiz() {
        quiz.active = true;
        quiz.answered = 0;
        quiz.correct = 0;
        quiz.target = 5 + Math.ceil(state.modules.questions.difficulty / 2);
        quiz.locked = false;
        $("#quizFeedback").textContent = "Quiz running. Choose the best answer.";
        nextQuestion();
        renderQuizStats();
      }

      function nextQuestion() {
        if (!quiz.active) {
          startQuiz();
          return;
        }
        if (quiz.locked && quiz.answered >= quiz.target) {
          finishQuiz();
          return;
        }
        quiz.current = generateQuestion();
        quiz.locked = false;
        $("#questionText").textContent = quiz.current.text;
        $("#questionType").textContent = quiz.current.type;
        $("#nextQuestion").textContent = "Next";
        renderAnswers();
        renderQuizStats();
      }

      function renderAnswers() {
        const grid = $("#answerGrid");
        grid.innerHTML = "";
        quiz.current.options.forEach((option) => {
          const button = document.createElement("button");
          button.className = "answer-btn";
          button.type = "button";
          button.textContent = option;
          button.addEventListener("click", () => answerQuestion(button, option));
          grid.appendChild(button);
        });
      }

      function answerQuestion(button, option) {
        if (!quiz.active || quiz.locked) return;
        quiz.locked = true;
        quiz.answered += 1;
        const correct = option === quiz.current.answer;
        if (correct) quiz.correct += 1;
        playSfx(correct ? "correct" : "wrong");
        $$(".answer-btn").forEach((item) => {
          item.disabled = true;
          if (item.textContent === quiz.current.answer) item.classList.add("is-correct");
        });
        if (!correct) button.classList.add("is-wrong");
        $("#quizFeedback").textContent = correct ? "Correct. Nice pattern read." : `Not quite. Correct answer: ${quiz.current.answer}.`;
        $("#nextQuestion").textContent = quiz.answered >= quiz.target ? "Finish session" : "Next";
        renderQuizStats();
      }

      function finishQuiz() {
        if (!quiz.active || quiz.answered === 0) return;
        const success = quiz.correct / quiz.answered;
        const xp = quiz.correct * 24 + Math.round(success * 70);
        $("#quizFeedback").textContent = `Quiz complete: ${quiz.correct}/${quiz.answered}, ${Math.round(success * 100)}%.`;
        quiz.active = false;
        recordSession("questions", { success, xp, label: `${quiz.correct}/${quiz.answered} correct` });
      }

      function renderQuizStats() {
        const d = state.modules.questions.difficulty;
        $("#questionDifficulty").textContent = `difficulty ${d}`;
        $("#questionProgress").textContent = `${quiz.answered}/${quiz.target || 0}`;
        $("#quizCorrect").textContent = quiz.correct;
        $("#quizAsked").textContent = quiz.answered;
        $("#quizTarget").textContent = quiz.target || (5 + Math.ceil(d / 2));
        $("#quizDifficulty").textContent = d;
      }

      function memoryConfig() {
        const d = state.modules.memory.difficulty;
        return {
          n: clamp(Math.ceil(d / 3), 1, 4),
          total: 10 + d * 2,
          interval: clamp(2100 - d * 120, 850, 2100)
        };
      }

      function startMemoryStream() {
        if (memory.active) return;
        const config = memoryConfig();
        memory.active = true;
        memory.n = config.n;
        memory.total = config.total;
        memory.trial = 0;
        memory.correct = 0;
        memory.sequence = [];
        memory.answered = false;
        $("#memoryFeedback").textContent = "Stream running. Match the symbol and/or position from N steps back.";
        nextMemoryTrial();
      }

      function stopMemoryStream() {
        if (!memory.active) return;
        finishMemoryStream();
      }

      function nextMemoryTrial() {
        window.clearTimeout(memory.timer);
        if (!memory.active) return;
        if (memory.trial >= memory.total) {
          finishMemoryStream();
          return;
        }
        if (!memory.answered && memory.trial > memory.n) {
          $("#memoryFeedback").textContent = "Missed response. Answer before the next card.";
          playSfx("wrong");
        }
        const symbols = ["A", "K", "M", "R", "S", "T", "Z", "7", "9"];
        memory.current = {
          symbol: sample(symbols),
          position: Math.floor(Math.random() * 9)
        };
        if (memory.trial >= memory.n && Math.random() < 0.38) {
          const back = memory.sequence[memory.sequence.length - memory.n];
          if (Math.random() > 0.5) memory.current.symbol = back.symbol;
          if (Math.random() > 0.5) memory.current.position = back.position;
        }
        memory.sequence.push(memory.current);
        memory.trial += 1;
        memory.answered = false;
        renderMemoryCard();
        renderMemoryStats();
        memory.timer = window.setTimeout(nextMemoryTrial, memoryConfig().interval);
      }

      function memoryExpected() {
        if (memory.sequence.length <= memory.n) return { symbol: false, position: false };
        const current = memory.current;
        const back = memory.sequence[memory.sequence.length - 1 - memory.n];
        return {
          symbol: current.symbol === back.symbol,
          position: current.position === back.position
        };
      }

      function answerMemory(kind) {
        if (!memory.active || memory.answered) return;
        const expected = memoryExpected();
        const answer = {
          symbol: kind === "symbol" || kind === "both",
          position: kind === "position" || kind === "both"
        };
        const correct = expected.symbol === answer.symbol && expected.position === answer.position;
        memory.answered = true;
        if (correct) memory.correct += 1;
        playSfx(correct ? "correct" : "wrong");
        $("#memoryFeedback").textContent = correct
          ? "Correct match decision."
          : `Mismatch. Expected: ${expected.symbol && expected.position ? "both" : expected.symbol ? "symbol" : expected.position ? "position" : "no match"}.`;
        renderMemoryStats();
      }

      function renderMemoryCard() {
        $("#memorySymbol").textContent = memory.current ? memory.current.symbol : "?";
        $$("#memoryGrid span").forEach((cell, index) => {
          cell.classList.toggle("is-lit", memory.current && index === memory.current.position);
        });
      }

      function finishMemoryStream() {
        window.clearTimeout(memory.timer);
        const attempted = Math.max(memory.trial, 1);
        const success = memory.correct / attempted;
        const xp = memory.correct * 18 + Math.round(success * 80);
        memory.active = false;
        $("#memoryFeedback").textContent = `Stream complete: ${memory.correct}/${attempted} correct at ${memory.n}-back.`;
        playSfx("complete");
        recordSession("memory", { success, xp, label: `${memory.correct}/${attempted} at ${memory.n}-back` });
      }

      function renderMemoryStats() {
        const config = memoryConfig();
        $("#memoryDifficulty").textContent = state.modules.memory.difficulty;
        $("#memoryN").textContent = memory.active ? memory.n : config.n;
        $("#memoryTrial").textContent = `${memory.trial}/${memory.active ? memory.total : config.total}`;
        $("#memoryCorrect").textContent = memory.correct;
      }

      function focusConfig() {
        const d = state.modules.focus.difficulty;
        return {
          total: 10 + d * 2,
          congruentRate: clamp(0.48 - d * 0.035, 0.12, 0.48),
          targetMs: clamp(1350 - d * 75, 620, 1350)
        };
      }

      function startFocusSet() {
        if (focus.active) return;
        const config = focusConfig();
        focus.active = true;
        focus.trial = 0;
        focus.total = config.total;
        focus.correct = 0;
        focus.reactionTotal = 0;
        $("#focusFeedback").textContent = "Set running. Answer the ink color.";
        nextFocusTrial();
      }

      function stopFocusSet() {
        if (!focus.active) return;
        finishFocusSet();
      }

      function nextFocusTrial() {
        if (!focus.active) return;
        if (focus.trial >= focus.total) {
          finishFocusSet();
          return;
        }
        const colors = ["red", "blue", "green", "yellow"];
        const word = sample(colors);
        const config = focusConfig();
        const ink = Math.random() < config.congruentRate ? word : sample(colors.filter((color) => color !== word));
        focus.currentColor = ink;
        focus.trial += 1;
        focus.answered = false;
        focus.shownAt = performance.now();
        const wordEl = $("#focusWord");
        wordEl.textContent = word;
        wordEl.style.color = {
          red: "var(--red)",
          blue: "var(--blue)",
          green: "var(--green)",
          yellow: "var(--yellow)"
        }[ink];
        $("#focusCue").textContent = `Trial ${focus.trial}/${focus.total}. Choose ink color.`;
        renderFocusStats();
      }

      function answerFocus(color) {
        if (!focus.active || focus.answered) return;
        focus.answered = true;
        const rt = performance.now() - focus.shownAt;
        const correct = color === focus.currentColor;
        if (correct) {
          focus.correct += 1;
          focus.reactionTotal += rt;
        }
        playSfx(correct ? "correct" : "wrong");
        $("#focusFeedback").textContent = correct ? `Correct in ${Math.round(rt)}ms.` : `Wrong. Ink color was ${focus.currentColor}.`;
        renderFocusStats();
        window.setTimeout(nextFocusTrial, correct ? 260 : 650);
      }

      function finishFocusSet() {
        focus.active = false;
        const attempted = Math.max(focus.trial, 1);
        const accuracy = focus.correct / attempted;
        const avgRt = focus.correct ? focus.reactionTotal / focus.correct : 9999;
        const speedScore = clamp(1 - (avgRt - 450) / 1300, 0, 1);
        const success = accuracy * 0.72 + speedScore * 0.28;
        const xp = focus.correct * 16 + Math.round(speedScore * 65);
        $("#focusFeedback").textContent = `Set complete: ${focus.correct}/${attempted}, avg ${Math.round(avgRt)}ms.`;
        playSfx("complete");
        recordSession("focus", { success, xp, label: `${focus.correct}/${attempted}, ${Math.round(avgRt)}ms avg` });
      }

      function renderFocusStats() {
        $("#focusDifficulty").textContent = state.modules.focus.difficulty;
        $("#focusTrial").textContent = `${focus.trial}/${focus.active ? focus.total : focusConfig().total}`;
        $("#focusCorrect").textContent = focus.correct;
        const avgRt = focus.correct ? Math.round(focus.reactionTotal / focus.correct) : 0;
        $("#focusRt").textContent = `${avgRt}ms`;
      }

      function creativeConfig() {
        const d = state.modules.creativity.difficulty;
        return {
          target: 5 + d * 2,
          seconds: 60 + d * 8,
          constraints: clamp(Math.ceil(d / 3), 1, 4)
        };
      }

      function generateCreativePrompt() {
        const d = state.modules.creativity.difficulty;
        const base = sample(promptParts[creativeMethod]);
        const constraints = [
          "make one idea useful for a beginner",
          "include a scoring rule",
          "include a five minute version",
          "remove the most obvious feature",
          "add one feedback loop",
          "make it work without instructions"
        ];
        const chosen = shuffle(constraints).slice(0, creativeConfig().constraints);
        creative.prompt = `${base} Constraint set d${d}: ${chosen.join("; ")}.`;
        $("#creativePrompt").textContent = creative.prompt;
      }

      function startCreativeSprint() {
        const config = creativeConfig();
        creative.active = true;
        creative.seconds = config.seconds;
        creative.remaining = config.seconds;
        $("#ideaBox").focus();
        $("#creativeFeedback").textContent = "Sprint running. One idea per line. Do not judge yet.";
        window.clearInterval(creative.timer);
        creative.timer = window.setInterval(() => {
          creative.remaining = Math.max(0, creative.remaining - 1);
          renderCreativeConfig();
          if (creative.remaining === 0) {
            window.clearInterval(creative.timer);
            creative.active = false;
            $("#creativeFeedback").textContent = "Timer done. Score the sprint when ready.";
          }
        }, 1000);
        renderCreativeConfig();
      }

      function ideaLines() {
        return $("#ideaBox").value.split(/\n|;/).map((line) => line.trim()).filter(Boolean);
      }

      function uniqueKeywordCount(lines) {
        const words = new Set();
        lines.join(" ").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).forEach((word) => {
          if (word.length > 4) words.add(word);
        });
        return words.size;
      }

      function scoreCreativeSprint() {
        const lines = ideaLines();
        if (!lines.length) {
          $("#creativeFeedback").textContent = "Write at least one idea first.";
          return;
        }
        window.clearInterval(creative.timer);
        creative.active = false;
        const config = creativeConfig();
        const variety = uniqueKeywordCount(lines);
        const constraintTerms = ["score", "rule", "test", "measure", "beginner", "timer", "feedback", "prototype", "constraint"];
        const constraintHits = constraintTerms.filter((term) => $("#ideaBox").value.toLowerCase().includes(term)).length;
        const countScore = clamp(lines.length / config.target, 0, 1);
        const varietyScore = clamp(variety / (config.target * 2.4), 0, 1);
        const elaboration = clamp(lines.filter((line) => line.length > 34).length / Math.max(1, lines.length), 0, 1);
        const constraintScore = clamp(constraintHits / 4, 0, 1);
        const success = countScore * 0.46 + varietyScore * 0.22 + elaboration * 0.17 + constraintScore * 0.15;
        const xp = lines.length * 12 + Math.round(varietyScore * 55) + Math.round(elaboration * 45) + Math.round(constraintScore * 40);
        $("#creativeFeedback").textContent = `Scored ${lines.length} ideas, ${variety} varied keywords, ${constraintHits} objective terms, ${Math.round(success * 100)}% session strength.`;
        playSfx(success > 0.72 ? "correct" : "tick");
        recordSession("creativity", { success, xp, label: `${lines.length} ideas, ${variety} varied keywords` });
      }

      function renderCreativeConfig() {
        const config = creativeConfig();
        const count = ideaLines().length;
        $("#creativeDifficulty").textContent = state.modules.creativity.difficulty;
        $("#creativeTarget").textContent = config.target;
        $("#creativeCount").textContent = count;
        const remaining = creative.active ? creative.remaining : config.seconds;
        const minutes = Math.floor(remaining / 60).toString().padStart(2, "0");
        const seconds = Math.floor(remaining % 60).toString().padStart(2, "0");
        $("#creativeTimer").textContent = `${minutes}:${seconds}`;
      }

      function generateAnalogyChallenge() {
        const d = state.modules.analogy.difficulty;
        const desiredDistance = d >= 7 ? "far" : d >= 4 ? "medium" : "near";
        const candidates = analogySources.filter((item) => item.distance === desiredDistance);
        const source = sample(candidates.length ? candidates : analogySources);
        $("#analogySource").textContent = `Source domain: ${source.domain}. Map ${source.structures.join(", ")} onto the target problem.`;
        $("#analogyDistance").textContent = source.distance;
        $("#mapOne").value = "";
        $("#mapTwo").value = "";
        $("#mapThree").value = "";
        $("#mapFour").value = "";
        $("#analogyFeedback").textContent = "New transfer challenge ready. Fill the structure, mapping, prototype, and test fields.";
        renderAnalogyStats();
      }

      function analogyTextParts() {
        return [$("#mapOne").value.trim(), $("#mapTwo").value.trim(), $("#mapThree").value.trim(), $("#mapFour").value.trim()];
      }

      function analogyRubric() {
        const parts = analogyTextParts();
        const structureWords = ["structure", "pattern", "feedback", "timing", "system", "rule", "loop", "signal", "constraint", "flow", "recovery", "memory", "response"];
        const mappingWords = ["maps", "becomes", "transfers", "turns", "means", "so", "because", "therefore", "into"];
        const testWords = ["test", "measure", "prototype", "try", "compare", "track", "score", "observe", "experiment"];
        const structure = clamp((parts[0].split(/\s+/).filter(Boolean).length / 18) * 0.55 + keywordHit(parts[0], structureWords) * 0.45, 0, 1);
        const mapping = clamp((parts[1].split(/\s+/).filter(Boolean).length / 22) * 0.55 + keywordHit(parts[1], mappingWords) * 0.45, 0, 1);
        const prototype = clamp(parts[2].split(/\s+/).filter(Boolean).length / 22, 0, 1);
        const test = clamp((parts[3].split(/\s+/).filter(Boolean).length / 18) * 0.45 + keywordHit(parts[3], testWords) * 0.55, 0, 1);
        return { structure, mapping, prototype, test };
      }

      function keywordHit(text, words) {
        const lower = text.toLowerCase();
        const hits = words.filter((word) => lower.includes(word)).length;
        return clamp(hits / 2, 0, 1);
      }

      function scoreAnalogy() {
        const parts = analogyTextParts();
        const filled = parts.filter(Boolean).length;
        const words = parts.join(" ").split(/\s+/).filter(Boolean).length;
        if (!filled) {
          $("#analogyFeedback").textContent = "Add at least one mapping before scoring.";
          return;
        }
        const rubric = analogyRubric();
        const filledScore = filled / 4;
        const success = filledScore * 0.24 + rubric.structure * 0.22 + rubric.mapping * 0.24 + rubric.prototype * 0.12 + rubric.test * 0.18;
        const xp = filled * 26 + Math.round(success * 105);
        $("#analogyFeedback").textContent = `Transfer scored: ${filled}/4 fields, ${words} words, ${Math.round(success * 100)}% objective strength.`;
        renderAnalogyStats();
        playSfx(success > 0.68 ? "correct" : "tick");
        recordSession("analogy", { success, xp, label: `${filled}/4 fields, ${Math.round(success * 100)}% transfer` });
      }

      function renderAnalogyStats() {
        const parts = analogyTextParts();
        const filled = parts.filter(Boolean).length;
        const words = parts.join(" ").split(/\s+/).filter(Boolean).length;
        const rubric = analogyRubric();
        $("#analogyDifficulty").textContent = state.modules.analogy.difficulty;
        $("#analogyFilled").textContent = `${filled}/4`;
        $("#analogyWords").textContent = words;
        $("#analogyStructureScore").textContent = `${Math.round(rubric.structure * 100)}%`;
        $("#analogyMapScore").textContent = `${Math.round(rubric.mapping * 100)}%`;
        $("#analogyTestScore").textContent = `${Math.round(rubric.test * 100)}%`;
      }

      function renderProgress() {
        const history = $("#historyList");
        history.innerHTML = "";
        if (!state.history.length) {
          const empty = document.createElement("li");
          empty.innerHTML = "<strong>No sessions yet</strong><span>Train in any module to fill this log.</span>";
          history.appendChild(empty);
        } else {
          state.history.forEach((entry) => {
            const info = moduleInfo[entry.module];
            const changed = entry.difficulty > entry.previousDifficulty ? "up" : entry.difficulty < entry.previousDifficulty ? "down" : "steady";
            const item = document.createElement("li");
            item.innerHTML = `<strong>${info.label} - ${entry.success}%</strong><span>${entry.label}. +${entry.xp} XP. Difficulty ${changed} to ${entry.difficulty}. ${entry.time}</span>`;
            history.appendChild(item);
          });
        }

        const progress = $("#moduleProgressList");
        progress.innerHTML = "";
        Object.keys(moduleInfo).forEach((key) => {
          const module = state.modules[key];
          const item = document.createElement("li");
          item.innerHTML = `<strong>${moduleInfo[key].label}</strong><span>d${module.difficulty}, ${module.xp} XP, ${module.sessions} sessions, best ${module.best}%. ${module.lastNote}</span>`;
          progress.appendChild(item);
        });
      }

      function copyProgressReport() {
        const report = [
          "How to get smart 101 progress",
          `XP: ${state.xp}`,
          `Level: ${levelFromXp(state.xp)}`,
          `Streak: ${state.streak}`,
          ...Object.keys(moduleInfo).map((key) => {
            const module = state.modules[key];
            return `${moduleInfo[key].label}: d${module.difficulty}, ${module.xp} XP, ${module.sessions} sessions, best ${module.best}%`;
          })
        ].join("\n");
        navigator.clipboard.writeText(report).then(
          () => showToast("Progress report copied"),
          () => showToast("Clipboard copy blocked")
        );
      }

      function resetProgressData() {
        const confirmed = window.confirm("Reset all local training progress for this app?");
        if (!confirmed) return;
        localStorage.removeItem(STORAGE_KEY);
        state = refreshDailyState(clone(defaultState));
        saveState();
        renderAll();
        showToast("Progress reset");
      }

      function setupCanvas() {
        const canvas = $("#fieldCanvas");
        const ctx = canvas.getContext("2d");
        const particles = Array.from({ length: 54 }, () => ({
          x: Math.random(),
          y: Math.random(),
          vx: (Math.random() - 0.5) * 0.0007,
          vy: (Math.random() - 0.5) * 0.0007,
          size: 1 + Math.random() * 2.4
        }));

        function draw() {
          const stage = $("#aimStage");
          const rect = stage.getBoundingClientRect();
          ctx.clearRect(0, 0, rect.width, rect.height);
          particles.forEach((particle, index) => {
            particle.x += particle.vx * (1 + state.modules.aim.difficulty * 0.12);
            particle.y += particle.vy * (1 + state.modules.aim.difficulty * 0.12);
            if (particle.x < 0 || particle.x > 1) particle.vx *= -1;
            if (particle.y < 0 || particle.y > 1) particle.vy *= -1;
            particle.x = clamp(particle.x, 0, 1);
            particle.y = clamp(particle.y, 0, 1);
            const x = particle.x * rect.width;
            const y = particle.y * rect.height;
            ctx.fillStyle = index % 4 === 0 ? "rgba(246, 216, 111, 0.78)" : "rgba(247, 240, 223, 0.48)";
            ctx.beginPath();
            ctx.arc(x, y, particle.size, 0, Math.PI * 2);
            ctx.fill();
          });
          window.requestAnimationFrame(draw);
        }

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();
        draw();
      }

      function resizeCanvas() {
        const canvas = $("#fieldCanvas");
        const stage = $("#aimStage");
        if (!canvas || !stage) return;
        const rect = stage.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.floor(rect.width * dpr));
        canvas.height = Math.max(1, Math.floor(rect.height * dpr));
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        const ctx = canvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      function bindEvents() {
        $$(".nav-btn").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
        $$("[data-start-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.startView)));
        $("#startAim").addEventListener("click", startAimRound);
        $("#stopAim").addEventListener("click", stopAimRound);
        $("#aimTarget").addEventListener("click", hitTarget);
        $("#aimStage").addEventListener("click", missTarget);
        $("#startQuiz").addEventListener("click", startQuiz);
        $("#nextQuestion").addEventListener("click", nextQuestion);
        $("#startMemory").addEventListener("click", startMemoryStream);
        $("#stopMemory").addEventListener("click", stopMemoryStream);
        $("#memorySymbolMatch").addEventListener("click", () => answerMemory("symbol"));
        $("#memoryPositionMatch").addEventListener("click", () => answerMemory("position"));
        $("#memoryBothMatch").addEventListener("click", () => answerMemory("both"));
        $("#memoryNoMatch").addEventListener("click", () => answerMemory("none"));
        $("#startFocus").addEventListener("click", startFocusSet);
        $("#stopFocus").addEventListener("click", stopFocusSet);
        $$(".color-btn").forEach((button) => button.addEventListener("click", () => answerFocus(button.dataset.color)));
        $("#startCreative").addEventListener("click", startCreativeSprint);
        $("#newCreativePrompt").addEventListener("click", generateCreativePrompt);
        $("#submitCreative").addEventListener("click", scoreCreativeSprint);
        $("#clearCreative").addEventListener("click", () => {
          $("#ideaBox").value = "";
          renderCreativeConfig();
        });
        $("#ideaBox").addEventListener("input", renderCreativeConfig);
        $$("[data-creative-method]").forEach((button) => {
          button.addEventListener("click", () => {
            $$("[data-creative-method]").forEach((item) => item.classList.remove("is-active"));
            button.classList.add("is-active");
            creativeMethod = button.dataset.creativeMethod;
            generateCreativePrompt();
          });
        });
        $("#generateAnalogy").addEventListener("click", generateAnalogyChallenge);
        $("#submitAnalogy").addEventListener("click", scoreAnalogy);
        ["#mapOne", "#mapTwo", "#mapThree", "#mapFour", "#analogyProblem"].forEach((selector) => {
          $(selector).addEventListener("input", renderAnalogyStats);
        });
        $("#exportProgress").addEventListener("click", copyProgressReport);
        $("#resetProgress").addEventListener("click", resetProgressData);
        $("#saveSettings").addEventListener("click", saveSettingsFromForm);
        $("#quickSettings").addEventListener("click", () => setView("settings"));
        $("#quickSound").addEventListener("click", () => playSfx("complete"));
        $("#settingVolume").addEventListener("input", () => {
          state.settings.volume = Number($("#settingVolume").value) / 100;
          $("#volumeLabel").textContent = `${Math.round(state.settings.volume * 100)}%`;
        });
        $("#settingTheme").addEventListener("input", () => {
          $("#densityLabel").textContent = ["compact", "standard", "spacious"][Number($("#settingTheme").value)] || "standard";
        });
        $$("[data-sfx-test]").forEach((button) => button.addEventListener("click", () => playSfx(button.dataset.sfxTest)));
        document.addEventListener("pointerdown", () => {
          armAudio();
          $("#customCursor").classList.add("is-pressing");
        });
        document.addEventListener("pointerup", () => $("#customCursor").classList.remove("is-pressing"));
        document.addEventListener("pointermove", (event) => {
          const cursor = $("#customCursor");
          cursor.style.transform = `translate(${event.clientX - 9}px, ${event.clientY - 9}px)`;
        });
      }

      bindEvents();
      setupCanvas();
      generateCreativePrompt();
      generateAnalogyChallenge();
      renderAll();
      applySettings();
      saveState();
