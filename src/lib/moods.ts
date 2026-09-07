// Client-safe: imported by the editor and the sidebar as well as by server code.
export const MOODS = [
  { value: "great", emoji: "\u{1F600}", label: "Great" },
  { value: "good", emoji: "\u{1F642}", label: "Good" },
  { value: "okay", emoji: "\u{1F610}", label: "Okay" },
  { value: "low", emoji: "\u{1F615}", label: "Low" },
  { value: "rough", emoji: "\u{1F622}", label: "Rough" },
  { value: "tired", emoji: "\u{1F634}", label: "Tired" },
  { value: "fired-up", emoji: "\u{1F525}", label: "Fired up" },
] as const;

export type Mood = (typeof MOODS)[number]["value"];

export const MOOD_EMOJI: Record<string, string> = Object.fromEntries(
  MOODS.map((mood) => [mood.value, mood.emoji]),
);
