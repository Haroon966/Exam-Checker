export type RootStackParamList = {
  Home: undefined;
  ExamDetail: { examId: string };
  Camera: { examId: string };
  Processing: { examId: string; imageUris: string[] };
  Result: { jobId: string };
  History: { examId?: string } | undefined;
};
