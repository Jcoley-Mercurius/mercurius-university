export type TrainingActivityType = "learn" | "practice" | "certification";

export interface TrainingLesson {
  readonly title: string;
  readonly summary: string;
  readonly keyPoints: readonly string[];
  readonly body: readonly { readonly heading: string; readonly content: readonly string[] }[];
  readonly durationMinutes: number;
  readonly resourceLinks?: readonly { readonly label: string; readonly href: string }[];
}

export interface TrainingMilestone {
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly estimatedMinutes: number;
  readonly type: TrainingActivityType;
  readonly actionLabel: string;
  readonly lesson?: TrainingLesson;
  readonly practiceScenarioId?: string;
  readonly requiresPassingScore?: number;
  readonly locked?: boolean;
}

export interface TrainingModule {
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly whyItMatters: string;
  readonly objectives: readonly string[];
  readonly milestones: readonly TrainingMilestone[];
}

const dentalScenarioId = "6d455243-5552-4955-b300-000000000001";
const wellnessScenarioId = "6d455243-5552-4955-b300-000000000002";

const lessons = {
  orientationWelcome: {
    title: "How your Mercurius ramp works",
    summary: "Your learning path combines short lessons, deliberate practice, and visible progress toward quote readiness.",
    keyPoints: ["Learn the concept before practicing it", "Use feedback to guide the next attempt", "Progress belongs to your rep profile"],
    body: [{ heading: "Use the loop", content: ["Move through Learn, Practice, and Certification activities in order when the skill is new. A completed lesson means you understand the standard; practice is where you prove you can apply it.", "Return to lessons whenever a scorecard reveals a gap. Completion is a checkpoint, not a reason to stop reviewing."] }],
    durationMinutes: 2,
  },
  orientationWorkspace: {
    title: "Your three-part rep workspace",
    summary: "Dashboard, Training Hub, and Quote Lab each support a different part of the sales workflow.",
    keyPoints: ["Dashboard shows your recent activity", "Training develops judgment", "Quote Lab builds and saves recommendations"],
    body: [{ heading: "Know where to go", content: ["Use Dashboard as your home base, Training Hub to study and practice, and Quote Lab when you need to build a recommendation. Practice Mode uses fictional scenarios; Live Mode is for real vendor work."] }],
    durationMinutes: 2,
    resourceLinks: [{ label: "Visit Dashboard", href: "/dashboard" }],
  },
  learningGoal: {
    title: "Set a useful learning goal",
    summary: "A specific behavior is easier to practice and coach than a broad goal like ‘get better at sales.’",
    keyPoints: ["Choose one observable behavior", "Connect it to a real rep outcome", "Decide how you will practice it"],
    body: [{ heading: "Write the goal", content: ["Use this format: ‘During my next practice, I will ___ so that ___.’ Example: ‘I will explain every enhancement using the vendor’s stated pain so that my recommendation feels focused.’ Keep the goal for your next coaching review."] }],
    durationMinutes: 3,
  },
  packagingCore: {
    title: "Choose the core before the extras",
    summary: "A strong package starts with the vendor’s main operating need—not with a long list of enhancements.",
    keyPoints: ["Anchor the core to the primary business problem", "Choose the smallest tier that credibly supports the outcome", "Use enhancements to close specific gaps"],
    body: [
      { heading: "Start with the outcome", content: ["Restate what the vendor is trying to change: more qualified demand, stronger retention, or a more consistent marketing system. That outcome gives you a standard for evaluating every product choice."] },
      { heading: "Select and defend the core", content: ["Pick the core package that provides the right operating foundation. Your explanation should fit one sentence: ‘This core fits because it gives you ___, which supports the goal of ___.’", "If you cannot defend a higher tier with a discovered need, do not use it simply to increase the quote."] },
    ],
    durationMinutes: 4,
  },
  packagingEnhancements: {
    title: "Add enhancements with purpose",
    summary: "Enhancements should solve a named gap and remain easy for the vendor to understand.",
    keyPoints: ["Software extends capability", "Service adds execution or hands-on support", "Every enhancement needs a discovery-based reason"],
    body: [
      { heading: "Software versus service", content: ["Software enhancements give the vendor an additional capability or system. Service enhancements add expert execution, production, or ongoing hands-on support. Keep that distinction clear when explaining the package."] },
      { heading: "Use the one-reason test", content: ["For each enhancement, finish this sentence: ‘We included this because you said ___.’ If you cannot complete it using the vendor’s words, the enhancement is probably extra rather than essential."] },
    ],
    durationMinutes: 3,
  },
  packagingCheckpoint: {
    title: "Run the package-defense checkpoint",
    summary: "Before presenting, confirm that the core and every enhancement have a clear job.",
    keyPoints: ["State the vendor’s primary pain", "Defend the core in one sentence", "Remove any enhancement without a discovered reason"],
    body: [{ heading: "Use three questions", content: ["Ask: What problem does the core solve? What specific gap does each enhancement close? Could I explain the package without reading product names? If any answer is unclear, return to discovery before finalizing the quote."] }],
    durationMinutes: 3,
  },
  discoveryFlow: {
    title: "A discovery conversation that earns the quote",
    summary: "Useful discovery identifies the desired result, the current gap, and why solving it matters now.",
    keyPoints: ["Begin with the desired business outcome", "Find the constraint behind the symptom", "Confirm priority before recommending"],
    body: [
      { heading: "Move from broad to specific", content: ["Ask what the vendor wants to improve, how the current approach performs, and where opportunities are being lost. Then quantify the effect where possible: missed leads, inconsistent content, weak repeat business, or wasted team time."] },
      { heading: "Confirm before you prescribe", content: ["Summarize the need back to the vendor: ‘It sounds like the priority is ___ because ___. Did I get that right?’ This confirmation makes the later package feel like a response, not a pitch."] },
    ],
    durationMinutes: 4,
  },
  matchGuide: {
    title: "Match pain to the smallest credible solution",
    summary: "The Match Guide is a decision aid: it narrows options, but discovery still determines the final recommendation.",
    keyPoints: ["Choose one primary pain", "Use the Match Guide as a starting point", "Avoid stacking products for secondary symptoms"],
    body: [
      { heading: "Name the primary pain", content: ["A vendor may mention several frustrations. Identify the one that most directly blocks the desired outcome. Lead flow, retention, visibility, content capacity, and paid growth each suggest different starting points."] },
      { heading: "Build a focused recommendation", content: ["Select the core first, then add only the enhancements that address the confirmed gap. Explain the recommendation in the same order: need, core, enhancement, expected business effect."] },
    ],
    durationMinutes: 3,
  },
  discountRules: {
    title: "Explain discounts without improvising",
    summary: "Quote Lab applies catalog rules consistently; the rep’s job is to explain the result, not invent a discount.",
    keyPoints: ["Start from catalog list price", "Tier and bundle rules are calculated automatically", "Escalate exceptions instead of promising them"],
    body: [
      { heading: "Trust the calculation", content: ["Build the correct package and let Quote Lab apply the catalog’s tier and bundle rules. Review each line’s explanation so you can tell the vendor why the final amount differs from list price."] },
      { heading: "Protect confidence and margin", content: ["Never lead with an unapproved concession. If a vendor asks for an exception, clarify the concern, reinforce value, and follow the manager-approval path rather than changing the package logic yourself."] },
    ],
    durationMinutes: 4,
  },
  adSpend: {
    title: "Handle Ads Command and ad spend correctly",
    summary: "Media spend passes through the quote differently from Mercurius products and services.",
    keyPoints: ["Enter ad spend only when Ads Command is selected", "Ad spend is not discounted", "Ad spend is not commissionable"],
    body: [
      { heading: "Separate management from media", content: ["Ads Command represents the Mercurius capability or service. The vendor’s media budget is a separate pass-through line used to fund the ad platforms."] },
      { heading: "Set expectations clearly", content: ["Explain the monthly Mercurius amount and ad spend separately. Quote Lab includes both in the vendor total while excluding pass-through spend from discounts and rep earnings."] },
    ],
    durationMinutes: 3,
  },
  quoteWorkflow: {
    title: "Build a quote you can explain",
    summary: "A quality quote is accurate, tied to discovery, and easy to walk through in a consistent order.",
    keyPoints: ["Confirm vendor context before products", "Review warnings and every calculation line", "Present value before totals and earnings"],
    body: [
      { heading: "Build in the right order", content: ["Confirm the vendor and primary pain, select the core, add justified enhancements, and enter ad spend only when required. Use the live calculation panel as a verification tool—not as a substitute for discovery."] },
      { heading: "Run a final quality check", content: ["Before saving, verify the vendor name, mode, scenario, products, discounts, setup total, monthly total, and any soft warning. Then rehearse a short explanation that moves from need to solution to investment."] },
    ],
    durationMinutes: 4,
    resourceLinks: [{ label: "Open Quote Lab in Practice Mode", href: `/quote-lab?mode=practice&scenario=${dentalScenarioId}` }],
  },
  coachingReview: {
    title: "Turn scorecards into one next move",
    summary: "Coaching feedback is most useful when you convert it into a small behavior to test immediately.",
    keyPoints: ["Look for repeated feedback", "Choose one high-impact adjustment", "Practice the adjustment in the next scenario"],
    body: [{ heading: "Review with intent", content: ["Compare what you got right and what needs improvement across both scenarios. Circle the mistake or coaching note that appears more than once, then write one behavior you will change in your next attempt.", "Do not try to fix everything at once. A focused adjustment makes improvement easier to see and coach."] }],
    durationMinutes: 3,
    resourceLinks: [{ label: "Return to Practice Mode", href: `/quote-lab?mode=practice&scenario=${wellnessScenarioId}` }],
  },
} satisfies Record<string, TrainingLesson>;

export const trainingModules: readonly TrainingModule[] = [
  {
    key: "orientation",
    title: "Platform Orientation",
    description: "Get comfortable with the workspace, learning path, and daily rep workflow.",
    whyItMatters: "Knowing where to find the next action keeps you focused on selling instead of hunting for tools or answers.",
    objectives: ["Navigate Dashboard, Training, and Quote Lab", "Understand the path from practice to a saved quote", "Set a clear first-week learning goal"],
    milestones: [
      { key: "orientation-welcome", title: "Welcome to Mercurius University", description: "Review the ramp structure, success standards, and how progress is measured.", estimatedMinutes: 2, type: "learn", actionLabel: "Open Lesson", lesson: lessons.orientationWelcome },
      { key: "orientation-workspace", title: "Tour your rep workspace", description: "Locate recent quotes, training modules, Practice Mode, Live Mode, and account controls.", estimatedMinutes: 2, type: "learn", actionLabel: "Open Lesson", lesson: lessons.orientationWorkspace },
      { key: "orientation-learning-goal", title: "Set your first learning goal", description: "Choose one product, discovery, or quoting skill to deliberately improve during onboarding.", estimatedMinutes: 3, type: "learn", actionLabel: "Open Lesson", lesson: lessons.learningGoal },
    ],
  },
  {
    key: "packaging",
    title: "Product & Packaging Mastery",
    description: "Learn what each core package and enhancement does—and when it belongs in a recommendation.",
    whyItMatters: "Reps earn trust when every package decision is connected to a vendor need, not presented as a menu of features.",
    objectives: ["Differentiate the core packages", "Explain software versus service enhancements", "Build focused packages without over-selling"],
    milestones: [
      { key: "packaging-core", title: "Core package foundations", description: "Compare core tiers, ideal-fit vendor profiles, and the business outcomes each tier supports.", estimatedMinutes: 4, type: "learn", actionLabel: "Open Lesson", lesson: lessons.packagingCore },
      { key: "packaging-enhancements", title: "Software vs. service enhancements", description: "Learn the classification rule and how to explain enhancement value in plain language.", estimatedMinutes: 3, type: "learn", actionLabel: "Open Lesson", lesson: lessons.packagingEnhancements },
      { key: "packaging-earnings", title: "Package-building checkpoint", description: "Confirm that you can choose a core and defend each enhancement using vendor context.", estimatedMinutes: 3, type: "learn", actionLabel: "Open Lesson", lesson: lessons.packagingCheckpoint },
    ],
  },
  {
    key: "discovery",
    title: "Discovery & Match Guide",
    description: "Turn a vendor conversation into a clear problem statement and right-fit recommendation.",
    whyItMatters: "Strong discovery prevents generic quotes and gives the rep a credible reason for every recommendation.",
    objectives: ["Ask outcome-focused discovery questions", "Identify the primary vendor pain", "Map pains to packages with the Match Guide"],
    milestones: [
      { key: "discovery-useful", title: "Lead a useful discovery", description: "Learn a simple conversation flow for goals, current gaps, urgency, and decision criteria.", estimatedMinutes: 4, type: "learn", actionLabel: "Open Lesson", lesson: lessons.discoveryFlow },
      { key: "discovery-map", title: "Map pain to solutions", description: "Practice choosing the smallest credible set of products that addresses the primary pain.", estimatedMinutes: 3, type: "learn", actionLabel: "Open Lesson", lesson: lessons.matchGuide },
      { key: "discovery-recommendation", title: "Practice recommendation language", description: "Use the dental growth brief to connect discovery findings to a concise recommendation.", estimatedMinutes: 20, type: "practice", actionLabel: "Launch Dental Practice", practiceScenarioId: dentalScenarioId },
    ],
  },
  {
    key: "pricing",
    title: "Discount Rules & Pricing Confidence",
    description: "Understand how pricing is structured so you can explain totals and discounts without hesitation.",
    whyItMatters: "Pricing confidence protects margin, reduces avoidable approvals, and keeps vendor conversations focused on value.",
    objectives: ["Explain list price and applied discounts", "Recognize pass-through and non-commissionable spend", "Describe setup, monthly, and rep earnings correctly"],
    milestones: [
      { key: "pricing-discount-rules", title: "Discount rules without guesswork", description: "Review tier and bundle discount behavior and when manager approval may be required.", estimatedMinutes: 4, type: "learn", actionLabel: "Open Lesson", lesson: lessons.discountRules },
      { key: "pricing-ad-spend", title: "Ads Command and ad spend", description: "Learn when ad spend is required and why pass-through spend is not discounted or commissionable.", estimatedMinutes: 3, type: "learn", actionLabel: "Open Lesson", lesson: lessons.adSpend },
      { key: "pricing-explanation", title: "Practice the pricing walkthrough", description: "Use the wellness scenario to explain line items, discounts, monthly total, and residuals.", estimatedMinutes: 20, type: "practice", actionLabel: "Launch Wellness Practice", practiceScenarioId: wellnessScenarioId },
    ],
  },
  {
    key: "quote-lab",
    title: "Quote Lab Mastery",
    description: "Build accurate quotes, verify the calculation, and present the result clearly.",
    whyItMatters: "A precise quote protects vendor trust and lets the rep move from discovery to a confident commercial conversation.",
    objectives: ["Build complete Live and Practice quotes", "Read calculation lines and warnings", "Explain upfront commission and Month 2 residuals"],
    milestones: [
      { key: "quote-lab-workflow", title: "The strong-quote workflow", description: "Learn the build, quality-check, and presentation sequence for a defensible quote.", estimatedMinutes: 4, type: "learn", actionLabel: "Open Lesson", lesson: lessons.quoteWorkflow },
      { key: "quote-lab-complete", title: "Build a complete practice quote", description: "Create the dental recommendation from core selection through final package structure.", estimatedMinutes: 20, type: "practice", actionLabel: "Launch Dental Quote", practiceScenarioId: dentalScenarioId },
      { key: "quote-lab-explain", title: "Explain discounts and totals", description: "Use the wellness scenario to rehearse a clear line-by-line pricing explanation.", estimatedMinutes: 18, type: "practice", actionLabel: "Launch Wellness Quote", practiceScenarioId: wellnessScenarioId },
      { key: "quote-lab-earnings", title: "Master the earnings conversation", description: "Identify upfront commission, monthly residual, Month 2 timing, and the Year-1 estimate.", estimatedMinutes: 12, type: "practice", actionLabel: "Practice Earnings", practiceScenarioId: wellnessScenarioId },
    ],
  },
  {
    key: "scenarios",
    title: "Practice Scenarios",
    description: "Apply discovery, matching, pricing, and presentation skills to graded vendor situations.",
    whyItMatters: "Repeated, scored practice turns product knowledge into judgment a rep can use in a live conversation.",
    objectives: ["Translate a brief into a recommendation", "Submit a quote for grading", "Use coaching feedback to improve the next attempt"],
    milestones: [
      { key: "scenario-dental", title: "Dental growth scenario", description: "Diagnose Northstar Dental Studio’s lead-flow need and submit a graded recommendation.", estimatedMinutes: 25, type: "practice", actionLabel: "Launch Dental Scenario", practiceScenarioId: dentalScenarioId },
      { key: "scenario-wellness", title: "Wellness retention scenario", description: "Build and grade a retention-focused package for Juniper Wellness Collective.", estimatedMinutes: 25, type: "practice", actionLabel: "Launch Wellness Scenario", practiceScenarioId: wellnessScenarioId },
      { key: "scenario-coaching-review", title: "Review your coaching feedback", description: "Compare both scorecards, identify the repeated coaching theme, and choose one adjustment.", estimatedMinutes: 3, type: "learn", actionLabel: "Open Lesson", lesson: lessons.coachingReview },
    ],
  },
  {
    key: "certification",
    title: "Certification",
    description: "Demonstrate that you can move from vendor need to an accurate, explainable recommendation.",
    whyItMatters: "Certification gives both the rep and manager confidence that live quoting fundamentals are in place.",
    objectives: ["Show consistent package judgment", "Explain pricing and earnings accurately", "Complete a final readiness review"],
    milestones: [
      { key: "certification-knowledge-check", title: "Knowledge readiness check", description: "Confirm your command of packaging, discovery, discounts, and Quote Lab terminology.", estimatedMinutes: 15, type: "certification", actionLabel: "Complete Check" },
      { key: "certification-readiness", title: "Quote readiness certification", description: "Build and submit the certification scenario. A score of 80 or higher is required to pass.", estimatedMinutes: 25, type: "certification", actionLabel: "Begin Certification", practiceScenarioId: dentalScenarioId, requiresPassingScore: 80 },
      { key: "certification-manager-review", title: "Manager coaching review", description: "Bring your scenario results and learning goal to a focused readiness conversation.", estimatedMinutes: 20, type: "certification", actionLabel: "Review Complete" },
    ],
  },
] as const;

export const trainingMilestones = trainingModules.flatMap((module) => module.milestones);
export const certificationPrerequisiteKeys = trainingModules
  .filter((module) => module.key !== "certification")
  .flatMap((module) => module.milestones.map((milestone) => milestone.key));
export function findTrainingMilestone(key: string) {
  return trainingMilestones.find((milestone) => milestone.key === key);
}
