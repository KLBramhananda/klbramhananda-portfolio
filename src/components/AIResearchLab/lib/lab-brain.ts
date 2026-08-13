/**
 * Synthetic "lab brain" — a deterministic, fully-local reply engine for the
 * TALK TO AI panel.
 *
 * Every answer is produced by keyword matching over the lab's module catalogue.
 * No external model is called, nothing is transmitted, and no randomness is
 * involved: the same question always yields the same (stable) answer.
 */

export type LabReply = {
  text: string;
  /** Module code the reply is attributed to (CORE, AGNT, EXPT, VOX, …). */
  module: string;
  /** Optional follow-up the visitor can try next. */
  hint?: string;
};

type Intent = {
  test: RegExp;
  variants: string[];
  module: string;
  hint?: string;
};

const INTENTS: Intent[] = [
  {
    test: /^(hi|hello|hey|yo|greetings|hiya|good\s*(morning|afternoon|evening))\b/i,
    variants: [
      "Hello — I'm RK-01, the lab console. Ask about the experiments, the agent, the traffic dial, or system status.",
      "Hey there. I'm wired into the lab modules — what would you like to explore?",
    ],
    module: "VOX",
  },
  {
    test: /\b(who are you|your name|what are you|are you real|are you a robot|who made you)\b/i,
    variants: [
      "I'm RK-01, a compact console assistant embedded in the BK AI Research Lab. I'm an interface over the synthetic modules — local logic only, no external model.",
    ],
    module: "ROBO",
  },
  {
    test: /\b(how are you|status|health|load|systems nominal|are you ok|all good|everything ok)\b/i,
    variants: [
      "All systems nominal. The core is linked, 9 modules are registered, and the environment is an isolated synthetic sandbox.",
      "Running green. Core active, modules linked, data plane isolated — nothing touches production.",
    ],
    module: "CORE",
  },
  {
    test: /\b(thanks|thank you|cheers|appreciate)\b/i,
    variants: [
      "Anytime. The experiment chamber is right below when you're ready to poke around.",
    ],
    module: "VOX",
  },
  {
    test: /\b(bye|goodbye|see you|exit)\b/i,
    variants: [
      "Leaving so soon? The core stays warm — come back and run an experiment anytime.",
    ],
    module: "VOX",
  },
  {
    test: /\b(inventory|reorder|stock|supply|warehouse|check the agent)\b/i,
    variants: [
      "Good one — that's an Agent task. Hand the agent a task like 'check inventory' in EXPT/03 and watch it pick the inventory tool.",
    ],
    module: "AGNT",
    hint: "Open EXPT/03 — AI Agent",
  },
  {
    test: /\b(agent|tool call|toolkit|task)\b/i,
    variants: [
      "The AI Agent experiment takes a task, plans its steps, evaluates its toolkit and invokes the best-fit tool — with a full audit trail.",
      "Give the agent a task in EXPT/03 and it will plan, select a tool, call it and report back. All simulated.",
    ],
    module: "AGNT",
    hint: "Open EXPT/03 — AI Agent",
  },
  {
    test: /\b(rag|retrieval|embedding|vector|knowledge base|ask the lab)\b/i,
    variants: [
      "RAG / Retrieval traces a question from embedding to vector search to a grounded answer over a small synthetic knowledge base.",
    ],
    module: "EXPT",
    hint: "Open EXPT/02 — RAG / Retrieval",
  },
  {
    test: /\b(reason|reasoning|chain of thought|think|decision|problem)\b/i,
    variants: [
      "The AI Reasoning experiment picks a business problem, parses the constraints, scores options and commits to a plan — a synthetic chain of thought.",
    ],
    module: "EXPT",
    hint: "Open EXPT/01 — AI Reasoning",
  },
  {
    test: /\b(fail|failure|outage|circuit|fallback|incident|down|degraded|broken)\b/i,
    variants: [
      "Fail a service in the System Failure experiment and the watchdog will flag the anomaly, open the circuit breaker and reroute to a standby.",
    ],
    module: "EXPT",
    hint: "Open EXPT/04 — System Failure",
  },
  {
    test: /\b(traffic|load test|scale|stress|requests per second|rps|congestion|queue)\b/i,
    variants: [
      "Crank the High Traffic dial past capacity and the fleet will spill into the queue, drop excess work and auto-scale to catch up.",
    ],
    module: "EXPT",
    hint: "Open EXPT/05 — High Traffic",
  },
  {
    test: /\b(memory|recall|remember|conversation history|knowledge store)\b/i,
    variants: [
      "The Memory module experiments with short and long-term recall — embeddings, vector indexes and cross-module links.",
    ],
    module: "MEM",
  },
  {
    test: /\b(voice|talk|mic|microphone|speech|listen|say something)\b/i,
    variants: [
      "You're talking to it — speak into the mic or use the text field. Recognition runs through your browser; I answer from local logic.",
    ],
    module: "VOX",
  },
  {
    test: /\b(experiment|chamber|demo|showcase|try|run something)\b/i,
    variants: [
      "The Experiment Chamber holds five controlled simulations: Reasoning, RAG, Agent, System Failure and High Traffic. Pick a tab and run one.",
    ],
    module: "EXPT",
    hint: "Open the Experiment Chamber",
  },
  {
    test: /\b(help|what can you do|what should i|suggest|guide|tour)\b/i,
    variants: [
      "Try: 'how healthy are the systems?', 'check inventory', 'what is RAG?', or 'crank up the traffic'. I can point you at any experiment.",
    ],
    module: "VOX",
    hint: "Try: 'check inventory'",
  },
];

const FALLBACK: LabReply = {
  text: "This is RK-01 — everything I answer is synthesized locally from the lab's modules. Try asking about the agent, the RAG pipeline, or the traffic dial, or say 'help'.",
  module: "CORE",
  hint: "Say 'help' for a tour",
};

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function respondToLabQuery(input: string): LabReply {
  const q = input.trim().toLowerCase();
  for (const intent of INTENTS) {
    if (intent.test.test(q)) {
      const text = intent.variants[hash(q) % intent.variants.length];
      return { text, module: intent.module, hint: intent.hint };
    }
  }
  return FALLBACK;
}