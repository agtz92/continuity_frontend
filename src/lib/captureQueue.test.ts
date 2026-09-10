/**
 * La promesa de la captura rápida es "nada se pierde". Estos tests son esa
 * promesa: el borrador sobrevive a cerrar el overlay, la cola guarda lo que no
 * pudo salir, y el token viaja con ella para que reintentar no duplique.
 */

import { beforeEach, describe, it, expect, vi } from "vitest";

import {
  __resetCaptureStorageForTests,
  clearDraft,
  dequeue,
  enqueue,
  listQueued,
  markAttempt,
  newToken,
  readDraft,
  saveDraft,
  subscribeQueue,
} from "./captureQueue";

beforeEach(() => {
  __resetCaptureStorageForTests();
});

describe("borrador", () => {
  it("lo escrito vuelve tal cual", () => {
    saveDraft({ kind: "idea", text: "vender por WhatsApp", extra: "porque sí" });
    expect(readDraft()).toEqual({
      kind: "idea",
      text: "vender por WhatsApp",
      extra: "porque sí",
    });
  });

  it("un borrador vacío no se guarda: reabrir no debe 'restaurar' nada", () => {
    saveDraft({ kind: "task", text: "algo", extra: "" });
    saveDraft({ kind: "task", text: "   ", extra: "  " });
    expect(readDraft()).toBeNull();
  });

  it("guardar de verdad lo borra", () => {
    saveDraft({ kind: "task", text: "llamar al banco", extra: "" });
    clearDraft();
    expect(readDraft()).toBeNull();
  });

  it("un JSON corrupto no rompe la captura", () => {
    localStorage.setItem("continuity:capture-draft", "{no es json");
    expect(readDraft()).toBeNull();
  });
});

describe("cola", () => {
  const entry = (text: string) => ({
    token: newToken(),
    kind: "task" as const,
    text,
    extra: "",
  });

  it("encola en orden y devuelve lo encolado", () => {
    enqueue(entry("uno"));
    enqueue(entry("dos"));
    expect(listQueued().map((q) => q.text)).toEqual(["uno", "dos"]);
  });

  it("cada entrada lleva su token, que es lo que evita el duplicado", () => {
    const token = newToken();
    enqueue({ token, kind: "task", text: "uno", extra: "" });
    expect(listQueued()[0].token).toBe(token);
  });

  it("se saca por id cuando por fin entra", () => {
    enqueue(entry("uno"));
    const second = enqueue(entry("dos"));
    dequeue(second.id);
    expect(listQueued().map((q) => q.text)).toEqual(["uno"]);
  });

  it("cuenta los intentos, para poder rendirse con criterio", () => {
    const queued = enqueue(entry("uno"));
    markAttempt(queued.id);
    expect(listQueued()[0].attempts).toBe(2);
  });

  it("al desbordar se tira lo más viejo, no lo recién escrito", () => {
    for (let i = 0; i < 30; i++) enqueue(entry(`captura ${i}`));
    const queue = listQueued();
    expect(queue).toHaveLength(25);
    expect(queue.at(-1)?.text).toBe("captura 29");
    expect(queue[0].text).toBe("captura 5");
  });

  it("avisa a quien la observa", () => {
    const seen = vi.fn();
    const unsub = subscribeQueue(seen);
    enqueue(entry("uno"));
    expect(seen).toHaveBeenLastCalledWith([
      expect.objectContaining({ text: "uno" }),
    ]);
    unsub();
  });
});

describe("sin almacenamiento", () => {
  it("si localStorage lanza, capturar sigue funcionando", () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

    expect(() =>
      saveDraft({ kind: "task", text: "no cabe", extra: "" })
    ).not.toThrow();
    expect(() =>
      enqueue({ token: "t", kind: "task", text: "tampoco", extra: "" })
    ).not.toThrow();

    setItem.mockRestore();
  });
});
