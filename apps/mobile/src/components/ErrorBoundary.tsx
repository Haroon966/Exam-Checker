import React, { Component, ErrorInfo, ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Props = { children: ReactNode };
type State = { error: Error | null; info: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: "" };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ info: info.componentStack || "" });
  }

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={styles.root}>
        <Text style={styles.title}>App error</Text>
        <Text style={styles.msg}>{error.message}</Text>
        <ScrollView style={styles.box}>
          <Text style={styles.stack}>{info || String(error)}</Text>
        </ScrollView>
        <Pressable
          style={styles.btn}
          onPress={() => this.setState({ error: null, info: "" })}
        >
          <Text style={styles.btnText}>Try again</Text>
        </Pressable>
        <Text style={styles.hint}>
          Screenshot this screen or copy the red text and send it so we can fix it.
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FEF2F2",
    padding: 24,
    paddingTop: 64,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#991B1B", marginBottom: 8 },
  msg: { fontSize: 16, color: "#7F1D1D", marginBottom: 12, lineHeight: 22 },
  box: {
    flexGrow: 0,
    maxHeight: 280,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  stack: { fontSize: 12, color: "#450A0A", fontFamily: "monospace" },
  btn: {
    marginTop: 16,
    backgroundColor: "#DC2626",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
  hint: { marginTop: 16, color: "#7F1D1D", fontSize: 13, lineHeight: 18 },
});
