"use client";

/**
 * Dictado para el compositor de Loop (web): voz → texto con la Web Speech API
 * del navegador. El texto cae en el campo; el usuario lo revisa y lo envía.
 * Loop nunca recibe audio.
 *
 * Gemelo de `continuity-mobile/src/hooks/useDictation.ts` (misma forma:
 * `available/listening/start/stop/cancel`). Firefox no implementa la API: ahí
 * `available` es false y el botón no se pinta. En Chrome/Edge el reconocimiento
 * lo hace el servicio del navegador (el audio sale del equipo hacia él).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "@/lib/toast";

// Tipos mínimos: la Web Speech API no viene en lib.dom de TypeScript.
interface SpeechResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechResultLike>;
}
interface SpeechErrorLike {
  error: string;
}
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((e: SpeechEventLike) => void) | null;
  onerror: ((e: SpeechErrorLike) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => RecognitionLike;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function recognizerLang(appLocale: string): string {
  const lang = appLocale.startsWith("es") ? "es" : "en";
  const nav = typeof navigator !== "undefined" ? navigator.language : "";
  if (nav && nav.toLowerCase().startsWith(lang)) return nav;
  return lang === "es" ? "es-MX" : "en-US";
}

function join(a: string, b: string): string {
  if (!a) return b;
  if (!b) return a;
  return /\s$/.test(a) ? a + b : `${a} ${b}`;
}

/** Errores que no son culpa de nadie: el usuario calló o canceló. */
const SILENT_ERRORS = new Set(["aborted", "no-speech"]);

export function useDictation(onText: (text: string) => void) {
  const t = useTranslations("assistant.dictation");
  const locale = useLocale();
  // Se decide tras montar: en SSR no hay `window` y el botón no debe parpadear.
  const [available, setAvailable] = useState(false);
  const [listening, setListening] = useState(false);
  const rec = useRef<RecognitionLike | null>(null);
  const committed = useRef("");
  const ignoring = useRef(false);
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  useEffect(() => {
    setAvailable(getCtor() !== null);
    return () => rec.current?.abort();
  }, []);

  const start = useCallback(
    (currentText: string) => {
      const Ctor = getCtor();
      if (!Ctor) return;
      rec.current?.abort();
      const r = new Ctor();
      r.lang = recognizerLang(locale);
      r.continuous = true;
      r.interimResults = true;
      ignoring.current = false;
      committed.current = currentText.trimEnd();
      r.onstart = () => setListening(true);
      r.onend = () => setListening(false);
      r.onresult = (e) => {
        if (ignoring.current) return;
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          const text = res[0].transcript.trim();
          if (!text) continue;
          if (res.isFinal) committed.current = join(committed.current, text);
          else interim = join(interim, text);
        }
        onTextRef.current(join(committed.current, interim));
      };
      r.onerror = (e) => {
        setListening(false);
        if (SILENT_ERRORS.has(e.error)) return;
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          toast.error(t("denied"));
        } else if (e.error === "language-not-supported") {
          toast.error(t("language"));
        } else {
          toast.error(t("failed"));
        }
      };
      rec.current = r;
      try {
        r.start();
      } catch {
        toast.error(t("failed"));
      }
    },
    [locale, t],
  );

  const stop = useCallback(() => rec.current?.stop(), []);

  /** Corta sin entregar nada más (el texto ya se envió o se descartó). */
  const cancel = useCallback(() => {
    ignoring.current = true;
    rec.current?.abort();
  }, []);

  return { available, listening, start, stop, cancel };
}
