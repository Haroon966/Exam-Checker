import React, { useCallback, useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { api, GradeResult, HandwritingRating, Job, imageUrl } from "../api";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Field } from "../components/Field";
import { Badge, EmptyState, ScreenSkeleton, SectionLabel } from "../components/Feedback";
import { colors, radius, space, touch, type } from "../theme";
import type { RootStackParamList } from "../navigation";

type Nav = NativeStackNavigationProp<RootStackParamList, "Result">;
type R = RouteProp<RootStackParamList, "Result">;
type Tab = "handwriting" | "auto" | "ocr" | "photos";

const HW_OPTIONS: { id: HandwritingRating; label: string; factor: number }[] = [
  { id: "excellent", label: "Excellent", factor: 1 },
  { id: "good", label: "Good", factor: 0.8 },
  { id: "fair", label: "Fair", factor: 0.5 },
  { id: "poor", label: "Poor", factor: 0.2 },
];

export default function ResultScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { jobId } = route.params;
  const [job, setJob] = useState<Job | null>(null);
  const [tab, setTab] = useState<Tab>("handwriting");
  const [ocrEdit, setOcrEdit] = useState("");
  const [hwRating, setHwRating] = useState<HandwritingRating | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const j = await api.getJob(jobId);
      setJob(j);
      setOcrEdit(j.ocr_text || "");
      setNote(j.teacher_note?.replace(/\s*\|\s*handwriting=\w+/i, "").trim() || "");
      const match = j.teacher_note?.match(/handwriting=(\w+)/i);
      if (match && HW_OPTIONS.some((o) => o.id === match[1].toLowerCase())) {
        setHwRating(match[1].toLowerCase() as HandwritingRating);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [jobId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const grade = (job?.grade_json || {}) as GradeResult;
  const autoScore = grade.auto_score ?? job?.suggested_score ?? null;
  const maxScore = grade.max_score ?? 100;
  const hwMax = grade.handwriting_max ?? Math.max(5, Math.round(maxScore * 0.1 * 10) / 10);

  const previewTotal = useMemo(() => {
    if (autoScore == null || !hwRating) return null;
    const option = HW_OPTIONS.find((o) => o.id === hwRating);
    if (!option) return null;
    return Math.round((autoScore + hwMax * option.factor) * 10) / 10;
  }, [autoScore, hwMax, hwRating]);

  const saveHandwriting = async () => {
    if (!hwRating) {
      setError("Pick a handwriting rating");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await api.setMarks(jobId, {
        handwriting_rating: hwRating,
        teacher_note: note,
      });
      setJob(updated);
      setInfo("Final marks saved");
      setTab("handwriting");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const regrade = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await api.regrade(jobId, ocrEdit);
      setInfo("Re-grading…");
      const poll = setInterval(async () => {
        const latest = await api.getJob(jobId);
        setJob(latest);
        setOcrEdit(latest.ocr_text || "");
        if (latest.status === "ready" || latest.status === "marked" || latest.status === "error") {
          clearInterval(poll);
          setBusy(false);
          setInfo(latest.status === "error" ? latest.error : "Auto checks updated");
          if (latest.status === "error") setError(latest.error);
          else setTab("auto");
        }
      }, 1500);
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Re-grade failed");
    }
  };

  if (!job) {
    return error ? (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Button label="Retry" onPress={load} />
      </View>
    ) : (
      <ScreenSkeleton />
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "handwriting", label: "Your check" },
    { id: "auto", label: "Auto audit" },
    { id: "ocr", label: "OCR" },
    { id: "photos", label: "Photos" },
  ];

  const verdictTone = (v: string) => {
    if (v === "correct") return "ok" as const;
    if (v === "partial") return "warn" as const;
    return "bad" as const;
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {job.exam_title || "Result"}
        </Text>
        <View style={styles.metaRow}>
          <Badge
            label={job.status}
            tone={job.status === "marked" ? "ok" : job.status === "error" ? "bad" : "info"}
          />
          {autoScore != null ? (
            <Badge label={`Auto ${autoScore}/${maxScore - hwMax}`} tone="warn" />
          ) : null}
          {job.teacher_marks != null ? (
            <Badge label={`Final ${job.teacher_marks}/${maxScore}`} tone="ok" />
          ) : null}
        </View>
        <Text style={styles.hint}>
          Spelling, grammar, and answers are checked automatically. You only rate handwriting.
        </Text>
      </View>

      <View style={styles.tabs} accessibilityRole="tablist">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={t.label}
              onPress={() => setTab(t.id)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <Text style={styles.errorPad} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {info ? (
        <Text style={styles.infoPad} accessibilityLiveRegion="polite">
          {info}
        </Text>
      ) : null}

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {tab === "handwriting" ? (
          <View>
            <Card style={styles.summaryCard}>
              <Text style={styles.summary}>
                Auto score (content + language):{" "}
                {autoScore != null ? `${autoScore} / ${maxScore - hwMax}` : "—"}
              </Text>
              <Text style={styles.issueBody}>
                Handwriting portion: up to {hwMax} points (you set this)
              </Text>
            </Card>

            <SectionLabel>Look at the paper, then rate handwriting</SectionLabel>
            <View style={styles.hwGrid}>
              {HW_OPTIONS.map((opt) => {
                const active = hwRating === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setHwRating(opt.id)}
                    style={[styles.hwChip, active && styles.hwChipActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.hwChipText, active && styles.hwChipTextActive]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.hwChipPts, active && styles.hwChipTextActive]}>
                      +{Math.round(hwMax * opt.factor * 10) / 10}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {previewTotal != null ? (
              <Text style={styles.preview}>
                Final marks preview: {previewTotal} / {maxScore}
              </Text>
            ) : null}

            <Field
              label="Optional note"
              multiline
              value={note}
              onChangeText={setNote}
              placeholder="e.g. neat but cramped"
            />
            <Button
              label="Confirm final marks"
              variant="cta"
              loading={busy}
              onPress={saveHandwriting}
            />
            {job.teacher_marks != null ? (
              <Text style={styles.saved}>Saved final marks: {job.teacher_marks}</Text>
            ) : null}
            <Button
              label="Back to home"
              variant="ghost"
              onPress={() => navigation.navigate("Home")}
              style={{ marginTop: space.md }}
            />
          </View>
        ) : null}

        {tab === "auto" ? (
          <View>
            {grade.summary ? (
              <Card style={styles.summaryCard}>
                <Text style={styles.summary}>{grade.summary}</Text>
              </Card>
            ) : null}

            <SectionLabel>Spelling (auto)</SectionLabel>
            {(grade.spelling_errors || []).length === 0 ? (
              <EmptyState title="No spelling issues flagged" />
            ) : (
              grade.spelling_errors.map((e, i) => (
                <Card key={`s-${i}`} style={styles.issue}>
                  <Text style={styles.issueTitle}>
                    {e.word} → {e.suggestion}
                  </Text>
                  {e.context ? <Text style={styles.issueBody}>{e.context}</Text> : null}
                </Card>
              ))
            )}

            <SectionLabel>Grammar (auto)</SectionLabel>
            {(grade.grammar_issues || []).length === 0 ? (
              <EmptyState title="No grammar issues flagged" />
            ) : (
              grade.grammar_issues.map((e, i) => (
                <Card key={`g-${i}`} style={styles.issue}>
                  <Text style={styles.issueTitle}>{e.text}</Text>
                  <Text style={styles.issueBody}>Suggestion: {e.suggestion}</Text>
                </Card>
              ))
            )}

            <SectionLabel>Answer key (auto)</SectionLabel>
            {(grade.answer_feedback || []).length === 0 ? (
              <EmptyState title="No answer-key feedback" body="Key may be empty." />
            ) : (
              grade.answer_feedback.map((a, i) => (
                <Card key={`a-${i}`} style={styles.issue}>
                  <View style={styles.issueHead}>
                    <Text style={styles.issueTitle}>{a.question_ref}</Text>
                    <Badge label={a.verdict} tone={verdictTone(a.verdict)} />
                  </View>
                  {a.expected ? <Text style={styles.issueBody}>Expected: {a.expected}</Text> : null}
                  {a.student ? <Text style={styles.issueBody}>Student: {a.student}</Text> : null}
                  {a.comment ? <Text style={styles.issueBody}>{a.comment}</Text> : null}
                </Card>
              ))
            )}
          </View>
        ) : null}

        {tab === "ocr" ? (
          <View>
            <Field
              label="OCR text"
              hint="Only edit if the scan misread words, then re-run auto checks."
              multiline
              multilineTall
              value={ocrEdit}
              onChangeText={setOcrEdit}
            />
            <Button
              label="Re-run auto checks"
              variant="primary"
              loading={busy}
              onPress={regrade}
            />
          </View>
        ) : null}

        {tab === "photos" ? (
          job.image_urls.length ? (
            job.image_urls.map((url) => (
              <Image
                key={url}
                source={{ uri: imageUrl(url) }}
                style={styles.photo}
                accessibilityLabel="Exam paper photo"
                resizeMode="contain"
              />
            ))
          ) : (
            <EmptyState title="No images" />
          )
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: space.lg,
    gap: space.md,
  },
  header: { paddingHorizontal: space.lg, paddingTop: space.sm },
  title: { ...type.title, color: colors.text },
  hint: { ...type.caption, color: colors.muted, marginTop: space.sm, lineHeight: 18 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.sm },
  tabs: {
    flexDirection: "row",
    marginHorizontal: space.lg,
    marginTop: space.md,
    gap: space.xs,
  },
  tab: {
    flex: 1,
    minHeight: touch.min,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    backgroundColor: colors.bgDeep,
    paddingHorizontal: 4,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...type.caption, color: colors.muted, textAlign: "center" },
  tabTextActive: { color: colors.white, fontFamily: "PlusJakartaSans_700Bold" },
  scroll: { padding: space.lg, paddingBottom: 48 },
  photo: {
    width: "100%",
    height: 360,
    borderRadius: radius.md,
    marginBottom: space.md,
    backgroundColor: colors.bgDeep,
  },
  summaryCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.line,
    marginBottom: space.sm,
  },
  summary: { ...type.body, color: colors.text },
  hwGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    marginBottom: space.md,
  },
  hwChip: {
    width: "47%",
    minHeight: touch.min + 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgDeep,
    padding: space.md,
    justifyContent: "center",
  },
  hwChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  hwChipText: { ...type.bodyMed, color: colors.text },
  hwChipPts: { ...type.caption, color: colors.muted, marginTop: 2 },
  hwChipTextActive: { color: colors.white },
  preview: {
    ...type.bodyMed,
    color: colors.primary,
    marginBottom: space.md,
  },
  issue: { marginBottom: space.sm },
  issueHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: space.sm,
    marginBottom: 4,
  },
  issueTitle: { ...type.bodyMed, color: colors.text, flex: 1 },
  issueBody: { ...type.caption, color: colors.muted, marginTop: 4, lineHeight: 18 },
  error: { ...type.body, color: colors.bad },
  errorPad: {
    ...type.caption,
    color: colors.bad,
    paddingHorizontal: space.lg,
    marginTop: space.sm,
  },
  infoPad: {
    ...type.caption,
    color: colors.ok,
    paddingHorizontal: space.lg,
    marginTop: space.sm,
  },
  saved: {
    ...type.bodyMed,
    color: colors.ok,
    textAlign: "center",
    marginTop: space.md,
  },
});
