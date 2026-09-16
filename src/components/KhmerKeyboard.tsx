import { KEY_ROWS, keyHintFor, type KeyDef } from "@/lib/keymap";
import { ZWSP } from "@/lib/khmer";
import { cn } from "@/lib/utils";

type Props = {
  /** the next character the learner must produce */
  nextChar?: string;
};

function KeyCap({ keyDef, active, activeShift }: { keyDef: KeyDef; active: boolean; activeShift: boolean }) {
  const shiftLabel = keyDef.shift === ZWSP ? "ZWSP" : keyDef.shift;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center rounded-md border px-1 py-1.5 text-center transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-none"
          : "border-border bg-card text-foreground",
      )}
      style={keyDef.wide ? { flexGrow: keyDef.wide } : undefined}
      aria-label={keyDef.code}
    >
      <span
        className={cn(
          "km truncate text-[11px] leading-none",
          active && activeShift ? "opacity-100 font-semibold" : "opacity-60",
        )}
      >
        {shiftLabel ?? "\u00A0"}
      </span>
      <span
        className={cn(
          "km truncate text-sm leading-tight",
          active && !activeShift && "font-semibold",
        )}
      >
        {keyDef.label ?? keyDef.normal}
      </span>
      <span className="hidden text-[9px] uppercase tracking-wide opacity-45 sm:block">
        {keyDef.code === "space" ? "" : keyDef.code}
      </span>
    </div>
  );
}

export function KhmerKeyboard({ nextChar }: Props) {
  const hint = keyHintFor(nextChar);

  return (
    <div className="card-elevated p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="km text-sm font-medium">ការណែនាំគ្រាប់ចុច (NiDA Khmer Unicode)</p>
        {hint ? (
          <p className="km text-xs text-muted-foreground">
            ចុច{" "}
            <span className="rounded bg-primary-soft px-1.5 py-0.5 font-mono text-accent-foreground">
              {hint.shift ? `Shift + ${hint.code}` : hint.code}
            </span>
          </p>
        ) : (
          <p className="km text-xs text-muted-foreground">ប្រើក្តារចុចខ្មែរ Unicode របស់ឧបករណ៍អ្នក</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 select-none">
        {KEY_ROWS.map((row, index) => (
          <div key={index} className="flex gap-1.5">
            {row.map((keyDef) => (
              <KeyCap
                key={keyDef.code}
                keyDef={keyDef}
                active={hint?.code === keyDef.code}
                activeShift={Boolean(hint?.shift)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
