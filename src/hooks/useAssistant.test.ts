import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({ supabase: { auth: {} } }));

import { storedToChat } from "./useAssistant";

describe("storedToChat (reload after a cut stream)", () => {
  it("folds a turn's rows into one bubble and pairs tool results", () => {
    const chat = storedToChat([
      { id: "u1", role: "user", content: [{ type: "text", text: "crea Finanzas" }], model: "", created: "" },
      {
        id: "a1",
        role: "assistant",
        content: [
          { type: "text", text: "Creo el proyecto:" },
          { type: "tool_use", id: "tu_1", name: "create_project", input: { name: "Finanzas" } },
        ],
        model: "m",
        created: "",
      },
      {
        id: "t1",
        role: "tool",
        content: [{ type: "tool_result", tool_use_id: "tu_1", content: '{"id":"p1"}' }],
        model: "",
        created: "",
      },
    ]);

    expect(chat).toEqual([
      { id: "u1", role: "user", text: "crea Finanzas" },
      {
        id: "a1",
        role: "assistant",
        blocks: [
          { type: "text", text: "Creo el proyecto:" },
          {
            type: "tool_use",
            id: "tu_1",
            name: "create_project",
            input: { name: "Finanzas" },
            output: { id: "p1" },
          },
        ],
      },
    ]);
  });
});
