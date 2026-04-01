import { useState, useEffect } from "react";

export type MicPermissionStatus = "granted" | "denied" | "prompt" | "unsupported";

export function useMicPermission() {
  const [status, setStatus] = useState<MicPermissionStatus>("prompt");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const hasSpeechRecognition =
      !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;

    if (!hasSpeechRecognition || !navigator.permissions) {
      setStatus("unsupported");
      setChecked(true);
      return;
    }

    let permissionStatus: PermissionStatus | null = null;

    navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((ps) => {
        permissionStatus = ps;
        setStatus(ps.state as MicPermissionStatus);
        setChecked(true);

        ps.onchange = () => {
          setStatus(ps.state as MicPermissionStatus);
        };
      })
      .catch(() => {
        setStatus("prompt");
        setChecked(true);
      });

    return () => {
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, []);

  const requestPermission = async (): Promise<MicPermissionStatus> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setStatus("granted");
      return "granted";
    } catch {
      setStatus("denied");
      return "denied";
    }
  };

  return { status, checked, requestPermission };
}
