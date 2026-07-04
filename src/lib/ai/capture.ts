import Anthropic from "@anthropic-ai/sdk";
import { formatISO } from "date-fns";
import type { Priority } from "@/lib/types";

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export type CaptureRoute =
  | { classification: "task"; title: string; priority: Priority; dueDate: string | null }
  | { classification: "habit_log"; habitId: string }
  | { classification: "unrecognized" };

const ROUTE_TOOL: Anthropic.Tool = {
  name: "route_capture",
  description:
    "Classify a free-text capture entry as either a new task or the logging of an existing habit for today, and extract the relevant fields.",
  input_schema: {
    type: "object",
    properties: {
      classification: {
        type: "string",
        enum: ["task", "habit_log", "unrecognized"],
        description:
          "'task' for anything to do or remember. 'habit_log' only when the text clearly reports completing one of the user's existing habits today. 'unrecognized' if genuinely unclear.",
      },
      title: {
        type: "string",
        description: "Required when classification is 'task'. A short, clean task title.",
      },
      priority: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "Required when classification is 'task'. Infer urgency, default 'medium'.",
      },
      due_date: {
        type: "string",
        description:
          "Optional, only when classification is 'task' and a date/day is mentioned or implied. ISO format YYYY-MM-DD.",
      },
      habit_id: {
        type: "string",
        description:
          "Required when classification is 'habit_log'. Must be the id of one of the provided existing habits.",
      },
    },
    required: ["classification"],
  },
};

export async function classifyCapture(
  text: string,
  habits: { id: string; name: string }[],
): Promise<CaptureRoute> {
  const today = formatISO(new Date(), { representation: "date" });
  const habitList =
    habits.length > 0
      ? habits.map((h) => `- ${h.id}: ${h.name}`).join("\n")
      : "(no habits defined yet)";

  const message = await getClient().messages.create({
    model: "claude-sonnet-5",
    max_tokens: 500,
    system: `Today's date is ${today}. The user's existing habits are:\n${habitList}\n\nOnly use classification "habit_log" if the text is clearly reporting that one of these specific habits was done today. Otherwise, and for anything ambiguous, classify as "task" so nothing gets lost.`,
    tools: [ROUTE_TOOL],
    tool_choice: { type: "tool", name: "route_capture" },
    messages: [{ role: "user", content: text }],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) return { classification: "unrecognized" };

  const input = toolUse.input as Record<string, unknown>;

  if (input.classification === "habit_log" && typeof input.habit_id === "string") {
    return { classification: "habit_log", habitId: input.habit_id };
  }

  if (input.classification === "task" && typeof input.title === "string") {
    return {
      classification: "task",
      title: input.title,
      priority: (["low", "medium", "high"].includes(input.priority as string)
        ? input.priority
        : "medium") as Priority,
      dueDate: typeof input.due_date === "string" ? input.due_date : null,
    };
  }

  return { classification: "unrecognized" };
}
