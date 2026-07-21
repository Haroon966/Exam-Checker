import React, { useCallback, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL, api, Exam, Job } from "../api";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Field } from "../components/Field";
import { Badge, EmptyState, ScreenSkeleton, SectionLabel } from "../components/Feedback";
import { IconBook, IconChevron, IconHistory, IconPlus, IconWifiOff } from "../components/Icons";
import { colors, space, type } from "../theme";
import type { RootStackParamList } from "../navigation";

type Nav = NativeStackNavigationProp<RootStackParamList, "Home">;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [exams, setExams] = useState<Exam[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      await api.health();
      setApiOk(true);
      const [e, j] = await Promise.all([api.listExams(), api.listJobs()]);
      setExams(e);
      setJobs(j.slice(0, 8));
    } catch (err) {
      setApiOk(false);
      setError(
        err instanceof Error
          ? `Cannot reach API at ${API_URL}. If you use Expo tunnel, also run ./scripts/start-api-tunnel.sh then restart Expo.`
          : "Failed to load"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const createExam = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const exam = await api.createExam({
        title: title.trim(),
        subject: subject.trim(),
        max_score: Number(maxScore) || 100,
      });
      setShowCreate(false);
      setTitle("");
      setSubject("");
      setMaxScore("100");
      navigation.navigate("ExamDetail", { examId: exam.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <ScreenSkeleton />;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + space.sm }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.hero}>
        <Text style={styles.brand} accessibilityRole="header">
          Exam Checker
        </Text>
        <Text style={styles.tagline}>Photograph. Check. Mark.</Text>
        <View style={styles.statusRow}>
          {apiOk ? (
            <Badge label="API connected" tone="ok" />
          ) : (
            <View style={styles.offline}>
              <IconWifiOff size={16} color={colors.bad} />
              <Badge label="API offline" tone="bad" />
            </View>
          )}
        </View>
      </View>

      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText} accessibilityLiveRegion="polite">
            {error}
          </Text>
          <Button label="Retry" variant="ghost" onPress={load} style={{ marginTop: space.sm }} />
        </Card>
      ) : null}

      <Button
        label={showCreate ? "Cancel" : "New exam"}
        variant={showCreate ? "ghost" : "cta"}
        leftIcon={!showCreate ? <IconPlus size={20} color={colors.white} /> : undefined}
        onPress={() => setShowCreate((v) => !v)}
        accessibilityHint="Create a new exam to start checking papers"
      />

      {showCreate ? (
        <Card style={{ marginTop: space.md }}>
          <Field
            label="Exam title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Midterm English"
            autoFocus
          />
          <Field
            label="Subject"
            value={subject}
            onChangeText={setSubject}
            placeholder="Optional"
          />
          <Field
            label="Max score"
            value={maxScore}
            onChangeText={setMaxScore}
            keyboardType="decimal-pad"
            placeholder="100"
          />
          <Button label="Create exam" variant="primary" loading={creating} onPress={createExam} />
        </Card>
      ) : null}

      <FlatList
        data={exams}
        keyExtractor={(item) => item.id}
        style={{ marginTop: space.sm }}
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xl }}
        ListHeaderComponent={<SectionLabel>Exams</SectionLabel>}
        ListEmptyComponent={
          <EmptyState title="No exams yet" body="Create one to start checking papers." />
        }
        renderItem={({ item }) => (
          <Card
            style={styles.row}
            onPress={() => navigation.navigate("ExamDetail", { examId: item.id })}
            accessibilityLabel={`${item.title}, ${item.subject || "General"}`}
            accessibilityHint="Open exam details"
          >
            <View style={styles.rowIcon}>
              <IconBook size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowMeta}>
                {item.subject || "General"} · max {item.max_score}
              </Text>
            </View>
            <IconChevron size={20} />
          </Card>
        )}
        ListFooterComponent={
          <View>
            <SectionLabel>Recent checks</SectionLabel>
            {jobs.length === 0 ? (
              <EmptyState title="No papers checked yet" body="Capture a paper from an exam." />
            ) : (
              jobs.map((job) => (
                <Card
                  key={job.id}
                  style={styles.row}
                  onPress={() => navigation.navigate("Result", { jobId: job.id })}
                  accessibilityLabel={`${job.exam_title || "Paper"}, ${job.status}`}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{job.exam_title || "Paper"}</Text>
                    <Text style={styles.rowMeta}>
                      {job.status}
                      {job.teacher_marks != null ? ` · marks ${job.teacher_marks}` : ""}
                    </Text>
                  </View>
                  <IconChevron size={20} />
                </Card>
              ))
            )}
            <Button
              label="View all history"
              variant="ghost"
              leftIcon={<IconHistory size={18} color={colors.primary} />}
              onPress={() => navigation.navigate("History")}
              style={{ marginTop: space.sm }}
            />
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: space.lg,
  },
  hero: { marginBottom: space.lg, marginTop: space.sm },
  brand: { ...type.hero, color: colors.text },
  tagline: { ...type.body, color: colors.muted, marginTop: space.xs },
  statusRow: { marginTop: space.md },
  offline: { flexDirection: "row", alignItems: "center", gap: 8 },
  errorCard: {
    marginBottom: space.md,
    borderColor: colors.bad,
    backgroundColor: colors.badSoft,
  },
  errorText: { ...type.body, color: colors.bad },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    marginBottom: space.sm,
    paddingVertical: space.md,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { ...type.bodyMed, color: colors.text },
  rowMeta: { ...type.caption, color: colors.muted, marginTop: 2 },
});
