export type UploadFile = File | null;

export type ProgressMessage = {
  step?: string;
  progress?: number;
  results?: ComparisonResults;
  session_id?: string;
  error?: string;
};

export type PredictionDistribution = {
  class_label: string;
  count_a: number;
  count_b: number;
};

export type FeatureImportance = {
  feature: string;
  importance_a: number;
  importance_b: number;
};

export type DisagreementSample = {
  sample_id: number;
  pred_a: string;
  pred_b: string;
  actual: string;
  features?: Record<string, number>;
};

export type ComparisonResults = {
  dataset_name?: string;
  model_a_name: string;
  model_b_name: string;
  total_samples: number;
  agreement_rate: number;
  disagreement_count: number;
  disagreement_indices?: number[];
  accuracy_a: number;
  accuracy_b: number;
  feature_importance: FeatureImportance[];
  prediction_distribution: PredictionDistribution[];
  confidence_a?: number[];
  confidence_b?: number[];
  disagreements: DisagreementSample[];
  ai_report: string;
  feature_names?: string[];
};

export type HistoryItem = {
  id?: number | string;
  session_id?: string;
  model_a_name: string;
  model_b_name: string;
  dataset_name?: string;
  agreement_rate: number;
  created_at?: string;
};
