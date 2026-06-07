"use client"

import {
  Field,
  FieldDescription,
  FieldTitle,
} from "@/components/ui/field"
import { Slider } from "@/components/ui/slider"

type Props = {
  value: number
  setValue: React.Dispatch<React.SetStateAction<number>>
}

const MIN = 50
const MAX = 1000

export function FieldSlider({ value, setValue }: Props) {
  const percent = ((value - MIN) / (MAX - MIN)) * 100

  return (
    <Field className="w-full max-w-md !gap-0">
      <FieldTitle className="leading-none">Daily Per-Person Budget</FieldTitle>

      <FieldDescription className="mt-1 leading-snug">
        Approximate daily spending target.
      </FieldDescription>

      <div className="relative mt-8.5">
        <div
          className="absolute -top-8 -translate-x-1/2 rounded-md border bg-background px-2 py-1 text-xs font-medium shadow-sm"
          style={{ left: `${percent}%` }}
        >
          ${value}
        </div>

        <Slider
          value={[value]}
          onValueChange={(v) => setValue(v[0])}
          min={MIN}
          max={MAX}
          step={25}
        />
      </div>

      <div className="mt-2 flex justify-between text-sm text-muted-foreground">
        <span>${MIN}</span>
        <span>${MAX}+</span>
      </div>
    </Field>
  )
}