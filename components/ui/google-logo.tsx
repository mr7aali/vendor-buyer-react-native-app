import React from "react";
import Svg, { Path } from "react-native-svg";

type GoogleLogoProps = {
  size?: number;
};

export function GoogleLogo({ size = 18 }: GoogleLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.13 2.73-2.4 3.57v2.95h3.88c2.26-2.08 3.56-5.15 3.56-8.76Z"
        fill="#4285F4"
      />
      <Path
        d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3.01c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24Z"
        fill="#34A853"
      />
      <Path
        d="M5.27 14.28A7.24 7.24 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.62H1.27A12 12 0 0 0 0 12c0 1.94.46 3.78 1.27 5.38l4-3.1Z"
        fill="#FBBC05"
      />
      <Path
        d="M12 4.76c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.18 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.1c.95-2.85 3.6-4.96 6.73-4.96Z"
        fill="#EA4335"
      />
    </Svg>
  );
}
