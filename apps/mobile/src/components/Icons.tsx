import React from "react";
import Svg, { Path, Circle, Rect, Polyline, Line } from "react-native-svg";
import { colors } from "../theme";

type IconProps = {
  size?: number;
  color?: string;
  accessibilityLabel?: string;
};

function Base({
  size = 24,
  color = colors.text,
  children,
  accessibilityLabel,
}: IconProps & { children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityLabel={accessibilityLabel}
      accessible={!!accessibilityLabel}
    >
      {children}
    </Svg>
  );
}

const stroke = (color: string) => ({
  stroke: color,
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function IconPlus(props: IconProps) {
  return (
    <Base {...props} accessibilityLabel={props.accessibilityLabel ?? "Add"}>
      <Path d="M12 5v14M5 12h14" {...stroke(props.color ?? colors.text)} />
    </Base>
  );
}

export function IconCamera(props: IconProps) {
  return (
    <Base {...props} accessibilityLabel={props.accessibilityLabel ?? "Camera"}>
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        {...stroke(props.color ?? colors.text)}
      />
      <Circle cx="12" cy="13" r="4" {...stroke(props.color ?? colors.text)} />
    </Base>
  );
}

export function IconChevron(props: IconProps) {
  return (
    <Base {...props} accessibilityLabel={props.accessibilityLabel ?? "Next"}>
      <Polyline points="9 18 15 12 9 6" {...stroke(props.color ?? colors.muted)} />
    </Base>
  );
}

export function IconBook(props: IconProps) {
  return (
    <Base {...props} accessibilityLabel={props.accessibilityLabel ?? "Exam"}>
      <Path
        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
        {...stroke(props.color ?? colors.text)}
      />
      <Path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        {...stroke(props.color ?? colors.text)}
      />
    </Base>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Base {...props} accessibilityLabel={props.accessibilityLabel ?? "Success"}>
      <Polyline points="20 6 9 17 4 12" {...stroke(props.color ?? colors.ok)} />
    </Base>
  );
}

export function IconAlert(props: IconProps) {
  return (
    <Base {...props} accessibilityLabel={props.accessibilityLabel ?? "Alert"}>
      <Circle cx="12" cy="12" r="10" {...stroke(props.color ?? colors.bad)} />
      <Line x1="12" y1="8" x2="12" y2="12" {...stroke(props.color ?? colors.bad)} />
      <Line x1="12" y1="16" x2="12.01" y2="16" {...stroke(props.color ?? colors.bad)} />
    </Base>
  );
}

export function IconHistory(props: IconProps) {
  return (
    <Base {...props} accessibilityLabel={props.accessibilityLabel ?? "History"}>
      <Circle cx="12" cy="12" r="10" {...stroke(props.color ?? colors.text)} />
      <Polyline points="12 6 12 12 16 14" {...stroke(props.color ?? colors.text)} />
    </Base>
  );
}

export function IconEdit(props: IconProps) {
  return (
    <Base {...props} accessibilityLabel={props.accessibilityLabel ?? "Edit"}>
      <Path d="M12 20h9" {...stroke(props.color ?? colors.text)} />
      <Path
        d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        {...stroke(props.color ?? colors.text)}
      />
    </Base>
  );
}

export function IconImage(props: IconProps) {
  return (
    <Base {...props} accessibilityLabel={props.accessibilityLabel ?? "Photos"}>
      <Rect x="3" y="3" width="18" height="18" rx="2" {...stroke(props.color ?? colors.text)} />
      <Circle cx="8.5" cy="8.5" r="1.5" {...stroke(props.color ?? colors.text)} />
      <Polyline points="21 15 16 10 5 21" {...stroke(props.color ?? colors.text)} />
    </Base>
  );
}

export function IconWifiOff(props: IconProps) {
  return (
    <Base {...props} accessibilityLabel={props.accessibilityLabel ?? "Offline"}>
      <Line x1="1" y1="1" x2="23" y2="23" {...stroke(props.color ?? colors.bad)} />
      <Path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" {...stroke(props.color ?? colors.bad)} />
      <Path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" {...stroke(props.color ?? colors.bad)} />
      <Path d="M10.71 5.05A16 16 0 0 1 22.58 9" {...stroke(props.color ?? colors.bad)} />
      <Path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" {...stroke(props.color ?? colors.bad)} />
      <Path d="M8.53 16.11a6 6 0 0 1 6.95 0" {...stroke(props.color ?? colors.bad)} />
      <Line x1="12" y1="20" x2="12.01" y2="20" {...stroke(props.color ?? colors.bad)} />
    </Base>
  );
}
