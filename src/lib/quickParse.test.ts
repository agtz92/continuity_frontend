/**
 * El parser de ⌘K decide qué acaba siendo el título de lo que capturas. Si se
 * come un token de más, el usuario pierde texto sin enterarse; si se come uno
 * de menos, guarda basura en el título. Los dos fallos son silenciosos.
 */

import { describe, it, expect } from "vitest";

import type { Project } from "@/lib/types";
import { matchProject, quickParse } from "./quickParse";

function project(id: string, name: string): Project {
  return {
    id,
    name,
    description: "",
    why: "",
    nextStep: "",
    status: "active",
    priority: "medium",
    categoryId: null,
    lastActivity: "2026-03-01T00:00:00Z",
    created: "2026-01-01T00:00:00Z",
    dueDate: null,
  };
}

const PROJECTS = [
  project("p1", "Migración legacy"),
  project("p2", "Web"),
  project("p3", "Web · rediseño"),
  project("p4", "Impuestos"),
];

describe("matchProject", () => {
  it("ignora acentos y mayúsculas", () => {
    expect(matchProject("MIGRACION", PROJECTS)?.id).toBe("p1");
  });

  it("entre varios prefijos gana el nombre más corto", () => {
    expect(matchProject("web", PROJECTS)?.id).toBe("p2");
  });

  it("cae a coincidencia por contenido si no hay prefijo", () => {
    expect(matchProject("legacy", PROJECTS)?.id).toBe("p1");
  });

  it("devuelve null cuando no hay nada parecido", () => {
    expect(matchProject("zzz", PROJECTS)).toBeNull();
  });
});

describe("quickParse", () => {
  it("saca proyecto y blocker, y deja el título limpio", () => {
    const r = quickParse(
      "Llamar a Hacienda #impuestos !esperando el poder notarial",
      PROJECTS
    );
    expect(r.title).toBe("Llamar a Hacienda");
    expect(r.projectId).toBe("p4");
    expect(r.blocked).toBe(true);
    expect(r.blockerReason).toBe("esperando el poder notarial");
  });

  it("el ! se lleva la frase entera, no solo una palabra", () => {
    const r = quickParse("Cerrar el trato !falta que firme el cliente", PROJECTS);
    expect(r.blockerReason).toBe("falta que firme el cliente");
    expect(r.title).toBe("Cerrar el trato");
  });

  it("un ! solo marca bloqueo sin razón", () => {
    const r = quickParse("Revisar contrato !", PROJECTS);
    expect(r.blocked).toBe(true);
    expect(r.blockerReason).toBe("");
    expect(r.title).toBe("Revisar contrato");
  });

  it("un #token que no resuelve SE QUEDA en el título", () => {
    const r = quickParse("Comprar #cafe para la oficina", PROJECTS);
    expect(r.title).toBe("Comprar #cafe para la oficina");
    expect(r.projectId).toBeNull();
  });

  it("solo el primer # cuenta; el segundo es texto", () => {
    const r = quickParse("Nota #web sobre #impuestos", PROJECTS);
    expect(r.projectId).toBe("p2");
    expect(r.title).toBe("Nota sobre #impuestos");
  });

  it("un # después del ! es parte de la razón, no proyecto", () => {
    const r = quickParse("Enviar informe !espera a #web", PROJECTS);
    expect(r.projectId).toBeNull();
    expect(r.blockerReason).toBe("espera a #web");
  });

  it("sin tokens, el texto es el título tal cual", () => {
    const r = quickParse("  Escribir el resumen  ", PROJECTS);
    expect(r.title).toBe("Escribir el resumen");
    expect(r.projectId).toBeNull();
    expect(r.blocked).toBe(false);
  });
});
