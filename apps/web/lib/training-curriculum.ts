export type TrainingActivityType = "learn" | "practice" | "certification";

export interface TrainingMilestone {
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly estimatedMinutes: number;
  readonly type: TrainingActivityType;
  readonly actionLabel: string;
  readonly practiceScenarioId?: string;
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

export const trainingModules: readonly TrainingModule[] = [
  {
    key: "orientation",
    title: "Platform Orientation",
    description: "Get comfortable with the workspace, learning path, and daily rep workflow.",
    whyItMatters: "Knowing where to find the next action keeps you focused on selling instead of hunting for tools or answers.",
    objectives: ["Navigate Dashboard, Training, and Quote Lab", "Understand the path from practice to a saved quote", "Set a clear first-week learning goal"],
    milestones: [
      { key: "orientation-welcome", title: "Welcome to Mercurius University", description: "Review the ramp structure, success standards, and how progress is measured.", estimatedMinutes: 8, type: "learn", actionLabel: "Review & Complete" },
      { key: "orientation-workspace", title: "Tour your rep workspace", description: "Locate recent quotes, training modules, Practice Mode, Live Mode, and account controls.", estimatedMinutes: 10, type: "learn", actionLabel: "Mark Tour Complete" },
      { key: "orientation-learning-goal", title: "Set your first learning goal", description: "Choose one product, discovery, or quoting skill to deliberately improve during onboarding.", estimatedMinutes: 5, type: "learn", actionLabel: "Goal Set" },
    ],
  },
  {
    key: "packaging",
    title: "Product & Packaging Mastery",
    description: "Learn what each core package and enhancement does—and when it belongs in a recommendation.",
    whyItMatters: "Reps earn trust when every package decision is connected to a vendor need, not presented as a menu of features.",
    objectives: ["Differentiate the core packages", "Explain software versus service enhancements", "Build focused packages without over-selling"],
    milestones: [
      { key: "packaging-core", title: "Core package foundations", description: "Compare core tiers, ideal-fit vendor profiles, and the business outcomes each tier supports.", estimatedMinutes: 15, type: "learn", actionLabel: "Review & Complete" },
      { key: "packaging-enhancements", title: "Software vs. service enhancements", description: "Learn the classification rule and how to explain enhancement value in plain language.", estimatedMinutes: 12, type: "learn", actionLabel: "Mark Complete" },
      { key: "packaging-earnings", title: "Package-building checkpoint", description: "Confirm that you can choose a core and defend each enhancement using vendor context.", estimatedMinutes: 10, type: "learn", actionLabel: "Complete Checkpoint" },
    ],
  },
  {
    key: "discovery",
    title: "Discovery & Match Guide",
    description: "Turn a vendor conversation into a clear problem statement and right-fit recommendation.",
    whyItMatters: "Strong discovery prevents generic quotes and gives the rep a credible reason for every recommendation.",
    objectives: ["Ask outcome-focused discovery questions", "Identify the primary vendor pain", "Map pains to packages with the Match Guide"],
    milestones: [
      { key: "discovery-useful", title: "Lead a useful discovery", description: "Learn a simple conversation flow for goals, current gaps, urgency, and decision criteria.", estimatedMinutes: 15, type: "learn", actionLabel: "Review & Complete" },
      { key: "discovery-map", title: "Map pain to solutions", description: "Practice choosing the smallest credible set of products that addresses the primary pain.", estimatedMinutes: 12, type: "learn", actionLabel: "Complete Exercise" },
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
      { key: "pricing-discount-rules", title: "Discount rules without guesswork", description: "Review tier and bundle discount behavior and when manager approval may be required.", estimatedMinutes: 15, type: "learn", actionLabel: "Review Rules" },
      { key: "pricing-ad-spend", title: "Ads Command and ad spend", description: "Learn when ad spend is required and why pass-through spend is not discounted or commissionable.", estimatedMinutes: 8, type: "learn", actionLabel: "Mark Complete" },
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
      { key: "scenario-coaching-review", title: "Review your coaching feedback", description: "Compare both scorecards, identify the repeated coaching theme, and choose one adjustment.", estimatedMinutes: 10, type: "learn", actionLabel: "Feedback Reviewed" },
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
      { key: "certification-readiness", title: "Quote readiness certification", description: "Complete the final self-attestation after finishing both graded practice scenarios.", estimatedMinutes: 20, type: "certification", actionLabel: "Complete Certification" },
      { key: "certification-manager-review", title: "Manager coaching review", description: "Bring your scenario results and learning goal to a focused readiness conversation.", estimatedMinutes: 20, type: "certification", actionLabel: "Review Complete" },
    ],
  },
] as const;

export const trainingMilestones = trainingModules.flatMap((module) => module.milestones);
export function findTrainingMilestone(key: string) {
  return trainingMilestones.find((milestone) => milestone.key === key);
}
