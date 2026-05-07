      const domCache = new Map();
      const $ = (selector) => {
        if (selector.startsWith("#") && !selector.includes(" ")) {
          if (!domCache.has(selector)) domCache.set(selector, document.querySelector(selector));
          return domCache.get(selector);
        }
        return document.querySelector(selector);
      };
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
        },
        spatial: {
          label: "Spatial Lab",
          short: "Spatial",
          code: "SPC",
          view: "spatial",
          skill: "spatial reasoning",
          quest: "Complete one spatial transform set",
          description: "Mental rotation, mirror, and translation chains with exact coordinate scoring."
        },
        calibration: {
          label: "Calibration Lab",
          short: "Calibrate",
          code: "CAL",
          view: "calibration",
          skill: "metacognition",
          quest: "Complete one confidence set",
          description: "Evidence questions with confidence scoring, calibration error, and feedback."
        },
        systems: {
          label: "Systems Lab",
          short: "Systems",
          code: "SYS",
          view: "systems",
          skill: "systems reasoning",
          quest: "Complete one complex systems set",
          description: "Causal graphs, Bayesian updates, proof chains, and scheduling optimizers."
        },
        rrt: {
          label: "Relational Reasoning",
          short: "RRT",
          code: "RRT",
          view: "rrt",
          skill: "relational integration",
          quest: "Complete one relational reasoning block",
          description: "Research-backed relation training: frames, analogies, transitive inference, and matrix rules."
        }
      };

      const defaultState = {
        xp: 0,
        sessions: 0,
        streak: 1,
        lastVisit: "",
        questDate: "",
        quests: {},
        progression: {
          mastery: 0,
          trainingPower: 0,
          peakRank: "Novice"
        },
        settings: {
          sfx: true,
          volume: 0.35,
          customCursor: true,
          lowMotion: false,
          adaptive: true,
          usePortedData: true,
          density: 1,
          hardMode: true,
          problemDepth: 2,
          sessionLoad: 1,
          vfx: 2,
          theme: "classic"
        },
        modules: {
          aim: { difficulty: 1, xp: 0, sessions: 0, best: 0, recent: [], mastery: 0, lastNote: "Ready" },
          questions: { difficulty: 1, xp: 0, sessions: 0, best: 0, recent: [], mastery: 0, lastNote: "Ready" },
          memory: { difficulty: 1, xp: 0, sessions: 0, best: 0, recent: [], mastery: 0, mode: "dual", lastNote: "Ready" },
          focus: { difficulty: 1, xp: 0, sessions: 0, best: 0, recent: [], mastery: 0, lastNote: "Ready" },
          creativity: { difficulty: 1, xp: 0, sessions: 0, best: 0, recent: [], mastery: 0, lastNote: "Ready" },
          analogy: { difficulty: 1, xp: 0, sessions: 0, best: 0, recent: [], mastery: 0, lastNote: "Ready" },
          spatial: { difficulty: 1, xp: 0, sessions: 0, best: 0, recent: [], mastery: 0, lastNote: "Ready" },
          calibration: { difficulty: 1, xp: 0, sessions: 0, best: 0, recent: [], mastery: 0, lastNote: "Ready" },
          systems: { difficulty: 1, xp: 0, sessions: 0, best: 0, recent: [], mastery: 0, mode: "mixed", lastNote: "Ready" },
          rrt: { difficulty: 1, xp: 0, sessions: 0, best: 0, recent: [], mastery: 0, mode: "evidence", lastNote: "Ready" }
        },
        history: [],
        eventLog: [],
        ported: {
          updatedAt: "",
          entries: [],
          summary: {}
        }
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
        mode: "dual",
        trial: 0,
        total: 12,
        correct: 0,
        channelCorrect: 0,
        channelTotal: 0,
        sequence: [],
        current: null,
        answered: false,
        selected: new Set(),
        timer: 0
      };

      const memoryModes = {
        dual: {
          label: "Dual",
          grid: 3,
          channels: ["symbol", "position"],
          description: "Symbol plus 2D grid position."
        },
        multi: {
          label: "Multi-pos",
          grid: 4,
          channels: ["symbol", "position", "color"],
          description: "Larger positional field with color binding."
        },
        manipulation: {
          label: "Stimuli",
          grid: 4,
          channels: ["symbol", "position", "color", "transform"],
          description: "Stimuli manipulation n-back: compare symbol, position, color, and transform rules."
        },
        quad: {
          label: "Quad",
          grid: 5,
          channels: ["symbol", "position", "color", "transform"],
          description: "Large spatial field, color, symbol, and transform channel."
        }
      };

      const focus = {
        active: false,
        trial: 0,
        total: 12,
        correct: 0,
        reactionTotal: 0,
        currentColor: "",
        shownAt: 0,
        answered: false,
        timer: 0
      };

      const spatial = {
        active: false,
        answered: 0,
        correct: 0,
        target: 6,
        current: null,
        locked: false
      };

      const calibration = {
        active: false,
        answered: 0,
        correct: 0,
        target: 5,
        confidenceTotal: 0,
        brierTotal: 0,
        current: null,
        locked: false,
        selected: ""
      };

      const systems = {
        active: false,
        answered: 0,
        correct: 0,
        target: 6,
        current: null,
        locked: false,
        mode: "mixed"
      };

      const rrt = {
        active: false,
        answered: 0,
        correct: 0,
        target: 6,
        current: null,
        locked: false,
        mode: "evidence",
        startTime: 0
      };

      const audio = {
        ctx: null,
        armed: false
      };

      const vfx = {
        canvas: null,
        ctx: null,
        particles: [],
        running: false,
        frame: 0,
        colorTheme: "",
        colors: null
      };

      const terminal = {
        booted: false,
        history: [],
        historyIndex: -1,
        commands: []
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

      window.addEventListener("error", (event) => {
        console.error(event.error || event.message);
        showToast("App recovered from an error. Check console for details.");
      });

      window.addEventListener("unhandledrejection", (event) => {
        console.error(event.reason);
        showToast("Async task failed safely.");
      });

      function clone(value) {
        return JSON.parse(JSON.stringify(value));
      }

      function safeString(value, fallback = "", maxLength = 240) {
        const text = typeof value === "string" ? value : fallback;
        return text.slice(0, maxLength);
      }

      function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, (char) => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "\"": "&quot;",
          "'": "&#39;"
        })[char]);
      }

      function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
      }

      function finiteNumber(value, fallback, min = -Infinity, max = Infinity) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? clamp(parsed, min, max) : fallback;
      }

      function booleanValue(value, fallback) {
        return typeof value === "boolean" ? value : fallback;
      }

      function portedSuggestedDifficulty(key) {
        const summary = state?.ported?.summary?.[key];
        if (!state?.settings?.usePortedData || !summary || summary.count < 1) return 0;
        const avgDifficulty = finiteNumber(summary.avgDifficulty, 0, 0, 10);
        const avgScore = finiteNumber(summary.avgScore, 0, 0, 1);
        if (avgDifficulty) return clamp(Math.round(avgDifficulty), 1, 10);
        return clamp(Math.round(2 + avgScore * 7), 1, 10);
      }

      function moduleDifficulty(key) {
        const base = state?.modules?.[key]?.difficulty || defaultState.modules[key]?.difficulty || 1;
        const hardBonus = state?.settings?.hardMode ? 2 : 0;
        const ported = portedSuggestedDifficulty(key);
        return clamp(Math.max(base + hardBonus, ported), 1, 12);
      }

      function sessionLoadMultiplier() {
        return [0.85, 1, 1.25][state?.settings?.sessionLoad] || 1;
      }

      function problemDepth() {
        return clamp(Number(state?.settings?.problemDepth) || 2, 1, 3);
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
          if (["__proto__", "prototype", "constructor"].includes(key)) return;
          if (saved[key] && typeof saved[key] === "object" && !Array.isArray(saved[key]) && output[key]) {
            output[key] = deepMerge(output[key], saved[key]);
          } else {
            output[key] = saved[key];
          }
        });
        return output;
      }

      function sanitizeHistoryEntry(entry) {
        if (!entry || !moduleInfo[entry.module]) return null;
        return {
          module: entry.module,
          label: safeString(entry.label, "Session", 160),
          xp: Math.round(finiteNumber(entry.xp, 0, 0, 100000)),
          success: Math.round(finiteNumber(entry.success, 0, 0, 100)),
          difficulty: Math.round(finiteNumber(entry.difficulty, 1, 1, 10)),
          previousDifficulty: Math.round(finiteNumber(entry.previousDifficulty, 1, 1, 10)),
          time: safeString(entry.time, "", 80)
        };
      }

      function sanitizeLogEntry(entry) {
        if (!entry || typeof entry !== "object") return null;
        return {
          time: safeString(entry.time, new Date().toLocaleString(), 80),
          kind: safeString(entry.kind, "event", 36),
          message: safeString(entry.message, "Training event", 180),
          detail: safeString(entry.detail, "", 220)
        };
      }

      function inferModuleFromText(value) {
        const text = String(value || "").toLowerCase();
        const hints = {
          rrt: ["rrt", "relational", "raven", "matrix", "matrices", "transitive", "relation", "analogy"],
          aim: ["aim", "target", "reaction", "mouse", "click"],
          questions: ["quiz", "logic", "question", "math", "sequence", "deduction"],
          memory: ["memory", "nback", "n-back", "dual", "working memory"],
          focus: ["focus", "stroop", "attention", "inhibition", "switch"],
          creativity: ["creative", "divergent", "idea", "fluency"],
          analogy: ["transfer", "mapping", "analogical"],
          spatial: ["spatial", "rotation", "coordinate", "mental rotation"],
          calibration: ["calibration", "confidence", "metacognition"],
          systems: ["systems", "causal", "bayes", "bayesian", "proof", "schedule"]
        };
        const direct = moduleKeyFromInput(text.trim());
        if (direct) return direct;
        return Object.keys(hints).find((key) => hints[key].some((hint) => text.includes(hint))) || "questions";
      }

      function sanitizePortedEntry(entry) {
        if (!entry || typeof entry !== "object") return null;
        const module = moduleInfo[entry.module] ? entry.module : inferModuleFromText([entry.module, entry.source, entry.label, entry.type].join(" "));
        return {
          module,
          source: safeString(entry.source, "external", 80),
          label: safeString(entry.label, moduleInfo[module].label, 120),
          score: finiteNumber(entry.score, 0, 0, 1),
          difficulty: Math.round(finiteNumber(entry.difficulty, 0, 0, 10)),
          time: safeString(entry.time, "", 80),
          type: safeString(entry.type, "import", 50)
        };
      }

      function rebuildPortedSummary(entries) {
        return entries.reduce((summary, entry) => {
          if (!summary[entry.module]) {
            summary[entry.module] = { count: 0, avgScore: 0, avgDifficulty: 0, lastSource: "" };
          }
          const item = summary[entry.module];
          item.count += 1;
          item.avgScore += entry.score;
          item.avgDifficulty += entry.difficulty || 0;
          item.lastSource = entry.source;
          return summary;
        }, {});
      }

      function finalizePortedSummary(summary) {
        Object.keys(summary).forEach((key) => {
          const item = summary[key];
          item.avgScore = item.count ? item.avgScore / item.count : 0;
          item.avgDifficulty = item.count ? item.avgDifficulty / item.count : 0;
        });
        return summary;
      }

      function sanitizePortedData(ported) {
        const entries = Array.isArray(ported?.entries)
          ? ported.entries.map(sanitizePortedEntry).filter(Boolean).slice(0, 500)
          : [];
        return {
          updatedAt: safeString(ported?.updatedAt, "", 80),
          entries,
          summary: finalizePortedSummary(rebuildPortedSummary(entries))
        };
      }

      function sanitizeState(nextState) {
        nextState.xp = Math.round(finiteNumber(nextState.xp, 0, 0, 10000000));
        nextState.sessions = Math.round(finiteNumber(nextState.sessions, 0, 0, 1000000));
        nextState.streak = Math.round(finiteNumber(nextState.streak, 1, 1, 100000));
        nextState.quests = nextState.quests && typeof nextState.quests === "object" ? nextState.quests : {};
        nextState.settings = sanitizeSettings(nextState.settings);
        nextState.modules = nextState.modules && typeof nextState.modules === "object" ? nextState.modules : {};
        Object.keys(moduleInfo).forEach((key) => {
          nextState.modules[key] = sanitizeModule(key, nextState.modules[key]);
        });
        nextState.history = Array.isArray(nextState.history)
          ? nextState.history.map(sanitizeHistoryEntry).filter(Boolean).slice(0, 24)
          : [];
        nextState.eventLog = Array.isArray(nextState.eventLog)
          ? nextState.eventLog.map(sanitizeLogEntry).filter(Boolean).slice(0, 120)
          : [];
        nextState.ported = sanitizePortedData(nextState.ported);
        return nextState;
      }

      function sanitizeSettings(settings) {
        const merged = deepMerge(defaultState.settings, settings && typeof settings === "object" ? settings : {});
        return {
          sfx: booleanValue(merged.sfx, defaultState.settings.sfx),
          volume: finiteNumber(merged.volume, defaultState.settings.volume, 0, 1),
          customCursor: booleanValue(merged.customCursor, defaultState.settings.customCursor),
          lowMotion: booleanValue(merged.lowMotion, defaultState.settings.lowMotion),
          adaptive: booleanValue(merged.adaptive, defaultState.settings.adaptive),
          usePortedData: booleanValue(merged.usePortedData, defaultState.settings.usePortedData),
          density: Math.round(finiteNumber(merged.density, defaultState.settings.density, 0, 2)),
          hardMode: booleanValue(merged.hardMode, defaultState.settings.hardMode),
          problemDepth: Math.round(finiteNumber(merged.problemDepth, defaultState.settings.problemDepth, 1, 3)),
          sessionLoad: Math.round(finiteNumber(merged.sessionLoad, defaultState.settings.sessionLoad, 0, 2)),
          vfx: Math.round(finiteNumber(merged.vfx, defaultState.settings.vfx, 0, 3)),
          theme: ["classic", "matrix", "neon", "contrast"].includes(merged.theme) ? merged.theme : defaultState.settings.theme
        };
      }

      function sanitizeModule(key, module) {
        const merged = deepMerge(defaultState.modules[key], module && typeof module === "object" ? module : {});
        merged.difficulty = Math.round(finiteNumber(merged.difficulty, defaultState.modules[key].difficulty, 1, 10));
        merged.xp = Math.round(finiteNumber(merged.xp, 0, 0, 10000000));
        merged.sessions = Math.round(finiteNumber(merged.sessions, 0, 0, 1000000));
        merged.best = Math.round(finiteNumber(merged.best, 0, 0, 100));
        merged.mastery = finiteNumber(merged.mastery, 0, 0, 100);
        merged.recent = Array.isArray(merged.recent)
          ? merged.recent.map((value) => finiteNumber(value, 0, 0, 1)).slice(-8)
          : [];
        merged.lastNote = safeString(merged.lastNote, "Ready", 160);
        if (key === "systems") {
          merged.mode = ["mixed", "causal", "bayes", "proof", "schedule"].includes(merged.mode) ? merged.mode : "mixed";
        }
        if (key === "rrt") {
          merged.mode = ["evidence", "frames", "transitive", "analogy", "matrix"].includes(merged.mode) ? merged.mode : "evidence";
        }
        return merged;
      }

      function loadState() {
        let saved = null;
        try {
          saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        } catch {
          saved = null;
        }
        const loaded = sanitizeState(deepMerge(defaultState, saved));
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
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeState(deepMerge(defaultState, state))));
        } catch (error) {
          console.warn("Could not save local progress", error);
          showToast("Local save blocked or full");
        }
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

      function progressionSnapshot() {
        const modules = Object.keys(moduleInfo).map((key) => state.modules[key]);
        const level = levelFromXp(state.xp);
        const avgDifficulty = modules.reduce((sum, module) => sum + module.difficulty, 0) / modules.length;
        const avgBest = modules.reduce((sum, module) => sum + module.best, 0) / modules.length;
        const avgMastery = modules.reduce((sum, module) => sum + (module.mastery || 0), 0) / modules.length;
        const consistency = clamp(state.sessions / 42, 0, 1) * 100;
        const mastery = clamp(avgBest * 0.34 + avgDifficulty * 5.2 + avgMastery * 0.28 + consistency * 0.18, 0, 100);
        const trainingPower = Math.round(state.xp * 0.12 + mastery * 18 + state.streak * 20 + avgDifficulty * 35);
        const rank = rankForMastery(mastery, level);
        state.progression.mastery = Math.round(mastery);
        state.progression.trainingPower = trainingPower;
        state.progression.peakRank = rank;
        return { rank, mastery: Math.round(mastery), trainingPower, avgDifficulty };
      }

      function rankForMastery(mastery, level) {
        if (mastery >= 92 && level >= 12) return "Architect";
        if (mastery >= 82 && level >= 9) return "Strategist";
        if (mastery >= 70 && level >= 7) return "Specialist";
        if (mastery >= 56 && level >= 5) return "Operator";
        if (mastery >= 38 && level >= 3) return "Apprentice";
        return "Novice";
      }

      function memoryUnlockForDifficulty(difficulty) {
        return "quad";
      }

      function modeUnlocked(mode) {
        return Boolean(memoryModes[mode]);
      }

      function showToast(message) {
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.textContent = message;
        toastLayer.appendChild(toast);
        window.setTimeout(() => toast.remove(), 2800);
      }

      function safe(label, handler) {
        return (...args) => {
          try {
            return handler(...args);
          } catch (error) {
            console.error(`${label} failed`, error);
            showToast(`${label} failed safely`);
            playSfx("wrong");
            return undefined;
          }
        };
      }

      function on(target, event, handler, label = event) {
        if (!target) {
          console.warn(`Missing event target for ${label}`);
          return;
        }
        target.addEventListener(event, safe(label, handler));
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

      function playSfx(type, options = {}) {
        if (!options.skipVfx) triggerVfx(type, options.origin || {});
        if (!state.settings.sfx) return;
        armAudio();
        if (!audio.ctx) return;
        const ctx = audio.ctx;
        const volume = clamp(state.settings.volume, 0, 1);
        const now = ctx.currentTime;
        const master = makeSfxBus(ctx, now, volume);

        const fx = {
          hit: () => {
            tone(ctx, master, 880, now, 0.09, { type: "square", gain: 0.42, to: 1480 });
            tone(ctx, master, 1760, now + 0.018, 0.07, { type: "triangle", gain: 0.2 });
            noise(ctx, master, now, 0.055, { gain: 0.18, filter: "highpass", frequency: 2400 });
          },
          correct: () => {
            arpeggio(ctx, master, [523.25, 659.25, 783.99, 1046.5], now, 0.045, { type: "triangle", gain: 0.28 });
            tone(ctx, master, 1318.5, now + 0.14, 0.16, { type: "sine", gain: 0.12 });
          },
          wrong: () => {
            tone(ctx, master, 185, now, 0.22, { type: "sawtooth", gain: 0.3, to: 92 });
            tone(ctx, master, 70, now, 0.16, { type: "triangle", gain: 0.2 });
            noise(ctx, master, now + 0.018, 0.13, { gain: 0.2, filter: "lowpass", frequency: 420 });
          },
          complete: () => {
            arpeggio(ctx, master, [392, 523.25, 659.25, 783.99, 1046.5], now, 0.06, { type: "triangle", gain: 0.28 });
            tone(ctx, master, 196, now, 0.42, { type: "sine", gain: 0.13 });
            noise(ctx, master, now + 0.22, 0.12, { gain: 0.08, filter: "highpass", frequency: 1600 });
          },
          level: () => {
            arpeggio(ctx, master, [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5], now, 0.055, { type: "square", gain: 0.24 });
            tone(ctx, master, 130.81, now, 0.55, { type: "triangle", gain: 0.16 });
            tone(ctx, master, 1567.98, now + 0.34, 0.24, { type: "sine", gain: 0.1 });
          },
          combo: () => {
            arpeggio(ctx, master, [659.25, 880, 1174.66, 1760], now, 0.032, { type: "square", gain: 0.24, duration: 0.09 });
            noise(ctx, master, now + 0.08, 0.08, { gain: 0.08, filter: "highpass", frequency: 2600 });
          },
          tick: () => {
            tone(ctx, master, 1046.5, now, 0.045, { type: "square", gain: 0.18 });
            noise(ctx, master, now, 0.025, { gain: 0.07, filter: "highpass", frequency: 3000 });
          },
          start: () => {
            tone(ctx, master, 196, now, 0.11, { type: "triangle", gain: 0.2, to: 392 });
            tone(ctx, master, 392, now + 0.08, 0.13, { type: "square", gain: 0.18, to: 784 });
            noise(ctx, master, now + 0.02, 0.12, { gain: 0.09, filter: "bandpass", frequency: 900 });
          },
          select: () => {
            tone(ctx, master, 740, now, 0.045, { type: "triangle", gain: 0.14, to: 920 });
          },
          prompt: () => {
            arpeggio(ctx, master, [587.33, 739.99, 880], now, 0.035, { type: "triangle", gain: 0.16 });
          }
        };

        (fx[type] || fx.hit)();
      }

      function makeSfxBus(ctx, now, volume) {
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-18, now);
        compressor.knee.setValueAtTime(24, now);
        compressor.ratio.setValueAtTime(6, now);
        compressor.attack.setValueAtTime(0.003, now);
        compressor.release.setValueAtTime(0.14, now);

        const master = ctx.createGain();
        master.gain.setValueAtTime(clamp(volume, 0, 1) * 0.55 + 0.0001, now);
        master.connect(compressor);
        compressor.connect(ctx.destination);
        return master;
      }

      function tone(ctx, output, frequency, start, duration, options = {}) {
        const osc = ctx.createOscillator();
        const amp = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        const end = start + duration;
        osc.type = options.type || "triangle";
        osc.frequency.setValueAtTime(Math.max(20, frequency), start);
        if (options.to) {
          osc.frequency.exponentialRampToValueAtTime(Math.max(20, options.to), end - 0.006);
        }
        if (options.detune) {
          osc.detune.setValueAtTime(options.detune, start);
        }
        filter.type = options.filter || "lowpass";
        filter.frequency.setValueAtTime(options.frequency || 6200, start);
        filter.Q.setValueAtTime(options.q || 0.8, start);
        amp.gain.setValueAtTime(0.0001, start);
        amp.gain.exponentialRampToValueAtTime((options.gain || 0.2) + 0.0001, start + 0.008);
        amp.gain.exponentialRampToValueAtTime(0.0001, end);
        osc.connect(filter);
        filter.connect(amp);
        amp.connect(output);
        osc.start(start);
        osc.stop(end + 0.02);
      }

      function arpeggio(ctx, output, notes, start, step, options = {}) {
        notes.forEach((note, index) => {
          tone(ctx, output, note, start + index * step, options.duration || 0.12, {
            type: options.type || "triangle",
            gain: options.gain || 0.18,
            filter: "lowpass",
            frequency: options.frequency || 7200
          });
        });
      }

      function noise(ctx, output, start, duration, options = {}) {
        const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i += 1) {
          data[i] = (Math.random() * 2 - 1) * (1 - i / length);
        }
        const source = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const amp = ctx.createGain();
        source.buffer = buffer;
        filter.type = options.filter || "highpass";
        filter.frequency.setValueAtTime(options.frequency || 1200, start);
        filter.Q.setValueAtTime(options.q || 0.7, start);
        amp.gain.setValueAtTime(0.0001, start);
        amp.gain.exponentialRampToValueAtTime((options.gain || 0.1) + 0.0001, start + 0.006);
        amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        source.connect(filter);
        filter.connect(amp);
        amp.connect(output);
        source.start(start);
        source.stop(start + duration + 0.02);
      }

      function setupVfx() {
        vfx.canvas = $("#vfxCanvas");
        if (!vfx.canvas) return;
        vfx.ctx = vfx.canvas.getContext("2d");
        resizeVfx();
        window.addEventListener("resize", resizeVfx);
      }

      function resizeVfx() {
        if (!vfx.canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        vfx.canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
        vfx.canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
        vfx.canvas.style.width = `${window.innerWidth}px`;
        vfx.canvas.style.height = `${window.innerHeight}px`;
        if (vfx.ctx) vfx.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      function triggerVfx(type, origin = {}) {
        const intensity = state?.settings?.vfx || 0;
        if (!intensity || state?.settings?.lowMotion || !vfx.ctx) return;
        const palette = {
          hit: "green",
          correct: "blue",
          wrong: "red",
          complete: "yellow",
          level: "violet",
          combo: "yellow",
          start: "blue",
          tick: "green",
          select: "blue",
          prompt: "violet"
        };
        const countBase = { wrong: 12, tick: 5, select: 4, hit: 14, correct: 20, complete: 42, level: 68, combo: 48, start: 20, prompt: 18 }[type] || 12;
        const count = Math.round(countBase * intensity * 0.75);
        const x = origin.x ?? window.innerWidth * (0.34 + Math.random() * 0.32);
        const y = origin.y ?? window.innerHeight * (0.28 + Math.random() * 0.38);
        burstVfx(x, y, count, palette[type] || "green", type);
        if (["wrong", "complete", "level", "combo"].includes(type)) flashVfx(type);
        if (intensity >= 3 && ["wrong", "level", "combo"].includes(type)) shakeScreen();
        startVfxLoop();
      }

      function elementCenter(element) {
        if (!element || typeof element.getBoundingClientRect !== "function") return {};
        const rect = element.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
      }

      function burstVfx(x, y, count, colorName, type) {
        const colorMap = vfxColors();
        for (let i = 0; i < count; i += 1) {
          const angle = Math.random() * Math.PI * 2;
          const speed = (1.2 + Math.random() * 5.5) * (type === "level" ? 1.3 : 1);
          vfx.particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - (type === "complete" ? 1.5 : 0),
            life: 38 + Math.random() * 42,
            age: 0,
            size: 2 + Math.random() * (type === "level" ? 6 : 4),
            color: colorMap[colorName] || colorMap.green,
            shape: Math.random() > 0.72 ? "ring" : "spark"
          });
        }
        vfx.particles = vfx.particles.slice(-520);
      }

      function vfxColors() {
        const key = `${state.settings.theme}|${state.settings.vfx}`;
        if (vfx.colors && vfx.colorTheme === key) return vfx.colors;
        vfx.colorTheme = key;
        vfx.colors = {
          green: cssVar("--green"),
          blue: cssVar("--blue"),
          yellow: cssVar("--yellow"),
          red: cssVar("--red"),
          violet: cssVar("--violet")
        };
        return vfx.colors;
      }

      function cssVar(name) {
        if (typeof getComputedStyle !== "function") return "rgb(145, 245, 163)";
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "rgb(145, 245, 163)";
      }

      function flashVfx(type) {
        const flash = $("#screenFlash");
        if (!flash) return;
        flash.style.background = type === "wrong"
          ? "radial-gradient(circle at 50% 50%, rgba(255,116,116,0.24), transparent 36%)"
          : "radial-gradient(circle at 50% 50%, rgba(145,245,163,0.26), transparent 34%), linear-gradient(135deg, rgba(125,181,255,0.14), transparent 52%)";
        flash.classList.remove("is-live");
        void flash.offsetWidth;
        flash.classList.add("is-live");
      }

      function shakeScreen() {
        document.body.classList.remove("screen-shake");
        void document.body.offsetWidth;
        document.body.classList.add("screen-shake");
      }

      function animateVfx() {
        if (!vfx.running || !vfx.ctx) return;
        const ctx = vfx.ctx;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        vfx.particles = vfx.particles.filter((particle) => {
          particle.age += 1;
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.08;
          particle.vx *= 0.985;
          particle.vy *= 0.985;
          const alpha = clamp(1 - particle.age / particle.life, 0, 1);
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = particle.color;
          ctx.fillStyle = particle.color;
          ctx.lineWidth = 1.5;
          if (particle.shape === "ring") {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * (1 + particle.age / 24), 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
          }
          return particle.age < particle.life;
        });
        ctx.globalAlpha = 1;
        if (vfx.particles.length) {
          vfx.frame = window.requestAnimationFrame(animateVfx);
        } else {
          vfx.running = false;
          vfx.frame = 0;
        }
      }

      function startVfxLoop() {
        if (vfx.running || !vfx.ctx || !vfx.particles.length) return;
        vfx.running = true;
        vfx.frame = window.requestAnimationFrame(animateVfx);
      }

      function applySettings() {
        document.body.classList.toggle("cursor-on", state.settings.customCursor);
        document.body.classList.toggle("motion-low", state.settings.lowMotion);
        document.body.dataset.density = String(state.settings.density);
        document.body.dataset.theme = state.settings.theme || "classic";
        document.body.dataset.view = currentView;
        document.documentElement.style.setProperty("--density", state.settings.density);
        $("#settingSfx").checked = state.settings.sfx;
        $("#settingCursor").checked = state.settings.customCursor;
        $("#settingMotion").checked = state.settings.lowMotion;
        $("#settingAdaptive").checked = state.settings.adaptive;
        $("#settingUsePortedData").checked = state.settings.usePortedData;
        $("#settingHardMode").checked = state.settings.hardMode;
        $("#settingVolume").value = Math.round(state.settings.volume * 100);
        $("#volumeLabel").textContent = `${Math.round(state.settings.volume * 100)}%`;
        $("#settingTheme").value = state.settings.density;
        $("#densityLabel").textContent = ["compact", "standard", "spacious"][state.settings.density] || "standard";
        $("#settingProblemDepth").value = state.settings.problemDepth;
        $("#problemDepthLabel").textContent = ["", "focused", "deep", "extreme"][state.settings.problemDepth] || "deep";
        $("#settingSessionLoad").value = state.settings.sessionLoad;
        $("#sessionLoadLabel").textContent = ["short", "standard", "heavy"][state.settings.sessionLoad] || "standard";
        $("#settingVfx").value = state.settings.vfx;
        $("#vfxLabel").textContent = ["off", "low", "arcade", "max"][state.settings.vfx] || "arcade";
        $("#settingThemeMode").value = state.settings.theme || "classic";
        $("#themeModeLabel").textContent = state.settings.theme || "classic";
        $("#quickProgramSelect").value = state.settings.hardMode ? "hard" : "normal";
        $("#quickVfxSelect").value = String(state.settings.vfx);
        $("#quickJumpSelect").value = currentView;
        $("#terminalThemeSelect").value = state.settings.theme || "classic";
        $("#terminalVfxSelect").value = String(state.settings.vfx);
        $("#terminalModuleSelect").value = $("#terminalModuleSelect").value || "aim";
        $("#terminalDensitySelect").value = String(state.settings.density);
        $("#terminalDepthSelect").value = String(state.settings.problemDepth);
        $("#terminalLoadSelect").value = String(state.settings.sessionLoad);
        $("#terminalVolumeSelect").value = String(Math.round(state.settings.volume * 100));
        $("#terminalAdaptiveToggle").checked = state.settings.adaptive;
        $("#terminalUsePortedToggle").checked = state.settings.usePortedData;
        $("#terminalSfxToggle").checked = state.settings.sfx;
        $("#terminalCursorToggle").checked = state.settings.customCursor;
      }

      function saveSettingsFromForm() {
        state.settings.sfx = $("#settingSfx").checked;
        state.settings.customCursor = $("#settingCursor").checked;
        state.settings.lowMotion = $("#settingMotion").checked;
        state.settings.adaptive = $("#settingAdaptive").checked;
        state.settings.usePortedData = $("#settingUsePortedData").checked;
        state.settings.hardMode = $("#settingHardMode").checked;
        state.settings.volume = Number($("#settingVolume").value) / 100;
        state.settings.density = Number($("#settingTheme").value);
        state.settings.problemDepth = Number($("#settingProblemDepth").value);
        state.settings.sessionLoad = Number($("#settingSessionLoad").value);
        state.settings.vfx = Number($("#settingVfx").value);
        state.settings.theme = $("#settingThemeMode").value;
        applySettings();
        renderAll();
        saveState();
        playSfx("complete");
        showToast("Settings saved");
      }

      function setView(view) {
        const previousView = currentView;
        currentView = view;
        document.body.classList.remove("view-shift");
        void document.body.offsetWidth;
        document.body.classList.add("view-shift");
        window.clearTimeout(setView.transitionTimer);
        setView.transitionTimer = window.setTimeout(() => document.body.classList.remove("view-shift"), 560);
        $$(".view").forEach((panel) => panel.classList.remove("is-active"));
        const nextPanel = $(`#view-${view}`);
        if (!nextPanel) {
          showToast(`Unknown view: ${view}`);
          currentView = previousView;
          document.body.classList.remove("view-shift");
          return;
        }
        nextPanel.classList.add("is-active");
        document.body.dataset.view = view;
        $$(".nav-btn").forEach((button) => button.classList.toggle("is-active", button.dataset.view === view));
        if (previousView !== view) playSfx("select");
        const titles = {
          dashboard: ["Dashboard", "Choose a module, complete reps, and let the app adjust."],
          aim: ["Aim Trainer", "Click targets. The next round adapts to your accuracy."],
          questions: ["Question Gym", "Generated questions scale with your quiz results."],
          memory: ["Memory Lab", "Train updating by matching symbols and positions from N steps back."],
          focus: ["Focus Switch", "Answer ink color under word-color conflict."],
          creativity: ["Creative Sprint", "Train divergent output with timed prompts and constraints."],
          analogy: ["Transfer Lab", "Practice analogical transfer from distant domains."],
          spatial: ["Spatial Lab", "Track coordinates through chained rotations, mirrors, and shifts."],
          calibration: ["Calibration Lab", "Answer evidence questions and score how well your confidence matches accuracy."],
          systems: ["Systems Lab", "Solve causal, Bayesian, proof-chain, and scheduling problems."],
          rrt: ["RRT Lab", "Train relational frames, transitive inference, analogies, and matrix rules."],
          progress: ["Progress", "Review sessions, difficulty changes, and module growth."],
          research: ["Research", "See the evidence and the objective scoring model."],
          faq: ["FAQ", "Privacy, evidence caveats, terminal commands, and training mechanics."],
          settings: ["Settings", "Tune sound, cursor, motion, adaptive behavior, and training load."],
          terminal: ["Terminal", "Use commands to tune, launch, and inspect your training program."]
        };
        $("#viewTitle").textContent = titles[view][0];
        $("#viewSubtitle").textContent = titles[view][1];
        if ($("#quickJumpSelect")) $("#quickJumpSelect").value = view;
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
        if (!module.sessions && portedSuggestedDifficulty(key)) return "Ported";
        if (!module.sessions) return "Start";
        if (avg >= 0.82) return "Rising";
        if (avg < 0.45) return "Easing";
        return "Stable";
      }

      function logEvent(kind, message, detail = "") {
        state.eventLog = Array.isArray(state.eventLog) ? state.eventLog : [];
        state.eventLog.unshift(sanitizeLogEntry({
          time: new Date().toLocaleString(),
          kind,
          message,
          detail: typeof detail === "string" ? detail : JSON.stringify(detail)
        }));
        state.eventLog = state.eventLog.filter(Boolean).slice(0, 120);
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
        module.mastery = clamp((module.mastery || 0) * 0.84 + success * 100 * 0.16 + module.difficulty * 0.85, 0, 100);

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
        state.history.unshift(sanitizeHistoryEntry({
          module: key,
          label: result.label,
          xp,
          success: Math.round(success * 100),
          difficulty: module.difficulty,
          previousDifficulty: oldDifficulty,
          time: new Date().toLocaleString()
        }));
        state.history = state.history.filter(Boolean).slice(0, 24);
        logEvent("session", `${moduleInfo[key].label}: ${Math.round(success * 100)}%, +${xp} XP`, `d${oldDifficulty}->d${module.difficulty}; ${safeString(result.label, "", 120)}`);
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
        renderSpatialStats();
        renderCalibrationStats();
        renderSystemsStats();
        renderRrtStats();
        renderTerminalStatus();
        renderProgress();
        applySettings();
      }

      function renderHeader() {
        const level = levelProgress(state.xp);
        const progression = progressionSnapshot();
        $("#sideLevel").textContent = level.level;
        $("#topLevel").textContent = level.level;
        $("#dashLevel").textContent = level.level;
        $("#dashRank").textContent = progression.rank;
        $("#dashMastery").textContent = `${progression.mastery}%`;
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
          if (nav) nav.textContent = `d${moduleDifficulty(key)}`;
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
              <span class="module-icon">${escapeHtml(info.code)}</span>
              <span class="module-status">${state.quests[key] ? "done today" : "open quest"}</span>
            </div>
            <div class="module-meta">
              <span>${escapeHtml(info.skill)}</span>
              <span>d${moduleDifficulty(key)} - ${escapeHtml(difficultyNote(key))}</span>
            </div>
            <h3>${escapeHtml(info.label)}</h3>
            <p>${escapeHtml(info.description)}</p>
            <div class="bar" aria-hidden="true"><span style="width: ${clamp(module.xp / 900 * 100, 4, 100)}%"></span></div>
            <div class="mini-line" style="margin-top: 10px;">
              <span>${module.xp} XP</span>
              <span>${Math.round(module.mastery || 0)} mastery</span>
            </div>
          `;
          const button = document.createElement("button");
          button.className = "btn small";
          button.type = "button";
          button.textContent = "Open module";
          on(button, "click", () => setView(info.view), `open module ${key}`);
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
            <div><strong>${escapeHtml(info.short)}</strong><span>${escapeHtml(info.quest)}</span></div>
            <span>${state.quests[key] ? "done" : `d${moduleDifficulty(key)}`}</span>
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
            <div class="skill-label"><span>${escapeHtml(moduleInfo[key].skill)}</span><span>${module.xp} XP</span></div>
            <div class="bar"><span style="width: ${clamp(module.xp / 1200 * 100, 2, 100)}%"></span></div>
          `;
          skillBars.appendChild(row);
        });
      }

      function aimConfig() {
        const d = moduleDifficulty("aim");
        const load = sessionLoadMultiplier();
        return {
          duration: Math.round((18 + d * 1.5) * load),
          targetSize: clamp(74 - d * 5.5, 26, 74),
          targetLife: clamp(1320 - d * 95, 460, 1320),
          goal: Math.round((10 + d * 3) * load)
        };
      }

      function renderAimConfig() {
        const config = aimConfig();
        $("#aimDifficulty").textContent = moduleDifficulty("aim");
        $("#aimTargetSize").textContent = `${config.targetSize}px`;
        $("#aimTargetLife").textContent = `${config.targetLife}ms`;
        $("#aimRoundGoal").textContent = `${config.goal} hits`;
        $("#aimAdaptiveNote").textContent = state.modules.aim.lastNote;
        $("#aimGoal").textContent = config.goal;
      }

      function startAimRound() {
        if (aimRound.active) return;
        const config = aimConfig();
        playSfx("start");
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
          playSfx("wrong");
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
        playSfx(aimRound.streak > 0 && aimRound.streak % 5 === 0 ? "combo" : "hit", { origin: { x: event.clientX, y: event.clientY } });
        updateAimHud();
        moveTarget();
      }

      function missTarget(event) {
        if (!aimRound.active) return;
        if (event.target !== $("#aimStage") && event.target !== $("#fieldCanvas")) return;
        aimRound.misses += 1;
        aimRound.streak = 0;
        showPop(event.clientX, event.clientY, "miss");
        playSfx("wrong", { origin: { x: event.clientX, y: event.clientY } });
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

      function answerOptions(question) {
        const answer = String(question.answer);
        const seen = new Set();
        const options = [answer, ...(question.options || []).map(String)].filter((option) => {
          const key = option.trim().toLowerCase();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        return shuffle(options);
      }

      function generateQuestion() {
        const d = moduleDifficulty("questions") + problemDepth() - 1;
        const core = [makeMathQuestion, makeSequenceQuestion, makeAnalogyQuestion, makeRuleQuestion, makeLogicQuestion, makeClassificationQuestion, makeWorkingRuleQuestion];
        const advanced = [makeCaseReasoningQuestion, makeEvidenceWeighingQuestion, makeConstraintOptimizationQuestion, makeArgumentFlawQuestion, makeBayesianQuestion, makeCausalGraphQuestion, makeProofChainQuestion, makeScheduleOptimizerQuestion, makeMatrixReasoningQuestion, makeStudyDesignQuestion, makeFermiQuestion];
        const generators = problemDepth() >= 2 ? [...core, ...advanced, ...advanced] : [...core, ...advanced];
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
          options: numberOptions(answer, 8 + d * 4),
          explanation: useMultiply ? `Use order of operations: multiply ${b} x ${c}, then add ${a}.` : `Multiply ${a} x ${b}, then subtract ${c}.`
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
          options: numberOptions(answer, 10 + d * 4),
          explanation: growth ? `The step grows by ${growth} each time.` : `Add ${step} each time.`
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
          options: shuffle(set[4]),
          explanation: `Match the relation from ${set[0]} -> ${set[1]}, then apply it to ${set[2]}.`
        };
      }

      function makeRuleQuestion(d) {
        const n = Math.floor(Math.random() * (10 + d * 3)) + 4;
        const answer = n % 2 === 0 ? n / 2 + d : n * 2 - d;
        return {
          type: "rule switch",
          text: `Rule: if the number is even, halve it then add ${d}. If odd, double it then subtract ${d}. Input: ${n}.`,
          answer: String(answer),
          options: numberOptions(answer, 9 + d * 3),
          explanation: n % 2 === 0 ? `${n} is even, so ${n} / 2 + ${d}.` : `${n} is odd, so ${n} x 2 - ${d}.`
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
          options: shuffle(names),
          explanation: `${order[0].name} has the highest listed score.`
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
          options: shuffle(set[2]),
          explanation: `All examples belong to the ${set[1]} category.`
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
          options: shuffle(letters.slice(0, 4).includes(answer) ? letters.slice(0, 4) : [answer, ...letters.slice(0, 3)]),
          explanation: `Count ${shift} spaces after the first item in the displayed order.`
        };
      }

      function makeCaseReasoningQuestion(d) {
        const drills = shuffle([
          { name: "retrieval ladder", hours: 2 + Math.floor(d / 4), gain: 18 + d * 2, tag: "memory" },
          { name: "interleaved set", hours: 3, gain: 20 + d * 3, tag: "reasoning" },
          { name: "spatial chain", hours: 2 + Math.floor(d / 5), gain: 16 + d * 3, tag: "spatial" },
          { name: "feedback review", hours: 2, gain: 15 + d * 2, tag: "feedback" },
          { name: "creative constraint", hours: 3 + Math.floor(d / 6), gain: 19 + d * 2, tag: "creativity" }
        ]).slice(0, 4);
        const budget = 5 + Math.floor(d / 3);
        const pairs = [];
        for (let i = 0; i < drills.length; i += 1) {
          for (let j = i + 1; j < drills.length; j += 1) {
            const pair = [drills[i], drills[j]];
            const hours = pair[0].hours + pair[1].hours;
            const score = pair[0].gain + pair[1].gain - (pair[0].tag === pair[1].tag ? 8 : 0);
            pairs.push({ pair, hours, score });
          }
        }
        const valid = pairs.filter((item) => item.hours <= budget);
        const best = (valid.length ? valid : pairs).sort((a, b) => b.score - a.score || a.hours - b.hours)[0];
        const optionPool = shuffle(pairs).slice(0, 4);
        if (!optionPool.some((item) => item === best)) optionPool[0] = best;
        const answer = best.pair.map((item) => item.name).join(" + ");
        const table = drills.map((item) => `${item.name}: ${item.hours}h, +${item.gain} transfer, ${item.tag}`).join("; ");
        return {
          type: "case reasoning",
          text: `You are designing a hard 1-week training block. Pick exactly two drills under a ${budget}h budget. If two drills share the same tag, subtract 8 transfer points because the practice is less interleaved. Drill table: ${table}. Which pair gives the best valid transfer score?`,
          answer,
          options: shuffle(optionPool.map((item) => item.pair.map((drill) => drill.name).join(" + "))),
          explanation: `${answer} fits ${best.hours}h and scores ${best.score}. This rewards interleaving plus explicit constraint checking.`
        };
      }

      function makeEvidenceWeighingQuestion(d) {
        const nA = 42 + d * 9 + Math.floor(Math.random() * 18);
        const nB = 40 + d * 8 + Math.floor(Math.random() * 18);
        const advantage = 0.08 + Math.random() * 0.08;
        const base = 0.54 + Math.random() * 0.08;
        const flip = Math.random() > 0.5;
        const rateA = flip ? base - advantage : base + advantage;
        const rateB = flip ? base + advantage : base - advantage;
        const winsA = Math.round(nA * clamp(rateA, 0.35, 0.86));
        const winsB = Math.round(nB * clamp(rateB, 0.35, 0.86));
        const observedA = winsA / nA;
        const observedB = winsB / nB;
        const winner = observedA > observedB ? "spacing-first" : "blocked-first";
        const answer = `${winner} is better supported, but the evidence is not causal proof`;
        return {
          type: "evidence weighing",
          text: `A training team compares two schedules. Spacing-first: ${winsA}/${nA} users improved. Blocked-first: ${winsB}/${nB} users improved. Assignment was not fully random, but both groups used the same final test. Which conclusion is most defensible?`,
          answer,
          options: shuffle([
            answer,
            "both schedules are proven equal because both groups improved",
            "the smaller raw failure count decides the stronger method",
            "the result proves the schedule will transfer to every skill"
          ]),
          explanation: `Compare proportions, not raw counts: spacing-first ${Math.round(observedA * 100)}%, blocked-first ${Math.round(observedB * 100)}%. The nonrandom assignment limits the claim.`
        };
      }

      function makeConstraintOptimizationQuestion(d) {
        const options = [
          { name: "retrieval", value: 16 + d * 2, fatigue: 3, kind: "memory" },
          { name: "interleave", value: 18 + d * 2, fatigue: 4, kind: "selection" },
          { name: "feedback", value: 14 + d, fatigue: 2, kind: "correction" },
          { name: "spatial", value: 15 + d * 2, fatigue: 3 + Math.floor(d / 5), kind: "visual" },
          { name: "incubation", value: 11 + d, fatigue: 1, kind: "creative" }
        ];
        const fatigueCap = 8 + Math.floor(d / 4);
        const triples = [];
        for (let a = 0; a < options.length; a += 1) {
          for (let b = a + 1; b < options.length; b += 1) {
            for (let c = b + 1; c < options.length; c += 1) {
              const set = [options[a], options[b], options[c]];
              const fatigue = set.reduce((sum, item) => sum + item.fatigue, 0);
              const value = set.reduce((sum, item) => sum + item.value, 0) + new Set(set.map((item) => item.kind)).size * 3;
              triples.push({ set, fatigue, value });
            }
          }
        }
        const valid = triples.filter((item) => item.fatigue <= fatigueCap);
        const best = (valid.length ? valid : triples).sort((a, b) => b.value - a.value || a.fatigue - b.fatigue)[0];
        const answer = best.set.map((item) => item.name).join(" + ");
        const optionPool = shuffle(triples).slice(0, 4);
        if (!optionPool.some((item) => item === best)) optionPool[0] = best;
        return {
          type: "constraint optimization",
          text: `Build a 3-part session. Fatigue cap is ${fatigueCap}. Add +3 bonus points for each distinct practice kind, because mixed practice trains strategy selection. Options: ${options.map((item) => `${item.name} value ${item.value}, fatigue ${item.fatigue}, kind ${item.kind}`).join("; ")}. Which session has the best valid value?`,
          answer,
          options: shuffle(optionPool.map((item) => item.set.map((choice) => choice.name).join(" + "))),
          explanation: `${answer} stays at fatigue ${best.fatigue} and scores ${best.value} after distinct-kind bonuses.`
        };
      }

      function makeArgumentFlawQuestion(d) {
        const cases = [
          {
            text: "A user improved after 3 days of n-back and claims the app permanently raised general intelligence. No control task was used, and sleep also improved that week.",
            answer: "confounds and overgeneralized transfer",
            explanation: "The evidence may reflect sleep, practice effects, or task familiarity; transfer needs stronger comparison."
          },
          {
            text: "A quiz score rose from 40% to 85% on the same ten questions, so the user concludes they can solve any new logic problem.",
            answer: "practice-test memorization mistaken for transfer",
            explanation: "Repeated items can improve recall without proving flexible performance on unseen problems."
          },
          {
            text: "One hard session felt frustrating, so the user concludes the method is ineffective even though delayed testing was never checked.",
            answer: "judging learning by fluency instead of later performance",
            explanation: "Desirable difficulties can feel worse during practice while helping later retention."
          },
          {
            text: "A friend scored higher after using only blocked practice, so the user ignores a larger randomized class study favoring interleaving.",
            answer: "anecdote outweighing stronger base evidence",
            explanation: "A single case is weaker than a larger controlled comparison."
          }
        ];
        const chosen = sample(cases);
        return {
          type: "argument flaw",
          text: `Evaluate the reasoning. ${chosen.text} What is the main flaw?`,
          answer: chosen.answer,
          options: shuffle([
            chosen.answer,
            "the conclusion is definitely false because all training fails",
            "the evidence is too mathematical to interpret",
            d > 6 ? "the claim is correct because high effort always transfers" : "the claim is correct because the user felt progress"
          ]),
          explanation: chosen.explanation
        };
      }

      function makeBayesianQuestion(d) {
        const base = clamp(8 + d * 2, 10, 35);
        const hit = clamp(70 + d * 2, 72, 93);
        const falseAlarm = clamp(24 - d, 6, 22);
        const numerator = base * hit;
        const denominator = numerator + (100 - base) * falseAlarm;
        const posterior = Math.round(numerator / denominator * 100);
        return {
          type: "Bayesian update",
          text: `A detector flags whether a training method is genuinely helping. Before testing, ${base}% of methods are actually useful. The detector flags ${hit}% of useful methods and falsely flags ${falseAlarm}% of useless methods. If a method is flagged, what is the best estimate that it is actually useful?`,
          answer: `${posterior}%`,
          options: numberOptions(posterior, 18).map((item) => `${item}%`),
          explanation: `Use base rates: useful flagged = ${base} x ${hit}; useless flagged = ${100 - base} x ${falseAlarm}. Posterior is useful-flagged divided by all flagged, about ${posterior}%.`
        };
      }

      function makeCausalGraphQuestion(d) {
        const scenarios = [
          {
            graph: "Sleep -> Focus -> Quiz score; Caffeine -> Focus; Caffeine -> Jitter",
            intervention: "increase caffeine while holding sleep constant",
            answer: "Focus may rise, quiz score may rise, and jitter may rise",
            options: ["Sleep must rise first", "Focus may rise, quiz score may rise, and jitter may rise", "Only quiz score changes", "Jitter falls because focus rises"],
            explanation: "An intervention on caffeine travels along outgoing arrows from caffeine, not backward into sleep."
          },
          {
            graph: "Practice -> Accuracy; Practice -> Fatigue; Fatigue -> Accuracy down; Breaks -> Fatigue down",
            intervention: "add breaks without changing practice amount",
            answer: "Fatigue should fall, which can improve accuracy",
            options: ["Practice amount must fall", "Fatigue should fall, which can improve accuracy", "Accuracy cannot change unless practice changes", "Breaks directly erase accuracy"],
            explanation: "Breaks affect fatigue, and fatigue has a negative path into accuracy."
          },
          {
            graph: "Problem difficulty -> Errors; Problem difficulty -> Effort; Effort -> Retention; Feedback -> Error correction",
            intervention: "raise difficulty and add feedback",
            answer: "Errors and effort can rise, while feedback can improve correction",
            options: ["Errors must disappear immediately", "Effort must fall", "Errors and effort can rise, while feedback can improve correction", "Retention cannot change"],
            explanation: "The intervention has two active paths: harder problems raise errors and effort, while feedback improves correction."
          }
        ];
        const chosen = sample(scenarios);
        return {
          type: "causal graph",
          text: `Causal graph: ${chosen.graph}. Intervention: ${chosen.intervention}. Which consequence follows best from the graph?`,
          answer: chosen.answer,
          options: shuffle(chosen.options),
          explanation: chosen.explanation
        };
      }

      function makeProofChainQuestion(d) {
        const symbols = shuffle(["A", "B", "C", "D", "E", "F"]).slice(0, 5);
        const chainLength = clamp(3 + Math.floor(d / 4), 3, 5);
        const rules = [];
        for (let i = 0; i < chainLength; i += 1) {
          rules.push(`${symbols[i]} -> ${symbols[i + 1]}`);
        }
        const answer = symbols[chainLength];
        const distractors = shuffle(symbols.filter((symbol) => symbol !== answer)).slice(0, 3);
        return {
          type: "proof chain",
          text: `Given ${symbols[0]} is true. Rules: ${rules.join("; ")}. If every rule is valid, what is the farthest guaranteed conclusion?`,
          answer,
          options: shuffle([answer, ...distractors]),
          explanation: `Apply each implication in order: ${symbols.slice(0, chainLength + 1).join(" -> ")}.`
        };
      }

      function makeScheduleOptimizerQuestion(d) {
        const tasks = [
          { name: "retrieval", value: 18 + d, minutes: 12, fatigue: 2 },
          { name: "spatial", value: 16 + d * 2, minutes: 14, fatigue: 3 },
          { name: "focus", value: 14 + d, minutes: 9, fatigue: 2 },
          { name: "systems", value: 20 + d * 2, minutes: 18, fatigue: 4 },
          { name: "incubation", value: 13 + d, minutes: 8, fatigue: 1 }
        ];
        const minuteCap = 38 + d;
        const fatigueCap = 7 + Math.floor(d / 4);
        const combos = [];
        for (let a = 0; a < tasks.length; a += 1) {
          for (let b = a + 1; b < tasks.length; b += 1) {
            for (let c = b + 1; c < tasks.length; c += 1) {
              const set = [tasks[a], tasks[b], tasks[c]];
              const minutes = set.reduce((sum, item) => sum + item.minutes, 0);
              const fatigue = set.reduce((sum, item) => sum + item.fatigue, 0);
              const value = set.reduce((sum, item) => sum + item.value, 0);
              combos.push({ set, minutes, fatigue, value });
            }
          }
        }
        const valid = combos.filter((combo) => combo.minutes <= minuteCap && combo.fatigue <= fatigueCap);
        const best = (valid.length ? valid : combos).sort((a, b) => b.value - a.value || a.minutes - b.minutes)[0];
        const answer = best.set.map((item) => item.name).join(" + ");
        const optionPool = shuffle(combos).slice(0, 4);
        if (!optionPool.includes(best)) optionPool[0] = best;
        return {
          type: "schedule optimizer",
          text: `Choose exactly 3 tasks. Limits: ${minuteCap} minutes and fatigue ${fatigueCap}. Tasks: ${tasks.map((item) => `${item.name} ${item.value} value, ${item.minutes}m, fatigue ${item.fatigue}`).join("; ")}. Which schedule has the highest valid value?`,
          answer,
          options: shuffle(optionPool.map((combo) => combo.set.map((item) => item.name).join(" + "))),
          explanation: `${answer} uses ${best.minutes} minutes, fatigue ${best.fatigue}, and value ${best.value}.`
        };
      }

      function makeMatrixReasoningQuestion(d) {
        const rowStep = 2 + Math.floor(d / 4);
        const colStep = 3 + Math.floor(d / 5);
        const start = 4 + Math.floor(Math.random() * 9);
        const grid = [
          [start, start + colStep, start + colStep * 2],
          [start + rowStep, start + rowStep + colStep, start + rowStep + colStep * 2],
          [start + rowStep * 2, start + rowStep * 2 + colStep, "?"]
        ];
        const answer = start + rowStep * 2 + colStep * 2;
        return {
          type: "matrix reasoning",
          text: `Complete the 3x3 matrix. Rows add ${rowStep}; columns add ${colStep}. Matrix: [${grid[0].join(", ")}] / [${grid[1].join(", ")}] / [${grid[2].join(", ")}]. What replaces ?`,
          answer: String(answer),
          options: numberOptions(answer, 12 + d * 2),
          explanation: `Move down two rows: +${rowStep * 2}. Move right two columns: +${colStep * 2}. Final value is ${answer}.`
        };
      }

      function makeStudyDesignQuestion(d) {
        const n = 40 + d * 12;
        const attrition = clamp(4 + Math.floor(d / 2), 5, 18);
        const choices = [
          "random assignment, pre/post tests, delayed transfer test, and attrition reported",
          "only testimonials from users who finished the app",
          "same quiz repeated until scores rise",
          "compare beginners to experts after training without a baseline"
        ];
        return {
          type: "study design",
          text: `You want credible evidence that a new drill transfers beyond the trained task. You can recruit ${n} users, but expect ${attrition}% attrition. Which design is most reputable?`,
          answer: choices[0],
          options: shuffle(choices),
          explanation: "Random assignment, baseline measurement, delayed transfer tests, and attrition reporting reduce common threats to training claims."
        };
      }

      function makeFermiQuestion(d) {
        const days = 5 + Math.floor(d / 3);
        const reps = 18 + d * 2;
        const retention = clamp(0.62 + d * 0.018, 0.64, 0.86);
        const transfer = clamp(0.42 + d * 0.012, 0.44, 0.7);
        const answer = Math.round(days * reps * retention * transfer);
        return {
          type: "fermi estimate",
          text: `Estimate useful transfer reps from a week plan: ${days} practice days, ${reps} scored reps per day, ${Math.round(retention * 100)}% retained after spacing, and ${Math.round(transfer * 100)}% near-transfer usefulness. What is the best estimate?`,
          answer: String(answer),
          options: numberOptions(answer, 18 + d * 3),
          explanation: `Multiply days x reps x retention x transfer: ${days} x ${reps} x ${retention.toFixed(2)} x ${transfer.toFixed(2)} = about ${answer}.`
        };
      }

      function startQuiz() {
        playSfx("start");
        quiz.active = true;
        quiz.answered = 0;
        quiz.correct = 0;
        quiz.target = Math.round((8 + Math.ceil(moduleDifficulty("questions") / 1.5) + problemDepth()) * sessionLoadMultiplier());
        quiz.current = null;
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
        if (quiz.current && !quiz.locked) {
          $("#quizFeedback").textContent = "Answer the current problem before moving on. The score needs real attempts.";
          playSfx("wrong");
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
        answerOptions(quiz.current).forEach((option) => {
          const button = document.createElement("button");
          button.className = "answer-btn";
          button.type = "button";
          button.textContent = option;
          on(button, "click", () => answerQuestion(button, option), "answer question");
          grid.appendChild(button);
        });
      }

      function answerQuestion(button, option) {
        if (!quiz.active || quiz.locked) return;
        quiz.locked = true;
        quiz.answered += 1;
        const correct = option === String(quiz.current.answer);
        if (correct) quiz.correct += 1;
        playSfx(correct ? "correct" : "wrong", { origin: elementCenter(button) });
        $$("#answerGrid .answer-btn").forEach((item) => {
          item.disabled = true;
          if (item.textContent === String(quiz.current.answer)) item.classList.add("is-correct");
        });
        if (!correct) button.classList.add("is-wrong");
        $("#quizFeedback").textContent = correct
          ? `Correct. ${quiz.current.explanation || "Good retrieval."}`
          : `Not quite. Correct answer: ${quiz.current.answer}. ${quiz.current.explanation || ""}`;
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
        const d = moduleDifficulty("questions");
        $("#questionDifficulty").textContent = `difficulty ${d}`;
        $("#questionProgress").textContent = `${quiz.answered}/${quiz.target || 0}`;
        $("#quizCorrect").textContent = quiz.correct;
        $("#quizAsked").textContent = quiz.answered;
        $("#quizTarget").textContent = quiz.target || Math.round((8 + Math.ceil(d / 1.5) + problemDepth()) * sessionLoadMultiplier());
        $("#quizDifficulty").textContent = d;
      }

      function memoryConfig() {
        const d = moduleDifficulty("memory");
        const load = sessionLoadMultiplier();
        const mode = memoryModes[state.modules.memory.mode] ? state.modules.memory.mode : memoryUnlockForDifficulty(d);
        const modeDef = memoryModes[mode];
        return {
          mode,
          modeDef,
          n: clamp(1 + Math.floor(d / 2) + (mode === "quad" ? 1 : 0), 1, 6),
          total: Math.round((14 + d * 3 + modeDef.channels.length) * load),
          interval: clamp(1850 - d * 105 - modeDef.channels.length * 55, 620, 1850),
          grid: modeDef.grid,
          channels: modeDef.channels
        };
      }

      function startMemoryStream() {
        if (memory.active) return;
        const config = memoryConfig();
        playSfx("start");
        memory.active = true;
        memory.n = config.n;
        memory.mode = config.mode;
        memory.total = config.total;
        memory.trial = 0;
        memory.correct = 0;
        memory.channelCorrect = 0;
        memory.channelTotal = 0;
        memory.sequence = [];
        memory.selected = new Set();
        memory.answered = false;
        $("#memoryFeedback").textContent = `Stream running: ${config.modeDef.description}`;
        updateMemoryAnswerButtons();
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
          scoreMemoryMiss();
          playSfx("wrong");
        }
        const config = memoryConfig();
        memory.current = generateMemoryStimulus(config);
        if (memory.trial >= memory.n && Math.random() < 0.56) {
          const back = memory.sequence[memory.sequence.length - memory.n];
          const matchCount = Math.random() < 0.2 ? 2 : 1;
          shuffle(config.channels).slice(0, matchCount).forEach((channel) => {
            if (channel === "symbol") memory.current.displaySymbol = back.displaySymbol;
            if (channel === "position") memory.current.displayPosition = back.displayPosition;
            if (channel === "color") memory.current.color = back.color;
            if (channel === "transform") memory.current.transform = back.transform;
          });
        }
        memory.sequence.push(memory.current);
        memory.trial += 1;
        memory.answered = false;
        memory.selected = new Set();
        playSfx("tick");
        renderMemoryCard();
        renderMemoryStats();
        updateMemoryAnswerButtons();
        memory.timer = window.setTimeout(nextMemoryTrial, memoryConfig().interval);
      }

      function scoreMemoryMiss() {
        const channels = memoryConfig().channels;
        memory.channelTotal += channels.length;
        memory.answered = true;
      }

      function generateMemoryStimulus(config) {
        const symbols = ["A", "K", "M", "R", "S", "T", "Z", "7", "9"];
        const colors = ["green", "blue", "yellow", "red", "violet"];
        const transforms = config.channels.includes("transform") ? ["normal", "mirror", "rotate", "shift"] : ["normal"];
        const rawSymbol = sample(symbols);
        const transform = sample(transforms);
        const rawPosition = Math.floor(Math.random() * config.grid * config.grid);
        return {
          rawSymbol,
          displaySymbol: transformSymbol(rawSymbol, transform),
          rawPosition,
          displayPosition: transformPosition(rawPosition, transform, config.grid),
          color: sample(colors),
          transform,
          grid: config.grid
        };
      }

      function transformSymbol(symbol, transform) {
        const symbols = ["A", "K", "M", "R", "S", "T", "Z", "7", "9"];
        if (transform === "shift") return symbols[(symbols.indexOf(symbol) + 1 + symbols.length) % symbols.length];
        if (transform === "mirror") return `${symbol}<`;
        if (transform === "rotate") return `${symbol}^`;
        return symbol;
      }

      function transformPosition(position, transform, grid) {
        const row = Math.floor(position / grid);
        const col = position % grid;
        if (transform === "mirror") return row * grid + (grid - 1 - col);
        if (transform === "rotate") return col * grid + (grid - 1 - row);
        if (transform === "shift") return ((row + 1) % grid) * grid + col;
        return position;
      }

      function memoryExpected() {
        const config = memoryConfig();
        const expected = { symbol: false, position: false, color: false, transform: false };
        if (memory.sequence.length <= memory.n) return expected;
        const current = memory.current;
        const back = memory.sequence[memory.sequence.length - 1 - memory.n];
        expected.symbol = config.channels.includes("symbol") && current.displaySymbol === back.displaySymbol;
        expected.position = config.channels.includes("position") && current.displayPosition === back.displayPosition;
        expected.color = config.channels.includes("color") && current.color === back.color;
        expected.transform = config.channels.includes("transform") && current.transform === back.transform;
        return expected;
      }

      function answerMemory(kind) {
        if (!memory.active || memory.answered) return;
        if (kind === "none") {
          memory.selected.clear();
          submitMemoryAnswer();
          return;
        }
        if (memory.selected.has(kind)) {
          memory.selected.delete(kind);
        } else {
          memory.selected.add(kind);
        }
        playSfx("select");
        updateMemoryAnswerButtons();
      }

      function updateMemoryAnswerButtons() {
        updateMemoryModeButtons();
      }

      function submitMemoryAnswer() {
        if (!memory.active || memory.answered) return;
        const expected = memoryExpected();
        const channels = memoryConfig().channels;
        const answer = {
          symbol: memory.selected.has("symbol"),
          position: memory.selected.has("position"),
          color: memory.selected.has("color"),
          transform: memory.selected.has("transform")
        };
        const channelCorrect = channels.filter((channel) => expected[channel] === answer[channel]).length;
        const correct = channelCorrect === channels.length;
        memory.channelCorrect += channelCorrect;
        memory.channelTotal += channels.length;
        memory.answered = true;
        if (correct) memory.correct += 1;
        playSfx(correct ? "correct" : "wrong");
        const expectedList = channels.filter((channel) => expected[channel]);
        $("#memoryFeedback").textContent = correct
          ? `Exact channel decision. +${channels.length}/${channels.length}`
          : `Channel score ${channelCorrect}/${channels.length}. Expected: ${expectedList.length ? expectedList.join(", ") : "no match"}.`;
        memory.selected.clear();
        updateMemoryAnswerButtons();
        renderMemoryStats();
      }

      function renderMemoryCard() {
        const config = memoryConfig();
        const grid = $("#memoryGrid");
        const neededCells = config.grid * config.grid;
        grid.dataset.size = config.grid;
        while (grid.children.length < neededCells) {
          grid.appendChild(document.createElement("span"));
        }
        while (grid.children.length > neededCells) {
          grid.lastElementChild.remove();
        }
        const colorMap = {
          green: "var(--green)",
          blue: "var(--blue)",
          yellow: "var(--yellow)",
          red: "var(--red)",
          violet: "var(--violet)"
        };
        $("#memorySymbol").textContent = memory.current ? memory.current.displaySymbol : "?";
        $("#memorySymbol").style.color = memory.current ? colorMap[memory.current.color] : "var(--ink)";
        $("#memoryMeta").textContent = `${config.modeDef.label} / ${config.channels.join(" + ")}`;
        $("#memoryManipulation").textContent = memory.current ? memory.current.transform : "normal";
        $$("#memoryGrid span").forEach((cell, index) => {
          cell.classList.toggle("is-lit", memory.current && index === memory.current.displayPosition);
        });
      }

      function finishMemoryStream() {
        window.clearTimeout(memory.timer);
        const attempted = Math.max(memory.trial, 1);
        const exactRate = memory.correct / attempted;
        const channelRate = memory.channelTotal ? memory.channelCorrect / memory.channelTotal : 0;
        const success = exactRate * 0.62 + channelRate * 0.38;
        const xp = memory.correct * 18 + Math.round(channelRate * 95) + memoryConfig().channels.length * 12;
        memory.active = false;
        $("#memoryFeedback").textContent = `Stream complete: ${memory.correct}/${attempted} exact, ${Math.round(channelRate * 100)}% channel accuracy at ${memory.n}-back.`;
        recordSession("memory", { success, xp, label: `${memory.correct}/${attempted} exact, ${Math.round(channelRate * 100)}% channel` });
      }

      function renderMemoryStats() {
        const config = memoryConfig();
        $("#memoryDifficulty").textContent = moduleDifficulty("memory");
        $("#memoryN").textContent = memory.active ? memory.n : config.n;
        $("#memoryTrial").textContent = `${memory.trial}/${memory.active ? memory.total : config.total}`;
        $("#memoryCorrect").textContent = memory.correct;
        $("#memoryModeLabel").textContent = config.modeDef.label;
        $("#memoryChannels").textContent = config.channels.length;
        $("#memoryTier").textContent = `T${clamp(Math.ceil(moduleDifficulty("memory") / 2), 1, 6)}`;
        $("#memoryLoadScore").textContent = Math.round(config.n * config.channels.length * config.grid);
        $("#memoryUnlock").textContent = "all modes open";
        updateMemoryModeButtons();
      }

      function setMemoryMode(mode) {
        if (!memoryModes[mode]) return;
        state.modules.memory.mode = mode;
        saveState();
        playSfx("select");
        renderMemoryStats();
        renderMemoryCard();
      }

      function updateMemoryModeButtons() {
        $$("[data-memory-mode]").forEach((button) => {
          const unlocked = modeUnlocked(button.dataset.memoryMode);
          button.disabled = memory.active;
          button.classList.toggle("is-active", button.dataset.memoryMode === memoryConfig().mode);
          button.textContent = memoryModes[button.dataset.memoryMode].label;
        });
        $$(".memory-answer").forEach((button) => {
          const channel = button.dataset.memoryAnswer;
          const enabled = memoryConfig().channels.includes(channel);
          button.disabled = !enabled || !memory.active || memory.answered;
          button.classList.toggle("is-selected", memory.selected.has(channel));
        });
        $("#memoryNoMatch").disabled = !memory.active || memory.answered;
        $("#memorySubmit").disabled = !memory.active || memory.answered;
      }

      function focusConfig() {
        const d = moduleDifficulty("focus");
        return {
          total: Math.round((14 + d * 3) * sessionLoadMultiplier()),
          congruentRate: clamp(0.38 - d * 0.034, 0.08, 0.38),
          targetMs: clamp(1150 - d * 72, 480, 1150)
        };
      }

      function startFocusSet() {
        if (focus.active) return;
        const config = focusConfig();
        playSfx("start");
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
        window.clearTimeout(focus.timer);
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
        playSfx("tick");
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
        focus.timer = window.setTimeout(() => {
          if (!focus.active || focus.answered) return;
          focus.answered = true;
          $("#focusFeedback").textContent = `Timeout. Ink color was ${focus.currentColor}.`;
          playSfx("wrong");
          renderFocusStats();
          window.setTimeout(nextFocusTrial, 520);
        }, config.targetMs);
      }

      function answerFocus(color) {
        if (!focus.active || focus.answered) return;
        window.clearTimeout(focus.timer);
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
        window.clearTimeout(focus.timer);
        focus.active = false;
        const attempted = Math.max(focus.trial, 1);
        const accuracy = focus.correct / attempted;
        const avgRt = focus.correct ? focus.reactionTotal / focus.correct : 9999;
        const speedScore = clamp(1 - (avgRt - 450) / 1300, 0, 1);
        const success = accuracy * 0.72 + speedScore * 0.28;
        const xp = focus.correct * 16 + Math.round(speedScore * 65);
        $("#focusFeedback").textContent = `Set complete: ${focus.correct}/${attempted}, avg ${Math.round(avgRt)}ms.`;
        recordSession("focus", { success, xp, label: `${focus.correct}/${attempted}, ${Math.round(avgRt)}ms avg` });
      }

      function renderFocusStats() {
        $("#focusDifficulty").textContent = moduleDifficulty("focus");
        $("#focusTrial").textContent = `${focus.trial}/${focus.active ? focus.total : focusConfig().total}`;
        $("#focusCorrect").textContent = focus.correct;
        const avgRt = focus.correct ? Math.round(focus.reactionTotal / focus.correct) : 0;
        $("#focusRt").textContent = `${avgRt}ms`;
      }

      function creativeConfig() {
        const d = moduleDifficulty("creativity");
        return {
          target: Math.round((8 + d * 3) * sessionLoadMultiplier()),
          seconds: 55 + d * 5,
          constraints: clamp(1 + Math.ceil(d / 2), 2, 6)
        };
      }

      function generateCreativePrompt() {
        const d = moduleDifficulty("creativity");
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
        if (audio.armed) playSfx("prompt");
      }

      function startCreativeSprint() {
        const config = creativeConfig();
        playSfx("start");
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
        $("#creativeDifficulty").textContent = moduleDifficulty("creativity");
        $("#creativeTarget").textContent = config.target;
        $("#creativeCount").textContent = count;
        const remaining = creative.active ? creative.remaining : config.seconds;
        const minutes = Math.floor(remaining / 60).toString().padStart(2, "0");
        const seconds = Math.floor(remaining % 60).toString().padStart(2, "0");
        $("#creativeTimer").textContent = `${minutes}:${seconds}`;
      }

      function generateAnalogyChallenge() {
        const d = moduleDifficulty("analogy");
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
        if (audio.armed) playSfx("prompt");
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
        $("#analogyDifficulty").textContent = moduleDifficulty("analogy");
        $("#analogyFilled").textContent = `${filled}/4`;
        $("#analogyWords").textContent = words;
        $("#analogyStructureScore").textContent = `${Math.round(rubric.structure * 100)}%`;
        $("#analogyMapScore").textContent = `${Math.round(rubric.mapping * 100)}%`;
        $("#analogyTestScore").textContent = `${Math.round(rubric.test * 100)}%`;
      }

      function spatialConfig() {
        const d = moduleDifficulty("spatial");
        return {
          grid: clamp(4 + Math.floor(d / 3), 4, 7),
          steps: clamp(2 + Math.ceil(d / 2), 3, 9),
          target: Math.round((5 + Math.ceil(d / 2)) * sessionLoadMultiplier())
        };
      }

      function coordinateLabel(position, grid) {
        const row = Math.floor(position / grid);
        const col = position % grid;
        return `${String.fromCharCode(65 + row)}${col + 1}`;
      }

      function applySpatialTransform(position, transform, grid) {
        const row = Math.floor(position / grid);
        const col = position % grid;
        const amount = transform.amount || 1;
        if (transform.kind === "mirror vertical") return row * grid + (grid - 1 - col);
        if (transform.kind === "mirror horizontal") return (grid - 1 - row) * grid + col;
        if (transform.kind === "rotate clockwise") return col * grid + (grid - 1 - row);
        if (transform.kind === "rotate counterclockwise") return (grid - 1 - col) * grid + row;
        if (transform.kind === "shift east") return row * grid + ((col + amount) % grid);
        if (transform.kind === "shift west") return row * grid + ((col - amount + grid * 4) % grid);
        if (transform.kind === "shift south") return ((row + amount) % grid) * grid + col;
        if (transform.kind === "shift north") return ((row - amount + grid * 4) % grid) * grid + col;
        return position;
      }

      function spatialTransformPool(d) {
        const shifts = ["shift east", "shift west", "shift north", "shift south"].map((kind) => ({ kind, amount: 1 + Math.floor(Math.random() * clamp(Math.ceil(d / 4), 1, 3)) }));
        const transforms = [
          { kind: "mirror vertical" },
          { kind: "mirror horizontal" },
          { kind: "rotate clockwise" },
          { kind: "rotate counterclockwise" },
          ...shifts
        ];
        return transforms;
      }

      function generateSpatialProblem() {
        const config = spatialConfig();
        const d = moduleDifficulty("spatial");
        const start = Math.floor(Math.random() * config.grid * config.grid);
        let current = start;
        const trace = [coordinateLabel(start, config.grid)];
        const transforms = [];
        for (let i = 0; i < config.steps; i += 1) {
          const transform = sample(spatialTransformPool(d));
          transforms.push(transform);
          current = applySpatialTransform(current, transform, config.grid);
          trace.push(coordinateLabel(current, config.grid));
        }
        const answer = coordinateLabel(current, config.grid);
        const optionSet = new Set([answer]);
        while (optionSet.size < 4) {
          const offset = Math.floor(Math.random() * config.grid * config.grid);
          optionSet.add(coordinateLabel(offset, config.grid));
        }
        const transformText = transforms.map((item, index) => {
          const suffix = item.kind.startsWith("shift") ? ` ${item.amount}` : "";
          return `${index + 1}. ${item.kind}${suffix}`;
        }).join("; ");
        spatial.current = {
          grid: config.grid,
          start,
          goal: current,
          answer,
          options: shuffle([...optionSet]),
          text: `Grid ${config.grid} x ${config.grid}. Start at ${coordinateLabel(start, config.grid)}. Apply these transformations in order: ${transformText}. What is the final coordinate?`,
          explanation: `Trace: ${trace.join(" -> ")}.`
        };
      }

      function startSpatialSet() {
        playSfx("start");
        spatial.active = true;
        spatial.answered = 0;
        spatial.correct = 0;
        spatial.target = spatialConfig().target;
        spatial.current = null;
        spatial.locked = false;
        $("#spatialFeedback").textContent = "Spatial set running. Track the marker mentally before choosing.";
        nextSpatialProblem();
      }

      function nextSpatialProblem() {
        if (!spatial.active) {
          startSpatialSet();
          return;
        }
        if (spatial.current && !spatial.locked) {
          $("#spatialFeedback").textContent = "Answer the current chain before moving on. Spatial scoring needs exact attempts.";
          playSfx("wrong");
          return;
        }
        if (spatial.locked && spatial.answered >= spatial.target) {
          finishSpatialSet();
          return;
        }
        spatial.locked = false;
        generateSpatialProblem();
        $("#spatialPrompt").textContent = spatial.current.text;
        $("#nextSpatial").textContent = "Next";
        renderSpatialBoard(false);
        renderSpatialAnswers();
        renderSpatialStats();
      }

      function renderSpatialBoard(showGoal) {
        const board = $("#spatialBoard");
        const config = spatial.current || { grid: spatialConfig().grid, start: -1, goal: -1 };
        const cellCount = config.grid * config.grid;
        board.style.setProperty("--spatial-grid", config.grid);
        board.innerHTML = "";
        for (let i = 0; i < cellCount; i += 1) {
          const cell = document.createElement("span");
          cell.className = "spatial-cell";
          cell.textContent = coordinateLabel(i, config.grid);
          cell.classList.toggle("is-start", i === config.start);
          cell.classList.toggle("is-goal", showGoal && i === config.goal);
          board.appendChild(cell);
        }
      }

      function renderSpatialAnswers() {
        const grid = $("#spatialAnswerGrid");
        grid.innerHTML = "";
        spatial.current.options.forEach((option) => {
          const button = document.createElement("button");
          button.className = "answer-btn";
          button.type = "button";
          button.textContent = option;
          on(button, "click", () => answerSpatial(button, option), "answer spatial");
          grid.appendChild(button);
        });
      }

      function answerSpatial(button, option) {
        if (!spatial.active || spatial.locked) return;
        spatial.locked = true;
        spatial.answered += 1;
        const correct = option === spatial.current.answer;
        if (correct) spatial.correct += 1;
        playSfx(correct ? "correct" : "wrong", { origin: elementCenter(button) });
        $$("#spatialAnswerGrid .answer-btn").forEach((item) => {
          item.disabled = true;
          if (item.textContent === spatial.current.answer) item.classList.add("is-correct");
        });
        if (!correct) button.classList.add("is-wrong");
        renderSpatialBoard(true);
        $("#spatialFeedback").textContent = correct
          ? `Correct. ${spatial.current.explanation}`
          : `Not quite. Correct coordinate: ${spatial.current.answer}. ${spatial.current.explanation}`;
        $("#nextSpatial").textContent = spatial.answered >= spatial.target ? "Finish set" : "Next";
        renderSpatialStats();
      }

      function finishSpatialSet() {
        if (!spatial.active || spatial.answered === 0) return;
        const success = spatial.correct / spatial.answered;
        const config = spatialConfig();
        const xp = spatial.correct * 22 + Math.round(success * 90) + config.steps * 6;
        spatial.active = false;
        $("#spatialFeedback").textContent = `Spatial set complete: ${spatial.correct}/${spatial.answered}, ${Math.round(success * 100)}% accuracy on ${config.grid} x ${config.grid} chains.`;
        recordSession("spatial", { success, xp, label: `${spatial.correct}/${spatial.answered} spatial chains` });
      }

      function renderSpatialStats() {
        const config = spatialConfig();
        $("#spatialDifficulty").textContent = `difficulty ${moduleDifficulty("spatial")}`;
        $("#spatialProgress").textContent = `${spatial.answered}/${spatial.target || config.target}`;
        $("#spatialMode").textContent = `${config.steps}-step transform`;
        $("#spatialDifficultySide").textContent = moduleDifficulty("spatial");
        $("#spatialGridSize").textContent = `${config.grid} x ${config.grid}`;
        $("#spatialSteps").textContent = config.steps;
        $("#spatialCorrect").textContent = spatial.correct;
        if (!spatial.current) renderSpatialBoard(false);
      }

      function calibrationConfig() {
        const d = moduleDifficulty("calibration");
        return {
          target: Math.round((4 + Math.ceil(d / 2) + problemDepth()) * sessionLoadMultiplier())
        };
      }

      function generateCalibrationQuestion() {
        const d = moduleDifficulty("calibration") + problemDepth();
        const generators = [makeEvidenceWeighingQuestion, makeCaseReasoningQuestion, makeConstraintOptimizationQuestion, makeArgumentFlawQuestion];
        calibration.current = sample(generators)(d);
      }

      function startCalibrationSet() {
        playSfx("start");
        calibration.active = true;
        calibration.answered = 0;
        calibration.correct = 0;
        calibration.confidenceTotal = 0;
        calibration.brierTotal = 0;
        calibration.target = calibrationConfig().target;
        calibration.current = null;
        calibration.locked = false;
        calibration.selected = "";
        $("#calibrationFeedback").textContent = "Calibration running. Pick an answer, then watch whether confidence matched performance.";
        nextCalibrationQuestion();
      }

      function nextCalibrationQuestion() {
        if (!calibration.active) {
          startCalibrationSet();
          return;
        }
        if (calibration.current && !calibration.locked) {
          $("#calibrationFeedback").textContent = "Answer the current evidence problem before moving on. Calibration needs confidence tied to an attempt.";
          playSfx("wrong");
          return;
        }
        if (calibration.locked && calibration.answered >= calibration.target) {
          finishCalibrationSet();
          return;
        }
        calibration.locked = false;
        calibration.selected = "";
        generateCalibrationQuestion();
        $("#calibrationText").textContent = calibration.current.text;
        $("#nextCalibration").textContent = "Next";
        renderCalibrationAnswers();
        renderCalibrationStats();
      }

      function renderCalibrationAnswers() {
        const grid = $("#calibrationAnswerGrid");
        grid.innerHTML = "";
        answerOptions(calibration.current).forEach((option) => {
          const button = document.createElement("button");
          button.className = "answer-btn";
          button.type = "button";
          button.textContent = option;
          on(button, "click", () => answerCalibration(button, option), "answer calibration");
          grid.appendChild(button);
        });
      }

      function answerCalibration(button, option) {
        if (!calibration.active || calibration.locked) return;
        calibration.locked = true;
        calibration.selected = option;
        calibration.answered += 1;
        const confidence = Number($("#confidenceSlider").value) / 100;
        const correct = option === String(calibration.current.answer);
        if (correct) calibration.correct += 1;
        const brier = Math.pow(confidence - (correct ? 1 : 0), 2);
        calibration.confidenceTotal += confidence;
        calibration.brierTotal += brier;
        playSfx(correct ? "correct" : "wrong", { origin: elementCenter(button) });
        $$("#calibrationAnswerGrid .answer-btn").forEach((item) => {
          item.disabled = true;
          if (item.textContent === String(calibration.current.answer)) item.classList.add("is-correct");
        });
        if (!correct) button.classList.add("is-wrong");
        $("#calibrationFeedback").textContent = correct
          ? `Correct at ${Math.round(confidence * 100)}% confidence. Brier penalty ${brier.toFixed(2)}. ${calibration.current.explanation}`
          : `Wrong at ${Math.round(confidence * 100)}% confidence. Correct: ${calibration.current.answer}. Brier penalty ${brier.toFixed(2)}. ${calibration.current.explanation}`;
        $("#nextCalibration").textContent = calibration.answered >= calibration.target ? "Finish set" : "Next";
        renderCalibrationStats();
      }

      function finishCalibrationSet() {
        if (!calibration.active || calibration.answered === 0) return;
        calibration.active = false;
        const accuracy = calibration.correct / calibration.answered;
        const avgBrier = calibration.brierTotal / calibration.answered;
        const calibrationScore = clamp(1 - avgBrier, 0, 1);
        const success = accuracy * 0.66 + calibrationScore * 0.34;
        const xp = calibration.correct * 24 + Math.round(calibrationScore * 100);
        $("#calibrationFeedback").textContent = `Calibration complete: ${calibration.correct}/${calibration.answered}, avg Brier ${avgBrier.toFixed(2)}, score ${Math.round(success * 100)}%.`;
        recordSession("calibration", { success, xp, label: `${calibration.correct}/${calibration.answered}, Brier ${avgBrier.toFixed(2)}` });
      }

      function renderCalibrationStats() {
        const config = calibrationConfig();
        const avgConfidence = calibration.answered ? calibration.confidenceTotal / calibration.answered : 0;
        const avgBrier = calibration.answered ? calibration.brierTotal / calibration.answered : null;
        $("#calibrationDifficulty").textContent = `difficulty ${moduleDifficulty("calibration")}`;
        $("#calibrationProgress").textContent = `${calibration.answered}/${calibration.target || config.target}`;
        $("#calibrationBrier").textContent = avgBrier === null ? "brier --" : `brier ${avgBrier.toFixed(2)}`;
        $("#calibrationDifficultySide").textContent = moduleDifficulty("calibration");
        $("#calibrationCorrect").textContent = calibration.correct;
        $("#calibrationConfidence").textContent = `${Math.round(avgConfidence * 100)}%`;
        $("#calibrationScore").textContent = avgBrier === null ? "--" : `${Math.round(clamp(1 - avgBrier, 0, 1) * 100)}%`;
        $("#confidenceLabel").textContent = `${$("#confidenceSlider").value}%`;
      }

      function systemsConfig() {
        const d = moduleDifficulty("systems");
        return {
          target: Math.round((5 + Math.ceil(d / 2) + problemDepth()) * sessionLoadMultiplier()),
          detail: finiteNumber($("#systemsDetailSelect")?.value, problemDepth(), 1, 3)
        };
      }

      function generateSystemsProblem() {
        const mode = state.modules.systems.mode || "mixed";
        const d = moduleDifficulty("systems") + systemsConfig().detail;
        const generators = {
          causal: [makeCausalGraphQuestion],
          bayes: [makeBayesianQuestion],
          proof: [makeProofChainQuestion],
          schedule: [makeScheduleOptimizerQuestion],
          mixed: [makeCausalGraphQuestion, makeBayesianQuestion, makeProofChainQuestion, makeScheduleOptimizerQuestion, makeConstraintOptimizationQuestion, makeMatrixReasoningQuestion, makeStudyDesignQuestion, makeFermiQuestion]
        };
        systems.current = sample(generators[mode] || generators.mixed)(d);
      }

      function startSystemsSet() {
        playSfx("start");
        systems.active = true;
        systems.answered = 0;
        systems.correct = 0;
        systems.target = systemsConfig().target;
        systems.current = null;
        systems.locked = false;
        systems.mode = state.modules.systems.mode || "mixed";
        $("#systemsFeedback").textContent = "Systems set running. Read the whole structure before choosing.";
        nextSystemsProblem();
      }

      function nextSystemsProblem() {
        if (!systems.active) {
          startSystemsSet();
          return;
        }
        if (systems.current && !systems.locked) {
          $("#systemsFeedback").textContent = "Answer the current systems problem before moving on.";
          playSfx("wrong");
          return;
        }
        if (systems.locked && systems.answered >= systems.target) {
          finishSystemsSet();
          return;
        }
        systems.locked = false;
        generateSystemsProblem();
        $("#systemsText").textContent = systems.current.text;
        $("#systemsType").textContent = systems.current.type;
        $("#nextSystems").textContent = "Next";
        renderSystemsAnswers();
        renderSystemsStats();
      }

      function renderSystemsAnswers() {
        const grid = $("#systemsAnswerGrid");
        grid.innerHTML = "";
        answerOptions(systems.current).forEach((option) => {
          const button = document.createElement("button");
          button.className = "answer-btn";
          button.type = "button";
          button.textContent = option;
          on(button, "click", () => answerSystems(button, option), "answer systems");
          grid.appendChild(button);
        });
      }

      function answerSystems(button, option) {
        if (!systems.active || systems.locked) return;
        systems.locked = true;
        systems.answered += 1;
        const correct = option === String(systems.current.answer);
        if (correct) systems.correct += 1;
        playSfx(correct ? "correct" : "wrong", { origin: elementCenter(button) });
        $$("#systemsAnswerGrid .answer-btn").forEach((item) => {
          item.disabled = true;
          if (item.textContent === String(systems.current.answer)) item.classList.add("is-correct");
        });
        if (!correct) button.classList.add("is-wrong");
        $("#systemsFeedback").textContent = correct
          ? `Correct. ${systems.current.explanation}`
          : `Not quite. Correct answer: ${systems.current.answer}. ${systems.current.explanation}`;
        $("#nextSystems").textContent = systems.answered >= systems.target ? "Finish set" : "Next";
        renderSystemsStats();
      }

      function finishSystemsSet() {
        if (!systems.active || systems.answered === 0) return;
        const success = systems.correct / systems.answered;
        const xp = systems.correct * 30 + Math.round(success * 120) + moduleDifficulty("systems") * 8;
        systems.active = false;
        $("#systemsFeedback").textContent = `Systems set complete: ${systems.correct}/${systems.answered}, ${Math.round(success * 100)}%.`;
        recordSession("systems", { success, xp, label: `${systems.correct}/${systems.answered} systems problems` });
      }

      function setSystemsMode(mode) {
        state.modules.systems.mode = ["mixed", "causal", "bayes", "proof", "schedule"].includes(mode) ? mode : "mixed";
        systems.mode = state.modules.systems.mode;
        saveState();
        renderSystemsStats();
      }

      function renderSystemsStats() {
        const config = systemsConfig();
        const mode = state.modules.systems.mode || "mixed";
        $("#systemsDifficulty").textContent = `difficulty ${moduleDifficulty("systems")}`;
        $("#systemsProgress").textContent = `${systems.answered}/${systems.target || config.target}`;
        $("#systemsDifficultySide").textContent = moduleDifficulty("systems");
        $("#systemsTarget").textContent = systems.target || config.target;
        $("#systemsCorrect").textContent = systems.correct;
        $("#systemsModeLabel").textContent = mode;
        $("#systemsModeSelect").value = mode;
        $("#systemsDetailSelect").value = String(config.detail);
      }

      function rrtConfig() {
        const d = moduleDifficulty("rrt");
        return {
          target: Math.round((5 + Math.ceil(d / 2) + problemDepth()) * sessionLoadMultiplier()),
          relationLoad: clamp(Math.ceil(d / 3) + problemDepth(), 2, 7)
        };
      }

      function rrtGenerators() {
        return {
          frames: [makeRelationalFrameQuestion, makeMoreLessQuestion, makeBeforeAfterQuestion],
          transitive: [makeTransitiveRrtQuestion, makeHierarchicalRrtQuestion],
          analogy: [makeRrtAnalogyQuestion, makeCrossMappingQuestion, makeDistantAnalogyQuestion],
          matrix: [makeRrtMatrixQuestion, makeProportionRrtQuestion],
          evidence: [makeRelationalFrameQuestion, makeMoreLessQuestion, makeBeforeAfterQuestion, makeTransitiveRrtQuestion, makeHierarchicalRrtQuestion, makeRrtAnalogyQuestion, makeCrossMappingQuestion, makeDistantAnalogyQuestion, makeRrtMatrixQuestion, makeProportionRrtQuestion]
        };
      }

      function generateRrtProblem() {
        const mode = state.modules.rrt.mode || "evidence";
        const generators = rrtGenerators();
        rrt.current = sample(generators[mode] || generators.evidence)(moduleDifficulty("rrt") + problemDepth());
      }

      function makeMoreLessQuestion(d) {
        const names = shuffle(["KAV", "MIR", "DAX", "LUM", "SEN", "TOR"]).slice(0, 4);
        const values = shuffle([2 + d, 5 + d * 2, 8 + d * 2, 11 + d * 3]);
        const items = names.map((name, index) => ({ name, value: values[index] })).sort((a, b) => b.value - a.value);
        const premises = [
          `${items[0].name} is more than ${items[1].name}`,
          `${items[1].name} is more than ${items[2].name}`,
          `${items[2].name} is more than ${items[3].name}`
        ];
        return {
          type: "same-more-less frame",
          text: `Integrate the relations, not the word shapes. Premises: ${premises.join("; ")}. Which item is least?`,
          answer: items[3].name,
          options: shuffle(names),
          explanation: `The chain is ${items.map((item) => item.name).join(" > ")}, so ${items[3].name} is least.`
        };
      }

      function makeBeforeAfterQuestion(d) {
        const steps = shuffle(["prime", "encode", "map", "integrate", "answer", "check"]).slice(0, clamp(4 + Math.floor(d / 4), 4, 6));
        const target = steps[clamp(2 + Math.floor(d / 5), 2, steps.length - 1)];
        const before = steps[steps.indexOf(target) - 1];
        const after = steps[steps.indexOf(target) + 1] || steps[steps.length - 1];
        return {
          type: "before-after integration",
          text: `Sequence premises: ${steps.map((step, index) => `${index + 1}. ${step}`).join("; ")}. What is immediately before ${target}, and what is immediately after it?`,
          answer: `${before} / ${after}`,
          options: shuffle([
            `${before} / ${after}`,
            `${after} / ${before}`,
            `${steps[0]} / ${target}`,
            `${target} / ${steps[steps.length - 1]}`
          ]),
          explanation: `${target} sits between ${before} and ${after}; this trains ordered relational integration.`
        };
      }

      function makeRelationalFrameQuestion(d) {
        const frames = [
          { relation: "same", cue: "same as", transform: (x) => x, label: "same" },
          { relation: "opposite", cue: "opposite of", transform: (x) => -x, label: "opposite" },
          { relation: "more", cue: "more than", transform: (x) => x + 1, label: "more" },
          { relation: "less", cue: "less than", transform: (x) => x - 1, label: "less" }
        ];
        const first = sample(frames);
        const second = sample(frames);
        const base = Math.max(3, d + 2);
        const value = second.transform(first.transform(base));
        const answer = value > base ? "more" : value < base ? "less" : "same";
        return {
          type: "derived relation frame",
          text: `Let A start at ${base}. B is ${first.cue} A. C is ${second.cue} B. Relative to A, C is...`,
          answer,
          options: shuffle(["more", "less", "same", "cannot tell"]),
          explanation: `Apply the trained frames in order: ${first.label}, then ${second.label}. The resulting C value is ${value}, so C is ${answer} relative to A.`
        };
      }

      function makeTransitiveRrtQuestion(d) {
        const names = shuffle(["Ari", "Bo", "Cy", "Dee", "Eli", "Fay"]).slice(0, clamp(4 + Math.floor(d / 4), 4, 6));
        const ordered = names.map((name, index) => ({ name, value: names.length - index }));
        const premises = ordered.slice(0, -1).map((item, index) => `${item.name} is heavier than ${ordered[index + 1].name}`);
        const left = ordered[0];
        const right = ordered[ordered.length - 1];
        return {
          type: "transitive inference",
          text: `Only use the premises. ${premises.join("; ")}. What follows about ${left.name} and ${right.name}?`,
          answer: `${left.name} heavier`,
          options: shuffle([`${left.name} heavier`, `${right.name} heavier`, "equal weight", "cannot infer"]),
          explanation: `The full chain places ${left.name} above ${right.name}. This is direct relational integration across ${premises.length} links.`
        };
      }

      function makeHierarchicalRrtQuestion(d) {
        const categories = shuffle([
          ["all glims are sensors", "all sensors are instruments", "some instruments are portable", "glims are instruments"],
          ["all nals are patterns", "all patterns are relations", "no relations are random", "nals are not random"],
          ["all torps are maps", "all maps are models", "all models simplify", "torps simplify"]
        ])[0];
        const lure = d >= 6 ? "some portable things are glims" : "all instruments are glims";
        return {
          type: "class inclusion",
          text: `Premises: ${categories[0]}; ${categories[1]}; ${categories[2]}. Which conclusion is guaranteed?`,
          answer: categories[3],
          options: shuffle([categories[3], lure, "no conclusion follows", categories[0].replace("all", "no")]),
          explanation: `Follow the inclusion chain and reject the surface lure. The guaranteed relation is: ${categories[3]}.`
        };
      }

      function makeRrtAnalogyQuestion() {
        const item = sample([
          { stem: "thermostat : temperature", answer: "governor : speed", relation: "controller regulates variable", options: ["governor : speed", "clock : wall", "glass : window", "river : stone"] },
          { stem: "seed : tree", answer: "prototype : product", relation: "early form develops into mature form", options: ["prototype : product", "book : shelf", "signal : noise", "mirror : face"] },
          { stem: "cipher : message", answer: "equation : quantity", relation: "structure encodes hidden content", options: ["equation : quantity", "pencil : paper", "ladder : roof", "cloud : rain"] },
          { stem: "map : territory", answer: "model : system", relation: "representation corresponds to represented thing", options: ["model : system", "engine : fuel", "note : song", "door : room"] }
        ]);
        return {
          type: "propositional analogy",
          text: `${item.stem} has the relation "${item.relation}". Which pair preserves that relation?`,
          answer: item.answer,
          options: shuffle(item.options),
          explanation: `The correct pair preserves the same abstract role relation: ${item.relation}.`
        };
      }

      function makeCrossMappingQuestion() {
        const patterns = [
          { pattern: "small-big-small", answer: "quiet-loud-quiet", lure: "small-small-big" },
          { pattern: "A-B-B-A", answer: "cold-warm-warm-cold", lure: "cold-warm-cold-warm" },
          { pattern: "low-high-mid-high", answer: "red-blue-green-blue", lure: "red-green-blue-red" }
        ];
        const item = sample(patterns);
        return {
          type: "cross-mapped pattern",
          text: `Ignore surface words and match the relation pattern. Target pattern: ${item.pattern}. Which option has the same structure?`,
          answer: item.answer,
          options: shuffle([item.answer, item.lure, "near-far-near-far", "one-two-three-four"]),
          explanation: `The answer preserves the abstract same/different positions, not the literal words.`
        };
      }

      function makeDistantAnalogyQuestion() {
        const item = sample([
          { source: "immune memory tags a threat so a later response is faster", target: "study system", answer: "retrieval cues tag a concept so recall is faster later" },
          { source: "mission control uses telemetry to update a launch decision", target: "learning plan", answer: "feedback updates the next training difficulty" },
          { source: "a city reroutes traffic around a bottleneck", target: "problem solving", answer: "switch strategy when one constraint blocks progress" }
        ]);
        return {
          type: "distant analogy integration",
          text: `Source relation: ${item.source}. Which target mapping best preserves the structure for a ${item.target}?`,
          answer: item.answer,
          options: shuffle([item.answer, "make the target look visually similar", "repeat the same words from the source", "ignore constraints and maximize speed"]),
          explanation: `Distant analogy practice is useful when the mapped relation is structural, not just thematically similar.`
        };
      }

      function makeRrtMatrixQuestion(d) {
        const start = Math.floor(Math.random() * 5) + 2;
        const rowAdd = Math.ceil(d / 3) + 1;
        const colAdd = Math.ceil(d / 4) + 2;
        const a = start;
        const b = a + rowAdd;
        const c = a + colAdd;
        const answer = c + rowAdd;
        return {
          type: "matrix rule induction",
          text: `Complete the 2x2 rule matrix. Row relation adds ${rowAdd}; column relation adds ${colAdd}. Top row: ${a}, ${b}. Bottom left: ${c}. Bottom right: ?`,
          answer: String(answer),
          options: numberOptions(answer, 8 + d * 2),
          explanation: `Apply either relation path: ${a}+${colAdd}=${c}, then +${rowAdd}=${answer}; or ${a}+${rowAdd}=${b}, then +${colAdd}=${answer}.`
        };
      }

      function makeProportionRrtQuestion(d) {
        const a = Math.floor(Math.random() * 5) + 2;
        const ratio = Math.floor(Math.random() * 3) + Math.ceil(d / 4) + 2;
        const c = a + Math.floor(Math.random() * 4) + 2;
        const answer = c * ratio;
        return {
          type: "proportional relation",
          text: `A relates to B by x${ratio}. If A=${a}, B=${a * ratio}, and C=${c}, what D preserves the same C:D relation?`,
          answer: String(answer),
          options: numberOptions(answer, 10 + d * 3),
          explanation: `Preserve the relation, not the numbers: C x ${ratio} = ${answer}.`
        };
      }

      function startRrtSet() {
        playSfx("start");
        rrt.active = true;
        rrt.answered = 0;
        rrt.correct = 0;
        rrt.target = rrtConfig().target;
        rrt.current = null;
        rrt.locked = false;
        rrt.mode = state.modules.rrt.mode || "evidence";
        rrt.startTime = performance.now();
        $("#rrtFeedback").textContent = "RRT block running. Solve by naming the relation, integrating links, or preserving structure across examples.";
        nextRrtProblem();
      }

      function nextRrtProblem() {
        if (!rrt.active) {
          startRrtSet();
          return;
        }
        if (rrt.current && !rrt.locked) {
          $("#rrtFeedback").textContent = "Answer the current relational item before moving on.";
          playSfx("wrong");
          return;
        }
        if (rrt.locked && rrt.answered >= rrt.target) {
          finishRrtSet();
          return;
        }
        rrt.locked = false;
        generateRrtProblem();
        $("#rrtText").textContent = rrt.current.text;
        $("#rrtType").textContent = rrt.current.type;
        $("#nextRrt").textContent = "Next";
        renderRrtAnswers();
        renderRrtStats();
      }

      function renderRrtAnswers() {
        const grid = $("#rrtAnswerGrid");
        grid.innerHTML = "";
        answerOptions(rrt.current).forEach((option) => {
          const button = document.createElement("button");
          button.className = "answer-btn";
          button.type = "button";
          button.textContent = option;
          on(button, "click", () => answerRrt(button, option), "answer rrt");
          grid.appendChild(button);
        });
      }

      function answerRrt(button, option) {
        if (!rrt.active || rrt.locked) return;
        rrt.locked = true;
        rrt.answered += 1;
        const correct = option === String(rrt.current.answer);
        if (correct) rrt.correct += 1;
        playSfx(correct ? "correct" : "wrong", { origin: elementCenter(button) });
        $$("#rrtAnswerGrid .answer-btn").forEach((item) => {
          item.disabled = true;
          if (item.textContent === String(rrt.current.answer)) item.classList.add("is-correct");
        });
        if (!correct) button.classList.add("is-wrong");
        $("#rrtFeedback").textContent = correct
          ? `Correct. ${rrt.current.explanation}`
          : `Not quite. Correct answer: ${rrt.current.answer}. ${rrt.current.explanation}`;
        $("#nextRrt").textContent = rrt.answered >= rrt.target ? "Finish block" : "Next";
        renderRrtStats();
      }

      function finishRrtSet() {
        if (!rrt.active || rrt.answered === 0) return;
        const success = rrt.correct / rrt.answered;
        const seconds = Math.max(1, Math.round((performance.now() - rrt.startTime) / 1000));
        const xp = rrt.correct * 32 + Math.round(success * 130) + moduleDifficulty("rrt") * 9;
        rrt.active = false;
        $("#rrtFeedback").textContent = `RRT block complete: ${rrt.correct}/${rrt.answered}, ${Math.round(success * 100)}%, ${seconds}s.`;
        recordSession("rrt", { success, xp, label: `${rrt.correct}/${rrt.answered} RRT relations in ${seconds}s` });
      }

      function setRrtMode(mode) {
        state.modules.rrt.mode = ["evidence", "frames", "transitive", "analogy", "matrix"].includes(mode) ? mode : "evidence";
        rrt.mode = state.modules.rrt.mode;
        saveState();
        renderRrtStats();
      }

      function renderRrtStats() {
        if (!$("#rrtDifficulty")) return;
        const config = rrtConfig();
        const mode = state.modules.rrt.mode || "evidence";
        const ported = state.ported.summary.rrt;
        $("#rrtDifficulty").textContent = `difficulty ${moduleDifficulty("rrt")}`;
        $("#rrtProgress").textContent = `${rrt.answered}/${rrt.target || config.target}`;
        $("#rrtLoad").textContent = `${config.relationLoad}-relation load`;
        $("#rrtDifficultySide").textContent = moduleDifficulty("rrt");
        $("#rrtTarget").textContent = rrt.target || config.target;
        $("#rrtCorrect").textContent = rrt.correct;
        $("#rrtModeLabel").textContent = mode;
        $("#rrtPortedSignal").textContent = ported ? `${ported.count} rows, ${Math.round(ported.avgScore * 100)}% avg` : "none";
        $("#rrtModeSelect").value = mode;
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
            const info = moduleInfo[entry.module] || { label: "Unknown module" };
            const changed = entry.difficulty > entry.previousDifficulty ? "up" : entry.difficulty < entry.previousDifficulty ? "down" : "steady";
            const item = document.createElement("li");
            item.innerHTML = `<strong>${escapeHtml(info.label)} - ${entry.success}%</strong><span>${escapeHtml(entry.label)}. +${entry.xp} XP. Difficulty ${changed} to ${entry.difficulty}. ${escapeHtml(entry.time)}</span>`;
            history.appendChild(item);
          });
        }

        const progress = $("#moduleProgressList");
        progress.innerHTML = "";
        Object.keys(moduleInfo).forEach((key) => {
          const module = state.modules[key];
          const item = document.createElement("li");
          const ported = state.ported.summary[key];
          const portedText = ported ? ` Ported: ${ported.count} rows, ${Math.round(ported.avgScore * 100)}% avg.` : "";
          item.innerHTML = `<strong>${escapeHtml(moduleInfo[key].label)}</strong><span>d${module.difficulty}, effective d${moduleDifficulty(key)}, ${module.xp} XP, ${module.sessions} sessions, best ${module.best}%. ${escapeHtml(module.lastNote)}${escapeHtml(portedText)}</span>`;
          progress.appendChild(item);
        });

        const activity = $("#activityLogList");
        if (activity) {
          activity.innerHTML = "";
          const logs = state.eventLog || [];
          if (!logs.length) {
            const empty = document.createElement("li");
            empty.innerHTML = "<strong>No activity yet</strong><span>Sessions, imports, and safety actions will appear here.</span>";
            activity.appendChild(empty);
          } else {
            logs.slice(0, 18).forEach((entry) => {
              const item = document.createElement("li");
              item.innerHTML = `<strong>${escapeHtml(entry.kind)} - ${escapeHtml(entry.time)}</strong><span>${escapeHtml(entry.message)}${entry.detail ? `. ${escapeHtml(entry.detail)}` : ""}</span>`;
              activity.appendChild(item);
            });
          }
        }

        renderPortedSummary();
      }

      function renderPortedSummary() {
        const list = $("#portedSummaryList");
        if (!list) return;
        list.innerHTML = "";
        const keys = Object.keys(state.ported.summary || {});
        if (!keys.length) {
          const empty = document.createElement("li");
          empty.innerHTML = "<strong>No imported data</strong><span>Paste CSV or JSON exports in the Terminal Data Port. Imported rows stay local.</span>";
          list.appendChild(empty);
          return;
        }
        keys.forEach((key) => {
          const item = state.ported.summary[key];
          const li = document.createElement("li");
          li.innerHTML = `<strong>${escapeHtml(moduleInfo[key]?.label || key)}</strong><span>${item.count} imported rows, ${Math.round(item.avgScore * 100)}% avg score, suggested d${Math.round(portedSuggestedDifficulty(key) || item.avgDifficulty || 1)} from ${escapeHtml(item.lastSource || "external")}.</span>`;
          list.appendChild(li);
        });
      }

      function progressReportText() {
        return [
          "How to get smart 101 progress",
          `XP: ${state.xp}`,
          `Level: ${levelFromXp(state.xp)}`,
          `Streak: ${state.streak}`,
          `Imported rows: ${state.ported.entries.length}`,
          ...Object.keys(moduleInfo).map((key) => {
            const module = state.modules[key];
            const ported = state.ported.summary[key];
            return `${moduleInfo[key].label}: d${module.difficulty}, effective d${moduleDifficulty(key)}, ${module.xp} XP, ${module.sessions} sessions, best ${module.best}%${ported ? `, ported ${ported.count} rows avg ${Math.round(ported.avgScore * 100)}%` : ""}`;
          })
        ].join("\n");
      }

      function backupStateText() {
        return JSON.stringify({
          app: "How to get smart 101",
          key: STORAGE_KEY,
          exportedAt: new Date().toISOString(),
          state: sanitizeState(deepMerge(defaultState, state))
        }, null, 2);
      }

      function copyText(text, successMessage) {
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
          showToast("Clipboard API unavailable");
          return Promise.resolve(false);
        }
        return navigator.clipboard.writeText(text).then(
          () => {
            showToast(successMessage);
            return true;
          },
          () => {
            showToast("Clipboard copy blocked");
            return false;
          }
        );
      }

      function copyProgressReport() {
        copyText(progressReportText(), "Progress report copied");
      }

      function copyBackupData() {
        const backup = backupStateText();
        const box = $("#terminalImportBox");
        if (box) box.value = backup;
        copyText(backup, "Backup JSON copied");
      }

      function importBackupFromText(text) {
        const raw = String(text || "").trim();
        if (!raw) {
          showToast("Paste backup JSON first");
          return false;
        }
        try {
          const parsed = JSON.parse(raw);
          const payload = parsed && parsed.state && typeof parsed.state === "object" ? parsed.state : parsed;
          state = refreshDailyState(sanitizeState(deepMerge(defaultState, payload)));
          saveState();
          renderAll();
          showToast("Backup imported");
          return true;
        } catch (error) {
          console.warn("Backup import failed", error);
          showToast("Invalid backup JSON");
          return false;
        }
      }

      function parseCsv(text) {
        const rows = [];
        let current = "";
        let row = [];
        let quoted = false;
        for (let i = 0; i < text.length; i += 1) {
          const char = text[i];
          const next = text[i + 1];
          if (char === "\"" && quoted && next === "\"") {
            current += "\"";
            i += 1;
          } else if (char === "\"") {
            quoted = !quoted;
          } else if (char === "," && !quoted) {
            row.push(current.trim());
            current = "";
          } else if ((char === "\n" || char === "\r") && !quoted) {
            if (char === "\r" && next === "\n") i += 1;
            row.push(current.trim());
            if (row.some(Boolean)) rows.push(row);
            row = [];
            current = "";
          } else {
            current += char;
          }
        }
        row.push(current.trim());
        if (row.some(Boolean)) rows.push(row);
        return rows;
      }

      function rowsFromCsv(text) {
        const rows = parseCsv(text);
        if (rows.length < 2) return [];
        const headers = rows[0].map((header) => header.toLowerCase().replace(/[^a-z0-9]+/g, ""));
        return rows.slice(1).map((row) => {
          return headers.reduce((entry, header, index) => {
            entry[header || `field${index}`] = row[index] || "";
            return entry;
          }, {});
        });
      }

      function flattenedImportedRows(parsed) {
        if (Array.isArray(parsed)) return parsed;
        if (!parsed || typeof parsed !== "object") return [];
        const candidates = [parsed.sessions, parsed.results, parsed.history, parsed.entries, parsed.records, parsed.data];
        const array = candidates.find(Array.isArray);
        if (array) return array;
        return Object.keys(parsed).map((key) => {
          const value = parsed[key];
          return value && typeof value === "object" ? { label: key, ...value } : { label: key, score: value };
        });
      }

      function parseScore(value) {
        if (typeof value === "number") return value > 1 ? clamp(value / 100, 0, 1) : clamp(value, 0, 1);
        const text = String(value || "").trim();
        if (!text) return 0;
        const fraction = text.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
        if (fraction) return clamp(Number(fraction[1]) / Math.max(1, Number(fraction[2])), 0, 1);
        const number = Number(text.replace(/%/g, ""));
        if (!Number.isFinite(number)) return 0;
        return number > 1 ? clamp(number / 100, 0, 1) : clamp(number, 0, 1);
      }

      function firstField(row, names) {
        return names.map((name) => row[name]).find((value) => value !== undefined && value !== null && String(value).trim() !== "");
      }

      function normalizePortedRow(row, fallbackSource) {
        const source = safeString(firstField(row, ["source", "site", "app", "platform"]) || fallbackSource || "external", "external", 80);
        const label = safeString(firstField(row, ["task", "module", "game", "exercise", "name", "label", "category"]) || source, source, 120);
        const type = safeString(firstField(row, ["type", "mode", "kind"]) || "import", "import", 50);
        const module = inferModuleFromText([label, type, source].join(" "));
        const scoreValue = firstField(row, ["accuracy", "score", "percent", "success", "correct", "best", "result"]);
        const difficultyValue = firstField(row, ["difficulty", "level", "rank", "n", "stage"]);
        const time = safeString(firstField(row, ["date", "time", "timestamp", "createdat", "completedat"]) || "", "", 80);
        const entry = sanitizePortedEntry({
          module,
          source,
          label,
          type,
          time,
          score: parseScore(scoreValue),
          difficulty: finiteNumber(difficultyValue, 0, 0, 10)
        });
        return entry && (entry.score || entry.difficulty || entry.label) ? entry : null;
      }

      function importPortedTrainingData(text, format = "auto", fallbackSource = "external") {
        const raw = String(text || "").trim();
        if (!raw) {
          showToast("Paste JSON or CSV training data first");
          return false;
        }
        try {
          let rows = [];
          if (format === "csv" || (format === "auto" && !raw.startsWith("{") && !raw.startsWith("["))) {
            rows = rowsFromCsv(raw);
          } else {
            rows = flattenedImportedRows(JSON.parse(raw));
          }
          const imported = rows.map((row) => normalizePortedRow(row, fallbackSource)).filter(Boolean);
          if (!imported.length) {
            showToast("No usable rows found");
            return false;
          }
          state.ported.entries = [...imported, ...(state.ported.entries || [])].slice(0, 500);
          state.ported.updatedAt = new Date().toISOString();
          state.ported = sanitizePortedData(state.ported);
          logEvent("import", `Imported ${imported.length} external rows`, `${fallbackSource}; ${Object.keys(state.ported.summary).length} linked modules`);
          saveState();
          renderAll();
          showToast(`Imported ${imported.length} rows`);
          return true;
        } catch (error) {
          console.warn("External data import failed", error);
          showToast("Import failed: check JSON/CSV");
          return false;
        }
      }

      function clearPortedTrainingData() {
        state.ported = sanitizePortedData({ updatedAt: "", entries: [], summary: {} });
        logEvent("privacy", "Cleared imported external data", "ported data only");
        saveState();
        renderAll();
        showToast("Imported data cleared");
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

      function initializeTerminal() {
        if (terminal.booted) return;
        terminal.booted = true;
        terminal.commands = buildTerminalCommands();
        renderTerminalStatus();
        terminalWrite("How to get smart 101 terminal online.", "system");
        terminalWrite("Type help, stats, security, backup, set all 8, cap difficulty 7, train memory, start focus, or boost all 2.", "system");
        updateTerminalSuggest();
      }

      function buildTerminalCommands() {
        const modules = Object.keys(moduleInfo);
        return [
          "help",
          "stats",
          "program",
          "modules",
          "quests",
          "history",
          "hard",
          "normal",
          "research",
          "faq",
          "security",
          "privacy",
          "ported",
          "import data",
          "clear imports",
          "export",
          "backup",
          "copy backup",
          "import backup",
          "wipe confirm",
          "sound",
          "clear",
          "reset terminal",
          "terminal compact",
          "terminal standard",
          "terminal spacious",
          "theme classic",
          "theme matrix",
          "theme neon",
          "theme contrast",
          "vfx off",
          "vfx low",
          "vfx arcade",
          "vfx max",
          "preset brutal",
          "preset balanced",
          "preset calm",
          "set all 7",
          "cap difficulty 8",
          "normalize difficulties",
          "randomize difficulties",
          "set volume 35",
          "set density compact",
          "set depth extreme",
          "set load heavy",
          "set adaptive on",
          "set ported on",
          "set sfx on",
          "set cursor on",
          "set motion full",
          "nback quad",
          "nback stimuli",
          "quad nback",
          "stimulation nback",
          "memory mode quad",
          "memory mode stimuli",
          "challenge systems",
          "daily plan",
          "rrt plan",
          "sources",
          "doctor",
          "boost all 1",
          "boost all 2",
          "lower all 1",
          ...modules.map((key) => `train ${key}`),
          ...modules.map((key) => `start ${key}`),
          ...modules.map((key) => `set ${key} 5`),
          ...modules.map((key) => `info ${key}`)
        ];
      }

      function renderTerminalStatus() {
        if (!$("#terminalProgram")) return;
        const progress = progressionSnapshot();
        $("#terminalProgram").textContent = state.settings.hardMode ? "hard" : "normal";
        $("#terminalDepth").textContent = ["", "focused", "deep", "extreme"][state.settings.problemDepth] || "deep";
        $("#terminalLoad").textContent = ["short", "standard", "heavy"][state.settings.sessionLoad] || "standard";
        $("#terminalRank").textContent = progress.rank;
        const prompt = $("#terminalPrompt");
        if (prompt) prompt.textContent = `smart101:l${levelFromXp(state.xp)}>`;
      }

      function terminalWrite(message, kind = "") {
        const output = $("#terminalOutput");
        if (!output) return;
        const line = document.createElement("div");
        line.className = `terminal-line${kind ? ` is-${kind}` : ""}`;
        line.textContent = message;
        output.appendChild(line);
        while (output.children.length > 260) output.removeChild(output.firstElementChild);
        output.scrollTop = output.scrollHeight;
      }

      function terminalWriteBlock(title, rows, kind = "system") {
        terminalWrite(title, kind);
        rows.forEach((row) => terminalWrite(`  ${row}`));
      }

      function terminalHelp() {
        terminalWriteBlock("Core commands", [
          "stats - XP, level, mastery, rank, and all module difficulties",
          "program - hard mode, problem depth, session load, adaptive status",
          "quests - today's module checklist",
          "modules - compact module table",
          "info <module> - details for one module"
        ]);
        terminalWriteBlock("Control commands", [
          "train <module> - open a module",
          "start <module> - open and start a supported drill",
          "set <module> <1-10> - set stored difficulty",
          "set volume 35 / set depth extreme / set load heavy",
          "terminal compact|standard|spacious - density shortcut",
          "theme classic|matrix|neon|contrast, vfx off|low|arcade|max",
          "preset brutal|balanced|calm",
          "nback quad / nback stimuli - switch Memory Lab modes instantly",
          "challenge systems - launch a d10 brutal challenge",
          "daily plan, rrt plan, sources, doctor",
          "set all <1-10>, cap difficulty <1-10>, normalize difficulties",
          "randomize difficulties - scramble module levels for a fresh block",
          "boost all <1-3> - raise every module",
          "lower all <1-3> - lower every module",
          "hard / normal - switch training program"
        ]);
        terminalWriteBlock("Terminal controls", [
          "Tab completes, Up/Down recalls command history",
          "history - show recent terminal commands",
          "clear - clear output, reset terminal - clear output and command history",
          "faq, security, privacy, research, export, backup, import backup, import data, clear imports, wipe confirm, sound"
        ]);
      }

      function moduleKeyFromInput(value) {
        const normalized = value.toLowerCase();
        const aliases = {
          a: "aim",
          q: "questions",
          quiz: "questions",
          logic: "questions",
          mem: "memory",
          nback: "memory",
          n: "memory",
          stimulation: "memory",
          stimuli: "memory",
          quad: "memory",
          creative: "creativity",
          transfer: "analogy",
          cal: "calibration",
          meta: "calibration",
          spc: "spatial",
          x: "spatial",
          relation: "rrt",
          relational: "rrt",
          matrix: "rrt",
          raven: "rrt"
        };
        return moduleInfo[normalized] ? normalized : aliases[normalized];
      }

      function memoryModeFromInput(value) {
        const normalized = String(value || "").toLowerCase().replace(/[-_ ]/g, "");
        const aliases = {
          dual: "dual",
          double: "dual",
          multi: "multi",
          multipos: "multi",
          position: "multi",
          stimuli: "manipulation",
          stimulus: "manipulation",
          stimulation: "manipulation",
          manipulation: "manipulation",
          manip: "manipulation",
          quad: "quad",
          quadruple: "quad"
        };
        return aliases[normalized];
      }

      function terminalCommandSuggestions(value) {
        const normalized = value.trim().toLowerCase();
        if (!normalized) return terminal.commands.slice(0, 10);
        return terminal.commands.filter((command) => command.startsWith(normalized)).slice(0, 8);
      }

      function updateTerminalSuggest() {
        const box = $("#terminalSuggest");
        const input = $("#terminalInput");
        if (!box || !input) return;
        const suggestions = terminalCommandSuggestions(input.value);
        box.textContent = suggestions.length
          ? `suggest: ${suggestions.join("  |  ")}`
          : "No direct match. Type help for commands.";
      }

      function completeTerminalInput() {
        const input = $("#terminalInput");
        if (!input) return;
        const suggestions = terminalCommandSuggestions(input.value);
        if (!suggestions.length) {
          updateTerminalSuggest();
          playSfx("wrong");
          return;
        }
        const current = input.value.trim().toLowerCase();
        if (suggestions.length === 1 || !current) {
          input.value = suggestions[0];
        } else {
          const shared = commonPrefix(suggestions);
          input.value = shared.length > current.length ? shared : suggestions[0];
        }
        updateTerminalSuggest();
        playSfx("select");
      }

      function commonPrefix(items) {
        if (!items.length) return "";
        let prefix = items[0];
        items.slice(1).forEach((item) => {
          while (!item.startsWith(prefix) && prefix) prefix = prefix.slice(0, -1);
        });
        return prefix;
      }

      function rememberTerminalCommand(command) {
        if (terminal.history[terminal.history.length - 1] !== command) terminal.history.push(command);
        terminal.history = terminal.history.slice(-40);
        terminal.historyIndex = terminal.history.length;
      }

      function recallTerminalHistory(direction) {
        const input = $("#terminalInput");
        if (!input || !terminal.history.length) return;
        terminal.historyIndex = clamp(terminal.historyIndex + direction, 0, terminal.history.length);
        input.value = terminal.historyIndex === terminal.history.length ? "" : terminal.history[terminal.historyIndex];
        updateTerminalSuggest();
      }

      function terminalStatsLines() {
        const progress = progressionSnapshot();
        return [
          `XP ${state.xp} | level ${levelFromXp(state.xp)} | streak ${state.streak} | sessions ${state.sessions}`,
          `mastery ${progress.mastery}% | rank ${progress.rank} | training power ${progress.trainingPower}`,
          `program ${state.settings.hardMode ? "hard" : "normal"} | depth ${["", "focused", "deep", "extreme"][state.settings.problemDepth]} | load ${["short", "standard", "heavy"][state.settings.sessionLoad]} | theme ${state.settings.theme} | vfx ${["off", "low", "arcade", "max"][state.settings.vfx]}`
        ];
      }

      function storageStatus() {
        try {
          const probe = `${STORAGE_KEY}:probe`;
          localStorage.setItem(probe, "1");
          localStorage.removeItem(probe);
          return "available";
        } catch {
          return "blocked";
        }
      }

      function securityLines() {
        return [
          "All progress is saved locally in this browser with localStorage; no password or server account is created by this static app.",
          "Backup and import use sanitized JSON/CSV. Prototype-pollution keys are ignored, numbers are clamped, and text fields are length-limited.",
          "External training exports are normalized locally into module, source, label, score, difficulty, and time. Raw passwords, tokens, and account details are not requested.",
          "Visible session history is escaped before rendering, so tampered local data is treated as text instead of markup.",
          "Use backup before wipe confirm. Wipe confirm removes only this app's local progress key. Clear imports removes only ported external rows.",
          `localStorage: ${storageStatus()} | saved payload: ${Math.round(JSON.stringify(state).length / 1024)} KB | imported rows: ${state.ported.entries.length}`
        ];
      }

      function moduleSummaryLine(key) {
        const module = state.modules[key];
        const ported = state.ported.summary[key];
        return `${moduleInfo[key].code} ${moduleInfo[key].label}: stored d${module.difficulty}, effective d${moduleDifficulty(key)}, ${module.xp} XP, ${module.sessions} sessions, best ${module.best}%, ${module.lastNote}${ported ? `, ported ${ported.count} rows` : ""}`;
      }

      function setMemoryModeFromTerminal(modeToken) {
        const mode = memoryModeFromInput(modeToken);
        if (!mode) return false;
        setMemoryMode(mode);
        setView("memory");
        terminalWrite(`Memory mode set to ${memoryModes[mode].label}. All n-back modes are unlocked.`, "success");
        return true;
      }

      function terminalSourceLines() {
        return [
          "Dunlosky et al. 2013: practice testing and distributed practice have high utility across many learning contexts.",
          "Owen et al. 2010: brain-training gains can be task-specific, so this app reports module performance and avoids claiming general IQ transfer.",
          "Sala and Gobet 2019: broad cognitive-training transfer is limited in meta-analytic evidence, so the app emphasizes specific measured skills.",
          "Karpicke and Blunt 2011: retrieval practice can beat elaborative review on delayed tests, supporting generated answer-first problems.",
          "Kornell and Bjork 2008: interleaving category exemplars can improve induction, supporting mixed generators.",
          "Hattie and Timperley 2007: feedback is most useful when it clarifies goals, current performance, and next actions.",
          "Uttal et al. 2013: spatial skills are trainable, supporting Spatial and Systems transformation tasks.",
          "Koriat 1997: confidence judgments depend on cues, supporting Calibration Lab and Brier-style feedback.",
          "Rohrer and Taylor 2007 / Kornell and Bjork 2008: interleaving improves strategy selection and category discrimination.",
          "Mackey et al. 2011: reasoning training emphasized planning and relational integration for 60-minute sessions, 2 days/week, for 8 weeks.",
          "Cassidy, Roche, and Hayes 2011: automated multiple-exemplar relational frame training used SAME, OPPOSITE, MORE THAN, and LESS THAN frames.",
          "Son, Smith, and Goldstone 2011: simultaneous comparison of simple and complex instances improved relational generalization.",
          "Guerra-Carrillo and Bunge 2018: reasoning practice was associated with relational-thinking efficiency on transitive inference tasks."
        ];
      }

      function dailyPlanLines() {
        const modules = Object.keys(moduleInfo).sort((a, b) => (state.quests[a] ? 1 : 0) - (state.quests[b] ? 1 : 0));
        return modules.slice(0, 5).map((key, index) => {
          const action = index === 0 ? "Start" : "Then";
          return `${action}: ${moduleInfo[key].label} at effective d${moduleDifficulty(key)} - ${state.quests[key] ? "maintenance" : "open quest"}`;
        });
      }

      function rrtPlanLines() {
        return [
          "Block design: 2-4 RRT blocks/week, 8 weeks, 10-20 minutes per block in this app; stop if accuracy drops under 45% twice.",
          "Relation families: same/opposite, more-less, before-after, class inclusion, transitive inference, analogies, proportional relations, matrix rule induction.",
          "Stimuli: start with simple symbolic or verbal instances, then mix in dissimilar surface examples to force structure over appearance.",
          "Progression: increase relation load only after 2 recent blocks at 80%+; drop or hold difficulty when performance collapses.",
          "Transfer policy: the app reports trained-task gains and near-transfer signals; it does not claim guaranteed broad IQ transfer."
        ];
      }

      function doctorLines() {
        const idsOk = Boolean($("#terminalOutput") && $("#memoryGrid") && $("#systemsAnswerGrid"));
        return [
          `DOM critical ids: ${idsOk ? "ok" : "missing"}`,
          `local state modules: ${Object.keys(moduleInfo).every((key) => Boolean(state.modules[key])) ? "ok" : "repair needed"}`,
          `n-back modes: ${Object.keys(memoryModes).map((key) => memoryModes[key].label).join(", ")} all unlocked`,
          `vfx: ${["off", "low", "arcade", "max"][state.settings.vfx]} | theme: ${state.settings.theme}`,
          `history entries: ${state.history.length}`,
          `storage: ${storageStatus()} | payload ${Math.round(JSON.stringify(state).length / 1024)} KB`
        ];
      }

      function startModuleFromTerminal(key) {
        setView(moduleInfo[key].view);
        const starters = {
          aim: startAimRound,
          questions: startQuiz,
          memory: startMemoryStream,
          focus: startFocusSet,
          creativity: startCreativeSprint,
          spatial: startSpatialSet,
          calibration: startCalibrationSet,
          systems: startSystemsSet,
          rrt: startRrtSet
        };
        if (starters[key]) {
          starters[key]();
          terminalWrite(`Started ${moduleInfo[key].label}.`, "success");
        } else {
          terminalWrite(`Opened ${moduleInfo[key].label}. This module needs a written response before scoring.`, "system");
        }
      }

      function adjustAllDifficulties(delta) {
        Object.keys(moduleInfo).forEach((key) => {
          state.modules[key].difficulty = clamp(state.modules[key].difficulty + delta, 1, 10);
          state.modules[key].lastNote = delta > 0 ? "Difficulty boosted from terminal." : "Difficulty lowered from terminal.";
        });
        saveState();
        renderAll();
        terminalWrite(`${delta > 0 ? "Boosted" : "Lowered"} all stored difficulties by ${Math.abs(delta)}.`, "success");
        playSfx("complete");
      }

      function setAllDifficulties(value, note = "Difficulty set from terminal bulk control.") {
        const difficulty = Math.round(finiteNumber(value, NaN, 1, 10));
        if (!Number.isFinite(difficulty)) return false;
        Object.keys(moduleInfo).forEach((key) => {
          state.modules[key].difficulty = difficulty;
          state.modules[key].lastNote = note;
        });
        saveState();
        renderAll();
        terminalWrite(`All modules set to stored d${difficulty}.`, "success");
        playSfx("complete");
        return true;
      }

      function capAllDifficulties(value) {
        const capValue = Math.round(finiteNumber(value, NaN, 1, 10));
        if (!Number.isFinite(capValue)) return false;
        Object.keys(moduleInfo).forEach((key) => {
          state.modules[key].difficulty = Math.min(state.modules[key].difficulty, capValue);
          state.modules[key].lastNote = `Difficulty capped at d${capValue} from terminal.`;
        });
        saveState();
        renderAll();
        terminalWrite(`All stored difficulties capped at d${capValue}.`, "success");
        playSfx("complete");
        return true;
      }

      function randomizeDifficulties() {
        Object.keys(moduleInfo).forEach((key) => {
          state.modules[key].difficulty = Math.floor(Math.random() * 10) + 1;
          state.modules[key].lastNote = "Difficulty randomized from terminal.";
        });
        saveState();
        renderAll();
        terminalWrite("All module difficulties randomized from d1-d10.", "success");
        playSfx("level");
      }

      function applyProgramPreset(name) {
        const preset = String(name || "").toLowerCase();
        if (preset === "brutal") {
          state.settings.hardMode = true;
          state.settings.problemDepth = 3;
          state.settings.sessionLoad = 2;
          state.settings.vfx = 3;
        } else if (preset === "calm") {
          state.settings.hardMode = false;
          state.settings.problemDepth = 1;
          state.settings.sessionLoad = 0;
          state.settings.vfx = 1;
        } else if (preset === "balanced" || preset === "normal") {
          state.settings.hardMode = preset !== "normal";
          state.settings.problemDepth = 2;
          state.settings.sessionLoad = 1;
          state.settings.vfx = 2;
        } else if (preset === "hard") {
          state.settings.hardMode = true;
          state.settings.problemDepth = 3;
          state.settings.sessionLoad = 2;
        } else {
          return false;
        }
        saveState();
        renderAll();
        playSfx(preset === "brutal" ? "level" : "complete");
        return true;
      }

      function setThemeMode(theme) {
        const value = String(theme || "").toLowerCase();
        if (!["classic", "matrix", "neon", "contrast"].includes(value)) return false;
        state.settings.theme = value;
        saveState();
        renderAll();
        playSfx("select");
        return true;
      }

      function setVfxLevel(value) {
        const map = { off: 0, low: 1, arcade: 2, max: 3 };
        const level = map[String(value).toLowerCase()] ?? finiteNumber(value, NaN, 0, 3);
        if (!Number.isFinite(level)) return false;
        state.settings.vfx = Math.round(level);
        saveState();
        renderAll();
        triggerVfx("level");
        return true;
      }

      function setTerminalSetting(name, value) {
        const key = String(name || "").toLowerCase();
        const token = String(value || "").toLowerCase();
        const on = ["on", "true", "yes", "1", "full"].includes(token);
        const off = ["off", "false", "no", "0", "low"].includes(token);
        if (key === "volume") {
          const raw = finiteNumber(value, state.settings.volume * 100, 0, 100);
          state.settings.volume = raw <= 1 ? raw : raw / 100;
        }
        else if (key === "density") state.settings.density = { compact: 0, standard: 1, spacious: 2 }[token] ?? Math.round(finiteNumber(value, state.settings.density, 0, 2));
        else if (key === "depth") state.settings.problemDepth = { focused: 1, deep: 2, extreme: 3 }[token] ?? Math.round(finiteNumber(value, state.settings.problemDepth, 1, 3));
        else if (key === "load") state.settings.sessionLoad = { short: 0, standard: 1, heavy: 2 }[token] ?? Math.round(finiteNumber(value, state.settings.sessionLoad, 0, 2));
        else if (key === "adaptive") state.settings.adaptive = on ? true : off ? false : state.settings.adaptive;
        else if (key === "ported" || key === "imports") state.settings.usePortedData = on ? true : off ? false : state.settings.usePortedData;
        else if (key === "sfx") state.settings.sfx = on ? true : off ? false : state.settings.sfx;
        else if (key === "cursor") state.settings.customCursor = on ? true : off ? false : state.settings.customCursor;
        else if (key === "motion") state.settings.lowMotion = token === "low" || token === "reduced";
        else if (key === "hard") state.settings.hardMode = on ? true : off ? false : state.settings.hardMode;
        else if (key === "vfx") return setVfxLevel(value);
        else if (key === "theme") return setThemeMode(value);
        else return false;
        state.settings = sanitizeSettings(state.settings);
        saveState();
        renderAll();
        playSfx("complete");
        return true;
      }

      function runTerminalCommand(raw) {
        const command = raw.trim();
        if (!command) return;
        rememberTerminalCommand(command);
        terminalWrite(`${$("#terminalPrompt")?.textContent || "smart101>"} ${command}`, "command");
        const tokens = command.toLowerCase().split(/\s+/);
        const [verb, second, third, fourth] = tokens;
        if (verb === "help") {
          terminalHelp();
          return;
        }
        if (verb === "clear" && second === "imports") {
          clearPortedTrainingData();
          terminalWrite("Imported external rows cleared. Local sessions remain.", "success");
          return;
        }
        if (verb === "clear") {
          $("#terminalOutput").innerHTML = "";
          return;
        }
        if (verb === "reset" && second === "terminal") {
          $("#terminalOutput").innerHTML = "";
          terminal.history = [];
          terminal.historyIndex = -1;
          terminalWrite("Terminal reset. Command history cleared.", "system");
          return;
        }
        if (verb === "stats") {
          terminalWriteBlock("Training stats", terminalStatsLines(), "system");
          terminalWriteBlock("Module table", Object.keys(moduleInfo).map(moduleSummaryLine));
          renderTerminalStatus();
          return;
        }
        if (verb === "faq") {
          setView("faq");
          terminalWrite("Opened FAQ. Try security, privacy, backup, import backup, or wipe confirm for data controls.", "system");
          return;
        }
        if (verb === "security" || verb === "privacy") {
          terminalWriteBlock(verb === "security" ? "Security model" : "Privacy model", securityLines(), "system");
          return;
        }
        if (verb === "ported") {
          const rows = Object.keys(state.ported.summary || {}).map((key) => {
            const item = state.ported.summary[key];
            return `${moduleInfo[key].label}: ${item.count} rows, ${Math.round(item.avgScore * 100)}% avg, suggested d${portedSuggestedDifficulty(key) || Math.round(item.avgDifficulty || 1)}`;
          });
          terminalWriteBlock("Ported training data", rows.length ? rows : ["No external data imported yet."], "system");
          return;
        }
        if (verb === "program") {
          terminalWriteBlock("Current program", [
            `hard mode: ${state.settings.hardMode ? "on" : "off"}`,
            `adaptive difficulty: ${state.settings.adaptive ? "on" : "off"}`,
            `problem depth: ${["", "focused", "deep", "extreme"][state.settings.problemDepth] || "deep"}`,
            `session load: ${["short", "standard", "heavy"][state.settings.sessionLoad] || "standard"}`,
            `theme: ${state.settings.theme}`,
            `vfx: ${["off", "low", "arcade", "max"][state.settings.vfx]}`,
            `sfx volume: ${Math.round(state.settings.volume * 100)}%`,
            `imported data signal: ${state.settings.usePortedData ? "on" : "off"} (${state.ported.entries.length} rows)`,
            `effective difficulty adds ${state.settings.hardMode ? "+2 hidden load" : "+0 hidden load"}`
          ]);
          return;
        }
        if (verb === "terminal" && ["compact", "standard", "spacious"].includes(second)) {
          setTerminalSetting("density", second);
          terminalWrite(`Interface density set to ${second}.`, "success");
          return;
        }
        if (verb === "modules" || verb === "ls") {
          terminalWriteBlock("Modules", Object.keys(moduleInfo).map(moduleSummaryLine), "system");
          return;
        }
        if (verb === "quests") {
          terminalWriteBlock("Daily quests", Object.keys(moduleInfo).map((key) => {
            return `${state.quests[key] ? "[done]" : "[open]"} ${moduleInfo[key].short}: ${moduleInfo[key].quest}`;
          }), "system");
          return;
        }
        if (verb === "history") {
          terminalWriteBlock("Recent commands", terminal.history.length ? terminal.history.slice(-12).map((item, index) => `${index + 1}. ${item}`) : ["No commands yet."], "system");
          return;
        }
        if (verb === "sources" || verb === "studies" || verb === "research") {
          if (verb === "research") setView("research");
          terminalWriteBlock("Study base", terminalSourceLines(), "system");
          return;
        }
        if (verb === "doctor") {
          terminalWriteBlock("System doctor", doctorLines(), "system");
          return;
        }
        if (verb === "import" && second === "data") {
          setView("terminal");
          $("#portedDataBox").focus();
          terminalWrite("Paste exported training JSON/CSV into Data Port, choose the source, then press Import external data.", "system");
          return;
        }
        if (verb === "backup" || (verb === "copy" && second === "backup")) {
          copyBackupData();
          terminalWrite("Backup JSON sent to clipboard when browser permissions allow it.", "system");
          return;
        }
        if (verb === "import" && second === "backup") {
          setView("terminal");
          $("#terminalImportBox").focus();
          terminalWrite("Paste backup JSON into the Import backup box, then press Import.", "system");
          return;
        }
        if (verb === "wipe" && second === "confirm") {
          localStorage.removeItem(STORAGE_KEY);
          state = refreshDailyState(clone(defaultState));
          saveState();
          renderAll();
          terminalWrite("Local training progress wiped for this app key only.", "success");
          playSfx("complete");
          return;
        }
        if (verb === "daily" && second === "plan") {
          terminalWriteBlock("Daily training plan", dailyPlanLines(), "system");
          return;
        }
        if (verb === "rrt" && second === "plan") {
          setView("rrt");
          terminalWriteBlock("Relational reasoning training plan", rrtPlanLines(), "system");
          return;
        }
        if (verb === "nback") {
          if (!setMemoryModeFromTerminal(second || "quad")) {
            terminalWrite("Usage: nback dual | multi | stimuli | quad", "error");
            playSfx("wrong");
          }
          return;
        }
        if ((verb === "quad" || verb === "stimuli" || verb === "stimulation") && second === "nback") {
          setMemoryModeFromTerminal(verb);
          return;
        }
        if (verb === "memory" && second === "mode") {
          if (!setMemoryModeFromTerminal(third)) {
            terminalWrite("Usage: memory mode dual | multi | stimuli | quad", "error");
            playSfx("wrong");
          }
          return;
        }
        if (verb === "challenge") {
          const key = moduleKeyFromInput(second || "systems") || "systems";
          state.modules[key].difficulty = 10;
          state.modules[key].lastNote = "Brutal challenge set from terminal.";
          applyProgramPreset("brutal");
          startModuleFromTerminal(key);
          terminalWrite(`Challenge launched: ${moduleInfo[key].label} at stored d10 plus brutal preset.`, "success");
          return;
        }
        if (verb === "info") {
          const key = moduleKeyFromInput(second || "");
          if (!key) {
            terminalWrite("Usage: info <module>", "error");
            playSfx("wrong");
            return;
          }
          terminalWriteBlock(moduleInfo[key].label, [
            moduleInfo[key].description,
            `skill: ${moduleInfo[key].skill}`,
            `quest: ${moduleInfo[key].quest}`,
            moduleSummaryLine(key)
          ], "system");
          return;
        }
        if (verb === "hard") {
          applyProgramPreset("hard");
          terminalWrite("Hard program active: +2 effective difficulty, extreme problem depth, heavy session load.", "system");
          return;
        }
        if (verb === "normal") {
          applyProgramPreset("normal");
          terminalWrite("Normal program active: stored difficulties remain, hidden hard bonus removed.", "system");
          return;
        }
        if (verb === "preset") {
          if (!applyProgramPreset(second)) {
            terminalWrite("Usage: preset brutal | balanced | calm", "error");
            playSfx("wrong");
            return;
          }
          terminalWrite(`Applied ${second} preset.`, "success");
          return;
        }
        if (verb === "theme") {
          if (!setThemeMode(second)) {
            terminalWrite("Usage: theme classic | matrix | neon | contrast", "error");
            playSfx("wrong");
            return;
          }
          terminalWrite(`Theme set to ${state.settings.theme}.`, "success");
          return;
        }
        if (verb === "vfx") {
          if (!setVfxLevel(second)) {
            terminalWrite("Usage: vfx off | low | arcade | max | 0-3", "error");
            playSfx("wrong");
            return;
          }
          terminalWrite(`VFX set to ${["off", "low", "arcade", "max"][state.settings.vfx]}.`, "success");
          return;
        }
        if (verb === "train" || verb === "open" || verb === "cd") {
          const key = moduleKeyFromInput(second || "");
          if (!key) {
            terminalWrite("Unknown module. Try train memory, train spatial, or train calibration.", "error");
            playSfx("wrong");
            return;
          }
          setView(moduleInfo[key].view);
          terminalWrite(`Opened ${moduleInfo[key].label}.`, "system");
          return;
        }
        if (verb === "start" || verb === "run") {
          const key = moduleKeyFromInput(second || "");
          if (!key) {
            terminalWrite("Usage: start <module>", "error");
            playSfx("wrong");
            return;
          }
          startModuleFromTerminal(key);
          return;
        }
        if (verb === "set") {
          if (second === "all") {
            if (!setAllDifficulties(third)) {
              terminalWrite("Usage: set all <1-10>", "error");
              playSfx("wrong");
            }
            return;
          }
          if (setTerminalSetting(second, third)) {
            terminalWrite(`${second} set to ${third}.`, "success");
            return;
          }
          const key = moduleKeyFromInput(second || "");
          const value = clamp(Number(third), 1, 10);
          if (!key || Number.isNaN(value)) {
            terminalWrite("Usage: set <module> <1-10>", "error");
            playSfx("wrong");
            return;
          }
          state.modules[key].difficulty = value;
          state.modules[key].lastNote = "Difficulty set manually from terminal.";
          saveState();
          renderAll();
          terminalWrite(`${moduleInfo[key].label} set to stored d${value}, effective d${moduleDifficulty(key)}.`, "system");
          playSfx("complete");
          return;
        }
        if (verb === "cap" && second === "difficulty") {
          if (!capAllDifficulties(third)) {
            terminalWrite("Usage: cap difficulty <1-10>", "error");
            playSfx("wrong");
          }
          return;
        }
        if (verb === "normalize" && (second === "difficulties" || second === "difficulty" || !second)) {
          if (!setAllDifficulties(third || 5, "Difficulty normalized from terminal.")) {
            terminalWrite("Usage: normalize difficulties <optional 1-10>", "error");
            playSfx("wrong");
          }
          return;
        }
        if (verb === "randomize" && (second === "difficulties" || second === "difficulty")) {
          randomizeDifficulties();
          return;
        }
        if (verb === "boost" || verb === "lower") {
          const amountToken = second === "all" ? third : second;
          const amount = clamp(Number(amountToken || 1), 1, 3);
          if (Number.isNaN(amount)) {
            terminalWrite(`Usage: ${verb} all <1-3>`, "error");
            playSfx("wrong");
            return;
          }
          adjustAllDifficulties(verb === "boost" ? amount : -amount);
          return;
        }
        if (verb === "export") {
          copyProgressReport();
          terminalWrite("Progress report sent to clipboard when browser permissions allow it.", "system");
          return;
        }
        if (verb === "sound") {
          playSfx("level");
          terminalWrite("Played level SFX.", "system");
          return;
        }
        terminalWrite("Unknown command. Type help.", "error");
        playSfx("wrong");
      }

      function setupCanvas() {
        const canvas = $("#fieldCanvas");
        const ctx = canvas.getContext("2d");
        let idleFrame = 0;
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
          if (state.settings.lowMotion || currentView !== "aim") {
            idleFrame = window.setTimeout(() => window.requestAnimationFrame(draw), 500);
            return;
          }
          ctx.clearRect(0, 0, rect.width, rect.height);
          particles.forEach((particle, index) => {
            particle.x += particle.vx * (1 + moduleDifficulty("aim") * 0.12);
            particle.y += particle.vy * (1 + moduleDifficulty("aim") * 0.12);
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

        window.addEventListener("resize", () => {
          window.clearTimeout(idleFrame);
          resizeCanvas();
        });
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
        $$(".nav-btn").forEach((button) => on(button, "click", () => setView(button.dataset.view), `open ${button.dataset.view}`));
        $$("[data-start-view]").forEach((button) => on(button, "click", () => setView(button.dataset.startView), `start ${button.dataset.startView}`));
        on($("#startAim"), "click", startAimRound, "start aim");
        on($("#stopAim"), "click", stopAimRound, "stop aim");
        on($("#aimTarget"), "click", hitTarget, "hit target");
        on($("#aimStage"), "click", missTarget, "miss target");
        on($("#startQuiz"), "click", startQuiz, "start quiz");
        on($("#nextQuestion"), "click", nextQuestion, "next question");
        on($("#startMemory"), "click", startMemoryStream, "start memory");
        on($("#stopMemory"), "click", stopMemoryStream, "stop memory");
        $$("[data-memory-mode]").forEach((button) => on(button, "click", () => setMemoryMode(button.dataset.memoryMode), `memory ${button.dataset.memoryMode}`));
        on($("#memorySymbolMatch"), "click", () => answerMemory("symbol"), "memory symbol");
        on($("#memoryPositionMatch"), "click", () => answerMemory("position"), "memory position");
        on($("#memoryColorMatch"), "click", () => answerMemory("color"), "memory color");
        on($("#memoryTransformMatch"), "click", () => answerMemory("transform"), "memory transform");
        on($("#memoryNoMatch"), "click", () => answerMemory("none"), "memory no match");
        on($("#memorySubmit"), "click", submitMemoryAnswer, "memory submit");
        on($("#startFocus"), "click", startFocusSet, "start focus");
        on($("#stopFocus"), "click", stopFocusSet, "stop focus");
        $$(".color-btn").forEach((button) => on(button, "click", () => answerFocus(button.dataset.color), `focus ${button.dataset.color}`));
        on($("#startCreative"), "click", startCreativeSprint, "start creative");
        on($("#newCreativePrompt"), "click", generateCreativePrompt, "new prompt");
        on($("#submitCreative"), "click", scoreCreativeSprint, "score creative");
        on($("#clearCreative"), "click", () => {
          $("#ideaBox").value = "";
          renderCreativeConfig();
        }, "clear creative");
        on($("#ideaBox"), "input", renderCreativeConfig, "idea input");
        $$("[data-creative-method]").forEach((button) => {
          on(button, "click", () => {
            $$("[data-creative-method]").forEach((item) => item.classList.remove("is-active"));
            button.classList.add("is-active");
            creativeMethod = button.dataset.creativeMethod;
            generateCreativePrompt();
          }, `creative ${button.dataset.creativeMethod}`);
        });
        on($("#generateAnalogy"), "click", generateAnalogyChallenge, "generate analogy");
        on($("#submitAnalogy"), "click", scoreAnalogy, "score analogy");
        ["#mapOne", "#mapTwo", "#mapThree", "#mapFour", "#analogyProblem"].forEach((selector) => {
          on($(selector), "input", renderAnalogyStats, `${selector} input`);
        });
        on($("#startSpatial"), "click", startSpatialSet, "start spatial");
        on($("#nextSpatial"), "click", nextSpatialProblem, "next spatial");
        on($("#startCalibration"), "click", startCalibrationSet, "start calibration");
        on($("#nextCalibration"), "click", nextCalibrationQuestion, "next calibration");
        on($("#confidenceSlider"), "input", renderCalibrationStats, "confidence slider");
        on($("#startSystems"), "click", startSystemsSet, "start systems");
        on($("#nextSystems"), "click", nextSystemsProblem, "next systems");
        on($("#systemsModeSelect"), "change", () => setSystemsMode($("#systemsModeSelect").value), "systems mode");
        on($("#systemsDetailSelect"), "change", () => {
          state.settings.problemDepth = Number($("#systemsDetailSelect").value);
          saveState();
          renderAll();
        }, "systems detail");
        on($("#startRrt"), "click", startRrtSet, "start rrt");
        on($("#nextRrt"), "click", nextRrtProblem, "next rrt");
        on($("#rrtModeSelect"), "change", () => setRrtMode($("#rrtModeSelect").value), "rrt mode");
        on($("#exportProgress"), "click", copyProgressReport, "export progress");
        on($("#resetProgress"), "click", resetProgressData, "reset progress");
        on($("#saveSettings"), "click", saveSettingsFromForm, "save settings");
        on($("#quickSettings"), "click", () => setView("settings"), "quick settings");
        on($("#quickSound"), "click", () => playSfx("level"), "quick sound");
        on($("#quickJumpSelect"), "change", () => setView($("#quickJumpSelect").value), "quick jump");
        on($("#quickProgramSelect"), "change", () => {
          applyProgramPreset($("#quickProgramSelect").value);
          renderAll();
        }, "quick program");
        on($("#quickVfxSelect"), "change", () => setVfxLevel($("#quickVfxSelect").value), "quick vfx");
        on($("#settingVolume"), "input", () => {
          state.settings.volume = Number($("#settingVolume").value) / 100;
          $("#volumeLabel").textContent = `${Math.round(state.settings.volume * 100)}%`;
        }, "volume");
        on($("#settingTheme"), "input", () => {
          $("#densityLabel").textContent = ["compact", "standard", "spacious"][Number($("#settingTheme").value)] || "standard";
        }, "density");
        on($("#settingProblemDepth"), "input", () => {
          $("#problemDepthLabel").textContent = ["", "focused", "deep", "extreme"][Number($("#settingProblemDepth").value)] || "deep";
        }, "problem depth");
        on($("#settingSessionLoad"), "input", () => {
          $("#sessionLoadLabel").textContent = ["short", "standard", "heavy"][Number($("#settingSessionLoad").value)] || "standard";
        }, "session load");
        on($("#settingVfx"), "input", () => {
          $("#vfxLabel").textContent = ["off", "low", "arcade", "max"][Number($("#settingVfx").value)] || "arcade";
        }, "vfx setting");
        on($("#settingThemeMode"), "change", () => {
          $("#themeModeLabel").textContent = $("#settingThemeMode").value;
        }, "theme setting");
        on($("#terminalRun"), "click", () => {
          runTerminalCommand($("#terminalInput").value);
          $("#terminalInput").value = "";
          updateTerminalSuggest();
          $("#terminalInput").focus();
        }, "terminal run");
        on($("#terminalInput"), "keydown", (event) => {
          if (event.key === "Tab") {
            event.preventDefault();
            completeTerminalInput();
            return;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            recallTerminalHistory(-1);
            return;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            recallTerminalHistory(1);
            return;
          }
          if (event.key !== "Enter") return;
          runTerminalCommand($("#terminalInput").value);
          $("#terminalInput").value = "";
          updateTerminalSuggest();
        }, "terminal input");
        on($("#terminalInput"), "input", updateTerminalSuggest, "terminal suggest");
        on($("#terminalHelp"), "click", terminalHelp, "terminal help");
        on($("#terminalClear"), "click", () => {
          $("#terminalOutput").innerHTML = "";
        }, "terminal clear");
        on($("#terminalApplyCustomize"), "click", () => {
          const key = $("#terminalModuleSelect").value;
          const difficulty = Number($("#terminalDifficultySelect").value);
          state.modules[key].difficulty = difficulty;
          state.modules[key].lastNote = "Difficulty set from terminal customizer.";
          state.settings.theme = $("#terminalThemeSelect").value;
          state.settings.vfx = Number($("#terminalVfxSelect").value);
          state.settings.density = Number($("#terminalDensitySelect").value);
          state.settings.problemDepth = Number($("#terminalDepthSelect").value);
          state.settings.sessionLoad = Number($("#terminalLoadSelect").value);
          state.settings.volume = Number($("#terminalVolumeSelect").value) / 100;
          state.settings.adaptive = $("#terminalAdaptiveToggle").checked;
          state.settings.usePortedData = $("#terminalUsePortedToggle").checked;
          state.settings.sfx = $("#terminalSfxToggle").checked;
          state.settings.customCursor = $("#terminalCursorToggle").checked;
          state.settings = sanitizeSettings(state.settings);
          saveState();
          renderAll();
          terminalWrite(`Customizer applied: ${moduleInfo[key].label} d${difficulty}, theme ${state.settings.theme}, density ${["compact", "standard", "spacious"][state.settings.density]}, depth ${["", "focused", "deep", "extreme"][state.settings.problemDepth]}, load ${["short", "standard", "heavy"][state.settings.sessionLoad]}, vfx ${["off", "low", "arcade", "max"][state.settings.vfx]}.`, "success");
          playSfx("complete");
        }, "terminal apply customize");
        on($("#terminalStartSelected"), "click", () => startModuleFromTerminal($("#terminalModuleSelect").value), "terminal start selected");
        on($("#terminalCopyBackup"), "click", () => {
          copyBackupData();
          terminalWrite("Backup JSON sent to clipboard when browser permissions allow it.", "system");
        }, "terminal copy backup");
        on($("#terminalImportBackup"), "click", () => {
          const imported = importBackupFromText($("#terminalImportBox").value);
          terminalWrite(imported ? "Backup imported and state re-rendered." : "Backup import failed. Check the JSON text.", imported ? "success" : "error");
        }, "terminal import backup");
        on($("#importPortedData"), "click", () => {
          const imported = importPortedTrainingData($("#portedDataBox").value, $("#portedFormatSelect").value, $("#portedSourceSelect").value);
          terminalWrite(imported ? "External training rows imported and linked to modules." : "External data import failed.", imported ? "success" : "error");
        }, "terminal import ported");
        on($("#clearPortedData"), "click", () => {
          clearPortedTrainingData();
          terminalWrite("Imported external rows cleared. Local app sessions remain.", "success");
        }, "terminal clear ported");
        $$("[data-terminal-command]").forEach((button) => {
          on(button, "click", () => {
            $("#terminalInput").value = button.dataset.terminalCommand;
            runTerminalCommand(button.dataset.terminalCommand);
            $("#terminalInput").value = "";
            updateTerminalSuggest();
          }, `terminal quick ${button.dataset.terminalCommand}`);
        });
        $$("[data-sfx-test]").forEach((button) => on(button, "click", () => playSfx(button.dataset.sfxTest), `sfx ${button.dataset.sfxTest}`));
        on(document, "pointerdown", () => {
          armAudio();
          $("#customCursor").classList.add("is-pressing");
        }, "pointer down");
        on(document, "pointerup", () => $("#customCursor").classList.remove("is-pressing"), "pointer up");
        on(document, "pointermove", (event) => {
          const cursor = $("#customCursor");
          cursor.style.transform = `translate(${event.clientX - 9}px, ${event.clientY - 9}px)`;
        }, "pointer move");
      }

      bindEvents();
      setupCanvas();
      setupVfx();
      initializeTerminal();
      generateCreativePrompt();
      generateAnalogyChallenge();
      renderAll();
      renderMemoryCard();
      applySettings();
      saveState();
