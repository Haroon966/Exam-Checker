import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { api, Job } from "../api";
import { Button } from "../components/Button";
import { Badge } from "../components/Feedback";
import { colors, space, type } from "../theme";
import type { RootStackParamList } from "../navigation";

type Nav = NativeStackNavigationProp<RootStackParamList, "Processing">;
type R = RouteProp<RootStackParamList, "Processing">;

const STATUS_HINTS: Record<string, string> = {
  queued: "Queued…",
  ocr: "OCR in progress — free Space may take 1–2 minutes to wake…",
  grading: "AI is checking spelling, grammar, and answers…",
  ready: "Done",
  marked: "Marks saved",
  error: "Something went wrong",
};

export default function ProcessingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { examId, imageUris } = route.params;
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        const created = await api.createJob(examId, imageUris);
        setJob(created);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    })();
  }, [examId, imageUris]);

  useEffect(() => {
    if (!job || job.status === "ready" || job.status === "marked" || job.status === "error") {
      if (job?.status === "ready" || job?.status === "marked") {
        navigation.replace("Result", { jobId: job.id });
      }
      return;
    }

    const id = setInterval(async () => {
      try {
        const latest = await api.getJob(job.id);
        setJob(latest);
        if (latest.status === "ready" || latest.status === "marked") {
          clearInterval(id);
          navigation.replace("Result", { jobId: latest.id });
        }
        if (latest.status === "error") {
          clearInterval(id);
          setError(latest.error || "Processing failed");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Poll failed");
      }
    }, 2000);

    return () => clearInterval(id);
  }, [job, navigation]);

  const message =
    error ||
    job?.status_message ||
    STATUS_HINTS[job?.status || "queued"] ||
    "Working…";

  return (
    <View style={styles.root} accessibilityLiveRegion="polite">
      {!error ? <ActivityIndicator size="large" color={colors.primary} /> : null}
      <Text style={styles.title}>Checking paper</Text>
      <Text style={styles.message}>{message}</Text>
      {job?.status ? (
        <View style={{ marginTop: space.md }}>
          <Badge
            label={job.status}
            tone={job.status === "error" ? "bad" : job.status === "grading" ? "warn" : "info"}
          />
        </View>
      ) : null}
      {job?.ocr_provider_used ? (
        <Text style={styles.meta}>OCR: {job.ocr_provider_used}</Text>
      ) : null}
      {job?.status === "ocr" ? (
        <Text style={styles.tip}>
          First request can be slow while the free Hugging Face Space cold-starts.
        </Text>
      ) : null}
      {error ? (
        <Button
          label="Go back"
          variant="ghost"
          onPress={() => navigation.goBack()}
          style={{ marginTop: space.xl }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: space.xl,
  },
  title: { ...type.title, color: colors.text, marginTop: space.lg },
  message: {
    ...type.body,
    color: colors.text,
    textAlign: "center",
    marginTop: space.md,
  },
  meta: { ...type.caption, color: colors.muted, marginTop: space.lg },
  tip: {
    ...type.caption,
    color: colors.muted,
    textAlign: "center",
    marginTop: space.lg,
    lineHeight: 20,
  },
});
