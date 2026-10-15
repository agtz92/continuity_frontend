import { describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: { access_token: "t" } } }),
    },
  },
}));
vi.mock("./assistantApi", () => ({ assistantBaseUrl: "http://x" }));

import {
  streamChat,
  StreamCutError,
  type AssistantEvent,
} from "./assistantStream";

function sseResponse(frames: string[]): Response {
  const enc = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(ctrl) {
      for (const f of frames) ctrl.enqueue(enc.encode(f));
      ctrl.close(); // the proxy hangs up — no `done` frame ever arrives
    },
  });
  return new Response(body, { status: 200 });
}

const CUT_STREAM = [
  'event: meta\ndata: {"conversation_id":"c1"}\n\n',
  'event: text_delta\ndata: {"text":"Voy a crear el proyecto"}\n\n',
  'event: tool_use_start\ndata: {"id":"tu_1","name":"create_project","input":{}}\n\n',
];

describe("streamChat when the connection is cut mid-turn", () => {
  // Un stream que se cierra sin `done` antes resolvía como si hubiera
  // terminado bien, y la UI se quedaba en silencio con la burbuja a medias.
  it("rejects instead of resolving silently", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => sseResponse(CUT_STREAM)));
    const events: AssistantEvent[] = [];
    await expect(
      streamChat({ content: "x", onEvent: (e) => events.push(e) }),
    ).rejects.toThrow(StreamCutError);
  });

  it("still delivers what arrived, and names the conversation to reload", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => sseResponse(CUT_STREAM)));
    const events: AssistantEvent[] = [];
    const err = await streamChat({
      content: "x",
      onEvent: (e) => events.push(e),
    }).catch((e) => e);
    expect(err).toBeInstanceOf(StreamCutError);
    expect((err as StreamCutError).conversationId).toBe("c1");
    expect(events.map((e) => e.kind)).toEqual([
      "meta",
      "text_delta",
      "tool_use_start",
    ]);
  });
});

describe("streamChat on a complete turn", () => {
  it("ignores keepalive comments and resolves on `done`", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        sseResponse([
          'event: meta\ndata: {"conversation_id":"c1"}\n\n',
          'event: tool_use_pending\ndata: {"name":"create_note"}\n\n',
          ": ping\n\n",
          ": ping\n\n",
          'event: done\ndata: {"ok":true}\n\n',
        ]),
      ),
    );
    const events: AssistantEvent[] = [];
    await streamChat({ content: "x", onEvent: (e) => events.push(e) });
    expect(events.map((e) => e.kind)).toEqual([
      "meta",
      "tool_use_pending",
      "done",
    ]);
  });
});
