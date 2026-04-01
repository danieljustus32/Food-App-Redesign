import { useState, useEffect } from "react";

export type MicPermissionStatus = "granted" | "denied" | "prompt" | "unsupported";

export function useMicPermission() {
  const [status, setStatus] = useState<MicPermissionStatus>("prompt");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const hasSpeechRecognition =
      !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;

    console.log("[useMicPermission] hasSpeechRecognition:", hasSpeechRecognition);
    console.log("[useMicPermission] navigator.permissions available:", !!navigator.permissions);

    if (!hasSpeechRecognition || !navigator.permissions) {
      console.log("[useMicPermission] → setting status: unsupported");
      setStatus("unsupported");
      setChecked(true);
      return;
    }

    let permissionStatus: PermissionStatus | null = null;

    navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((ps) => {
        permissionStatus = ps;
        console.log("[useMicPermission] permissions.query resolved → state:", ps.state);
        setStatus(ps.state as MicPermissionStatus);
        setChecked(true);

        ps.onchange = () => {
          console.log("[useMicPermission] permission changed →", ps.state);
          setStatus(ps.state as MicPermissionStatus);
        };
      })
      .catch((err) => {
        console.warn("[useMicPermission] permissions.query failed:", err);
        setStatus("prompt");
        setChecked(true);
      });

    return () => {
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, []);

  const requestPermission = async (): Promise<MicPermissionStatus> => {
    console.log("[useMicPermission] requestPermission called (getUserMedia)");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      console.log("[useMicPermission] getUserMedia → granted");
      setStatus("granted");
      return "granted";
    } catch (err) {
      console.warn("[useMicPermission] getUserMedia → denied:", err);
      setStatus("denied");
      return "denied";
    }
  };

  return { status, checked, requestPermission };
}
