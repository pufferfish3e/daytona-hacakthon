import { useState, type FormEvent } from "react";
import { CtaButton } from "./CtaButton";

type RepoUrlInputProps = {
  onSubmit: (url: string) => void;
  placeholder?: string;
  buttonLabel?: string;
  className?: string;
  defaultValue?: string;
};

export function RepoUrlInput({
  onSubmit,
  placeholder = "https://github.com/org/archived-app",
  buttonLabel = "Remember this repo",
  className = "",
  defaultValue = "",
}: RepoUrlInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) {
      setError("Paste a GitHub URL to continue.");
      return;
    }
    setError("");
    onSubmit(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center sm:rounded-full sm:bg-white sm:p-1.5">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError("");
          }}
          placeholder={placeholder}
          className="w-full rounded-full bg-white px-5 py-3 text-sm text-[#010101] placeholder:text-[#010101]/40 outline-none sm:flex-1 sm:bg-transparent sm:py-2"
        />
        <CtaButton type="submit" label={buttonLabel} className="w-full sm:w-auto sm:self-stretch sm:px-6" />
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </form>
  );
}
