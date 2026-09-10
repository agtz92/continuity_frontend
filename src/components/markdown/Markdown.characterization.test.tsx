/**
 * Tests de **caracterización** del renderer de markdown.
 *
 * No describen lo que el renderer debería hacer: describen lo que hace HOY, en
 * Quick Notes, antes de tocarlo. Existen por una razón concreta: la fase 1 del
 * plan del chat exige que "Quick Notes siga renderizando idéntico a antes", y
 * un renderer se rompe **en silencio** — una lista que deja de anidar, una
 * negrita que se come el asterisco, un enlace que pierde el `rel`: nada de eso
 * lanza un error ni falla el build.
 *
 * Si uno de estos tests falla al extender el parser, la pregunta no es "¿arreglo
 * el test?" sino "¿de verdad quería cambiar esto para las notas?".
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

import { Markdown } from "./Markdown";

function html(text: string): string {
  const { container } = render(<Markdown text={text} variant="note" />);
  return container.innerHTML;
}

describe("Markdown · variant note (caracterización)", () => {
  it("un párrafo suelto sale como <p>", () => {
    expect(html("Hola mundo")).toContain("<p");
    expect(html("Hola mundo")).toContain("Hola mundo");
  });

  it("los tres niveles de encabezado salen como <p> con peso, no como <h*>", () => {
    // Deliberado en el original: dentro de una nota, un <h1> real rompería la
    // jerarquía del documento que lo contiene.
    const out = html("# Uno\n## Dos\n### Tres");
    expect(out).not.toContain("<h1");
    expect(out).not.toContain("<h2");
    expect((out.match(/<p /g) ?? []).length).toBe(3);
  });

  it("lista no ordenada con - y con *", () => {
    expect(html("- uno\n- dos")).toContain("<ul");
    expect(html("* uno\n* dos")).toContain("<ul");
  });

  it("lista ordenada", () => {
    const out = html("1. uno\n2. dos");
    expect(out).toContain("<ol");
    expect((out.match(/<li>/g) ?? []).length).toBe(2);
  });

  it("cambiar de tipo de lista cierra la anterior y abre otra", () => {
    const out = html("- uno\n1. dos");
    expect(out).toContain("<ul");
    expect(out).toContain("<ol");
  });

  it("una línea en blanco cierra la lista", () => {
    const out = html("- uno\n\n- dos");
    expect((out.match(/<ul/g) ?? []).length).toBe(2);
  });

  it("negrita, cursiva con * y con _, y código inline", () => {
    expect(html("**fuerte**")).toContain("<strong>fuerte</strong>");
    expect(html("*flojo*")).toContain("<em>flojo</em>");
    expect(html("_flojo_")).toContain("<em>flojo</em>");
    expect(html("`codigo`")).toContain("<code");
  });

  it("los enlaces abren fuera y llevan rel de seguridad", () => {
    const out = html("[texto](https://ejemplo.com)");
    expect(out).toContain('href="https://ejemplo.com"');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noreferrer"');
  });

  it("el markdown que no soporta se queda como texto, no desaparece", () => {
    // Sin soporte de imágenes ni de citas: el original las imprime tal cual.
    const out = html("> cita\n![img](x.png)");
    expect(out).toContain("cita");
    expect(out).toContain("img");
  });

  it("varios elementos en línea en el mismo párrafo", () => {
    const out = html("dice **esto** y `aquello`");
    expect(out).toContain("<strong>esto</strong>");
    expect(out).toContain("<code");
    expect(out).toContain("dice");
  });

  it("normaliza CRLF", () => {
    expect((html("- uno\r\n- dos").match(/<li>/g) ?? []).length).toBe(2);
  });

  it("texto vacío no revienta", () => {
    expect(() => html("")).not.toThrow();
  });
});
