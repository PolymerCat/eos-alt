import type { DataMode } from "@/types/emergency";

export type ReportType = "situation_brief";

export type ReportAudience = "public";

export interface ReportGenerationInput {
  mode: DataMode;
  type: ReportType;
  audience: ReportAudience;
}

export interface GeneratedReportSection {
  heading: string;
  icon: "shelter" | "weather" | "location" | "database";
  points: string[];
}

export interface GeneratedReportMetric {
  label: string;
  value: string;
  icon: "shelter" | "weather" | "people" | "location";
}

export interface GeneratedReport {
  id: string;
  title: string;
  summary: string;
  generatedAt: string;
  mode: DataMode;
  type: ReportType;
  audience: ReportAudience;
  metrics: GeneratedReportMetric[];
  sections: GeneratedReportSection[];
  disclaimer: string;
}
