"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onBack?: () => void;
  disabled?: boolean;
};

const placeholder = "Optionally add additional context...";

export function TextareaButton({ value, onChange, onSubmit, onBack, disabled }: Props) {
  return (
    <div className="grid w-full gap-2">
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <div className="flex gap-2">
        {onBack && (
          <Button variant="outline" onClick={onBack} disabled={disabled} className="flex-1">
            Back
          </Button>
        )}
        <Button onClick={onSubmit} disabled={disabled} className="flex-1">
          {disabled ? "Planning..." : "Plan my trip"}
        </Button>
      </div>
    </div>
  );
}
