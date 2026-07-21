import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { api, Exam } from "../api";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { ScreenSkeleton } from "../components/Feedback";
import { IconCamera, IconHistory } from "../components/Icons";
import { colors, space, type } from "../theme";
import type { RootStackParamList } from "../navigation";

type Nav = NativeStackNavigationProp<RootStackParamList, "ExamDetail">;
type R = RouteProp<RootStackParamList, "ExamDetail">;

export default function ExamDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { examId } = route.params;
  const [exam, setExam] = useState<Exam | null>(null);
  const [answerKey, setAnswerKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const e = await api.getExam(examId);
      setExam(e);
      setAnswerKey(e.answer_key_text || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load exam");
    }
  }, [examId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const saveKey = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await api.updateExam(examId, { answer_key_text: answerKey });
      setExam(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!exam) {
    return error ? (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Button label="Retry" onPress={load} />
      </View>
    ) : (
      <ScreenSkeleton />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title} accessibilityRole="header">
          {exam.title}
        </Text>
        <Text style={styles.meta}>
          {exam.subject || "General"} · max score {exam.max_score}
        </Text>

        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
        {saved ? (
          <Text style={styles.ok} accessibilityLiveRegion="polite">
            Answer key saved
          </Text>
        ) : null}

        <Field
          label="Answer key"
          hint="Paste correct answers for subject grading. Leave empty for spelling and grammar only."
          multiline
          multilineTall
          value={answerKey}
          onChangeText={setAnswerKey}
          placeholder={"Q1: …\nQ2: …"}
        />

        <Button label="Save answer key" variant="secondary" loading={saving} onPress={saveKey} />

        <Button
          label="Check a paper"
          variant="cta"
          leftIcon={<IconCamera size={20} color={colors.white} />}
          onPress={() => navigation.navigate("Camera", { examId })}
          style={{ marginTop: space.md }}
          accessibilityHint="Open camera to photograph the student paper"
        />

        <Button
          label="History for this exam"
          variant="ghost"
          leftIcon={<IconHistory size={18} color={colors.primary} />}
          onPress={() => navigation.navigate("History", { examId })}
          style={{ marginTop: space.sm }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, paddingBottom: 48 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: space.lg,
    gap: space.md,
  },
  title: { ...type.title, color: colors.text },
  meta: { ...type.body, color: colors.muted, marginTop: space.xs, marginBottom: space.xl },
  error: { ...type.body, color: colors.bad, marginBottom: space.md },
  ok: { ...type.bodyMed, color: colors.ok, marginBottom: space.md },
});
