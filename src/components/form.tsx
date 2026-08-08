import type { ReactNode } from "react";

/** One labelled control in a form grid. `span` widens it across the grid. */
export function Field({
  label,
  hint,
  span = 1,
  children,
}: {
  label: string;
  hint?: string;
  span?: 1 | 2;
  children: ReactNode;
}) {
  return (
    <div className={span === 2 ? "sm:col-span-2" : ""}>
      <label className="label mb-1.5 block">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-[12px] text-ink-3">{hint}</p> : null}
    </div>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">{children}</div>;
}

export function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="border-t border-rule pt-5">
      <legend className="label pr-3">{title}</legend>
      <div className="pt-1">{children}</div>
    </fieldset>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input ${props.className ?? ""}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`textarea ${props.className ?? ""}`} />;
}

/** A select backed by one of the taxonomy vocabularies. */
export function Select({
  name,
  options,
  defaultValue,
  placeholder,
  required,
}: {
  name: string;
  options: readonly string[];
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? (placeholder ? "" : options[0])}
      required={required}
      className="select"
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/** Multi-select over topics, rendered as checkboxes so it stays keyboard-simple. */
export function TopicPicker({
  topics,
  selected,
  name = "topicIds",
}: {
  topics: { id: string; name: string; category: string }[];
  selected: string[];
  name?: string;
}) {
  if (topics.length === 0) {
    return (
      <p className="text-[13px] text-ink-3">
        No topics yet — add some under Experience → Topics.
      </p>
    );
  }
  const chosen = new Set(selected);
  return (
    <div className="flex flex-wrap gap-1.5">
      {topics.map((t) => (
        <label
          key={t.id}
          className="group inline-flex cursor-pointer items-center gap-1.5 rounded-xs border border-rule-strong bg-surface px-2 py-1 text-[12.5px] transition-colors hover:border-ink-3 has-checked:border-clay has-checked:bg-clay-tint has-checked:text-clay-deep"
        >
          <input
            type="checkbox"
            name={name}
            value={t.id}
            defaultChecked={chosen.has(t.id)}
            className="size-3 accent-clay"
          />
          {t.name}
        </label>
      ))}
    </div>
  );
}
