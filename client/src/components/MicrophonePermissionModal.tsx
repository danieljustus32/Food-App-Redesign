import { useState } from "react";
import { Mic, MicOff, X } from "lucide-react";
import { useMicPermission } from "@/hooks/use-mic-permission";

interface MicrophonePermissionModalProps {
  onDismiss: () => void;
}

export function MicrophonePermissionModal({ onDismiss }: MicrophonePermissionModalProps) {
  const { status, requestPermission } = useMicPermission();
  const [requesting, setRequesting] = useState(false);

  const handleAllow = async () => {
    setRequesting(true);
    const result = await requestPermission();
    setRequesting(false);
    if (result === "granted") onDismiss();
  };

  const isDenied = status === "denied";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm"
      data-testid="mic-permission-modal"
    >
      <div className="w-full max-w-md bg-card rounded-3xl shadow-2xl p-6 pb-8 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDenied ? "bg-red-500/10 text-red-400" : "bg-primary/10 text-primary"}`}>
            {isDenied ? <MicOff size={24} /> : <Mic size={24} />}
          </div>
          <button
            onClick={onDismiss}
            className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            data-testid="button-dismiss-mic-modal"
          >
            <X size={16} />
          </button>
        </div>

        {isDenied ? (
          <>
            <h2 className="text-xl font-bold text-foreground mb-2">Microphone access blocked</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Feastly's hands-free cooking mode reads each step aloud and listens for your voice commands like "next" or "repeat" — so your hands stay clean and on the task.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Your browser has blocked microphone access. To fix this, click the <strong className="text-foreground">lock icon</strong> in your browser's address bar, find <strong className="text-foreground">Microphone</strong>, and set it to <strong className="text-foreground">Allow</strong>.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-foreground mb-2">Enable hands-free cooking</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Feastly reads each ingredient and step aloud, then listens for your voice — say <strong className="text-foreground">"next"</strong>, <strong className="text-foreground">"repeat"</strong>, or <strong className="text-foreground">"done"</strong> without touching your phone. Microphone access is only used while you're actively cooking.
            </p>
          </>
        )}

        <div className="space-y-3">
          {!isDenied && (
            <button
              onClick={handleAllow}
              disabled={requesting}
              className="w-full py-3.5 bg-primary text-primary-foreground font-semibold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
              data-testid="button-allow-mic"
            >
              {requesting ? "Requesting access…" : "Allow Microphone"}
            </button>
          )}
          <button
            onClick={onDismiss}
            className="w-full py-3.5 text-muted-foreground font-medium rounded-2xl hover:bg-muted/60 transition-colors text-sm"
            data-testid="button-dismiss-mic-prompt"
          >
            {isDenied ? "Got it" : "Not Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
