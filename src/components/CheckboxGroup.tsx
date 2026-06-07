import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"

type Props = {
  interests: string[];
  setInterests: React.Dispatch<React.SetStateAction<string[]>>;
};

const OPTIONS = [
  { label: "History & Culture", value: "history" },
  { label: "Food & Drink", value: "food" },
  { label: "Lifestyle & Entertainment", value: "lifestyle" },
  { label: "Nature & Outdoors", value: "nature" },
];
export function CheckboxGroup({ interests, setInterests }: Props) {
  const toggleInterest = (value: string, checked: boolean) => {
    setInterests((prev) =>
      checked ? [...prev, value] : prev.filter((i) => i !== value)
    );
  };

  return (
    <FieldSet className="space-y-1">
      <FieldLegend variant="label" className="leading-none">Interests:</FieldLegend>
      <FieldDescription className="mt-0 mb-0">
        Select any and all travel interests.
      </FieldDescription>

      <FieldGroup className="grid grid-cols-2 gap-3 mt-0">
        {OPTIONS.map((option) => (
          <Field key={option.value} orientation="horizontal">
            <Checkbox
              checked={interests.includes(option.value)}
              onCheckedChange={(checked) =>
                toggleInterest(option.value, Boolean(checked))
              }
            />
            <FieldLabel className="font-normal">
              {option.label}
            </FieldLabel>
          </Field>
        ))}
      </FieldGroup>
    </FieldSet>
  );
}