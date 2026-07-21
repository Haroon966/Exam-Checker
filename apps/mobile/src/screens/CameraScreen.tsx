import React, { useRef, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { IconCamera, IconImage } from "../components/Icons";
import { colors, radius, space, touch, type } from "../theme";
import type { RootStackParamList } from "../navigation";

type Nav = NativeStackNavigationProp<RootStackParamList, "Camera">;
type R = RouteProp<RootStackParamList, "Camera">;

export default function CameraScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { examId } = route.params;
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [pages, setPages] = useState<string[]>([]);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [busy, setBusy] = useState(false);

  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets.length) {
      setPages((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        /* ignore */
      }
    }
  }

  if (!permission) {
    return <View style={styles.root} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permission, { paddingTop: insets.top + space.xl }]}>
        <IconCamera size={40} color={colors.primary} />
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionBody}>
          Photograph exam papers clearly, in good light, filling the frame.
        </Text>
        <Button label="Allow camera" variant="cta" onPress={requestPermission} />
        <Button
          label="Pick from gallery instead"
          variant="ghost"
          leftIcon={<IconImage size={18} color={colors.primary} />}
          onPress={pickFromLibrary}
          style={{ marginTop: space.sm }}
        />
      </View>
    );
  }

  async function takePhoto() {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });
      if (photo?.uri) {
        setPages((prev) => [...prev, photo.uri]);
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      Alert.alert("Camera error", err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  function removePage(index: number) {
    setPages((prev) => prev.filter((_, i) => i !== index));
  }

  function goCheck() {
    if (!pages.length) {
      Alert.alert("No pages", "Take at least one photo of the paper.");
      return;
    }
    navigation.navigate("Processing", { examId, imageUris: pages });
  }

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <View style={[styles.overlayTop, { top: insets.top + 48 }]}>
          <Text style={styles.guide}>Frame the paper · good light · flat page</Text>
          <View style={styles.countPill}>
            <Text style={styles.pageCount}>{pages.length} page(s)</Text>
          </View>
        </View>
      </CameraView>

      {pages.length > 0 ? (
        <ScrollView
          horizontal
          style={styles.thumbs}
          contentContainerStyle={{ gap: space.sm, padding: space.md }}
          showsHorizontalScrollIndicator={false}
        >
          {pages.map((uri, i) => (
            <Pressable
              key={`${uri}-${i}`}
              onLongPress={() => removePage(i)}
              accessibilityLabel={`Page ${i + 1}, long press to remove`}
              accessibilityRole="imagebutton"
            >
              <Image source={{ uri }} style={styles.thumb} accessibilityIgnoresInvertColors />
              <Text style={styles.thumbLabel}>P{i + 1}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={[styles.controls, { paddingBottom: insets.bottom + space.sm }]}>
        <Pressable
          style={styles.sideBtn}
          onPress={pickFromLibrary}
          accessibilityRole="button"
          accessibilityLabel="Open gallery"
        >
          <IconImage size={22} color={colors.white} />
          <Text style={styles.sideBtnText}>Gallery</Text>
        </Pressable>

        <Pressable
          style={[styles.shutter, busy && { opacity: 0.6 }]}
          onPress={takePhoto}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Take photo"
        >
          <View style={styles.shutterInner} />
        </Pressable>

        <Pressable
          style={styles.sideBtn}
          onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
          accessibilityRole="button"
          accessibilityLabel="Flip camera"
        >
          <Text style={styles.sideBtnText}>Flip</Text>
        </Pressable>
      </View>

      <View style={styles.checkWrap}>
        <Button
          label={pages.length ? `Check paper (${pages.length})` : "Take a photo first"}
          variant="cta"
          disabled={!pages.length}
          onPress={goCheck}
        />
        {pages.length > 0 ? (
          <Text style={styles.hint}>Long-press a thumbnail to remove it</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cameraBg },
  camera: { flex: 1 },
  overlayTop: {
    position: "absolute",
    left: space.lg,
    right: space.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: space.sm,
  },
  guide: {
    ...type.caption,
    color: colors.white,
    flex: 1,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 4,
  },
  countPill: {
    backgroundColor: colors.cta,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    minHeight: 32,
    justifyContent: "center",
  },
  pageCount: { ...type.caption, color: colors.white, fontFamily: "PlusJakartaSans_700Bold" },
  thumbs: { maxHeight: 108, backgroundColor: colors.cameraBg },
  thumb: { width: 64, height: 80, borderRadius: radius.sm, backgroundColor: "#334155" },
  thumbLabel: { ...type.caption, color: "#94A3B8", textAlign: "center", marginTop: 2 },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: space.lg,
    backgroundColor: colors.cameraBg,
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    minWidth: touch.min,
    minHeight: touch.min,
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.cta,
  },
  sideBtn: {
    minWidth: touch.min,
    minHeight: touch.min,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: space.sm,
  },
  sideBtnText: { ...type.caption, color: colors.white },
  checkWrap: {
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
    backgroundColor: colors.cameraBg,
  },
  hint: { ...type.caption, color: "#94A3B8", textAlign: "center", marginTop: space.sm },
  permission: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: space.xl,
    justifyContent: "center",
    gap: space.md,
  },
  permissionTitle: { ...type.title, color: colors.text },
  permissionBody: { ...type.body, color: colors.muted, marginBottom: space.md },
});
