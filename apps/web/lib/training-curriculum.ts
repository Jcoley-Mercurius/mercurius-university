export interface TrainingMilestone {
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly practiceScenarioId?: string;
  readonly locked?: boolean;
}

export interface TrainingModule {
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly milestones: readonly TrainingMilestone[];
}

const dentalScenarioId = "6d455243-5552-4955-b300-000000000001";
const wellnessScenarioId = "6d455243-5552-4955-b300-000000000002";

export const trainingModules: readonly TrainingModule[] = [
  { key: "orientation", title: "Platform Orientation", description: "Learn the Mercurius workflow and the tools you will use every day.", milestones: [
    { key: "orientation-welcome", title: "Welcome to Mercurius University", description: "Understand your ramp path and success standards." },
    { key: "orientation-workspace", title: "Navigate your rep workspace", description: "Tour the Dashboard, Training Hub, and Quote Lab." },
    { key: "orientation-learning-goal", title: "Set your first learning goal", description: "Choose the skill you want to strengthen first." },
  ] },
  { key: "packaging", title: "Product & Packaging Mastery", description: "Build confidence in core packages, enhancements, and positioning.", milestones: [
    { key: "packaging-core", title: "Core package foundations", description: "Know when Spark, Momentum, and higher tiers fit." },
    { key: "packaging-enhancements", title: "Software vs. service enhancements", description: "Explain the packaging rules without jargon." },
    { key: "packaging-earnings", title: "Pricing and earnings essentials", description: "Read totals, discounts, commission, and residuals." },
  ] },
  { key: "discovery", title: "Discovery & Match Guide", description: "Turn vendor pain into a focused, defensible recommendation.", milestones: [
    { key: "discovery-useful", title: "Lead a useful discovery", description: "Ask questions that uncover the business problem." },
    { key: "discovery-map", title: "Map pain to solutions", description: "Use the Match Guide to avoid over- or under-selling." },
    { key: "discovery-recommendation", title: "Practice recommendation language", description: "Connect every package decision to vendor value.", practiceScenarioId: dentalScenarioId },
  ] },
  { key: "quote-lab", title: "Quote Lab Mastery", description: "Build accurate quotes and communicate their value with confidence.", milestones: [
    { key: "quote-lab-complete", title: "Build a complete practice quote", description: "Select a core, enhancements, and the right structure.", practiceScenarioId: dentalScenarioId },
    { key: "quote-lab-explain", title: "Explain discounts and totals", description: "Walk through each line and calculation clearly.", practiceScenarioId: wellnessScenarioId },
    { key: "quote-lab-earnings", title: "Master the earnings conversation", description: "Understand upfront and Month 2 residuals.", practiceScenarioId: wellnessScenarioId },
  ] },
  { key: "certification", title: "Practice Scenarios & Certification", description: "Apply the full sales motion and demonstrate quote readiness.", milestones: [
    { key: "scenario-dental", title: "Dental growth scenario", description: "Diagnose the need and submit a graded recommendation.", practiceScenarioId: dentalScenarioId },
    { key: "scenario-wellness", title: "Wellness retention scenario", description: "Build a retention-focused package and get feedback.", practiceScenarioId: wellnessScenarioId },
    { key: "certification-readiness", title: "Quote readiness certification", description: "Complete the final assessment when prerequisites are met.", locked: true },
  ] },
] as const;

export const trainingMilestones = trainingModules.flatMap((module) => module.milestones);
export function findTrainingMilestone(key: string) {
  return trainingMilestones.find((milestone) => milestone.key === key);
}
