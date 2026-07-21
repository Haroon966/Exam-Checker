import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { api, Job } from "../api";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Badge, EmptyState, ScreenSkeleton } from "../components/Feedback";
import { IconChevron } from "../components/Icons";
import { colors, space, type } from "../theme";
import type { RootStackParamList } from "../navigation";

type Nav = NativeStackNavigationProp<RootStackParamList, "History">;
type R = RouteProp<RootStackParamList, "History">;

export default function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const examId = route.params?.examId;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await api.listJobs(examId);
      setJobs(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  if (loading) return <ScreenSkeleton />;

  return (
    <View style={styles.root}>
      <Text style={styles.title} accessibilityRole="header">
        {examId ? "Exam history" : "All checks"}
      </Text>
      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.error}>{error}</Text>
          <Button label="Retry" variant="ghost" onPress={load} style={{ marginTop: space.sm }} />
        </Card>
      ) : null}
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        windowSize={7}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <EmptyState title="No checked papers yet" body="Results will show up here." />
        }
        renderItem={({ item }) => (
          <Card
            style={styles.row}
            onPress={() => navigation.navigate("Result", { jobId: item.id })}
            accessibilityLabel={`${item.exam_title || "Paper"}, ${item.status}`}
          >
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.rowTitle}>{item.exam_title || "Paper"}</Text>
              <View style={styles.badges}>
                <Badge
                  label={item.status}
                  tone={item.status === "marked" ? "ok" : item.status === "error" ? "bad" : "info"}
                />
                {item.teacher_marks != null ? (
                  <Badge label={`Marks ${item.teacher_marks}`} tone="ok" />
                ) : null}
                {item.suggested_score != null ? (
                  <Badge label={`Auto ${item.suggested_score}`} tone="warn" />
                ) : null}
              </View>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
            <IconChevron size={20} />
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.lg, paddingTop: space.sm },
  title: { ...type.title, color: colors.text, marginBottom: space.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    marginBottom: space.sm,
  },
  rowTitle: { ...type.bodyMed, color: colors.text },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  date: { ...type.caption, color: colors.muted },
  errorCard: { marginBottom: space.md, borderColor: colors.bad, backgroundColor: colors.badSoft },
  error: { ...type.body, color: colors.bad },
});
