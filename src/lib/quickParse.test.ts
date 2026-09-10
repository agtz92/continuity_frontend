/**
 * El parser de ⌘K decide qué acaba siendo el título de lo que capturas. Si se
 * come un token de más, el usuario pierde texto sin enterarse; si se come uno
 * de menos, guarda basura en el título. Los dos fallos son silenciosos.
 *
 * Los casos de "lo que NO debe pasar" son los que más valen: son regresiones
 * reales del parser anterior, que cortaba el título en el primer `!` que
 * encontrara y desempataba los proyectos por longitud del nombre.
 */

import { describe, it, expect } from "vitest";

import type { Project } from "@/lib/types";
import {
  activeToken,
  matchProject,
  projectSuggestions,
  projectToken,
  quickParse,
  replaceToken,
} from "./quickParse";

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

const parse = (raw: string) => quickParse(raw, PROJECTS);

describe("matchProject", () => {
  it("ignora acentos y mayúsculas", () => {
    expect(matchProject("MIGRACION", PROJECTS).project?.id).toBe("p1");
  });

  it("el exacto gana aunque otro empiece igual", () => {
    expect(matchProject("web", PROJECTS).project?.id).toBe("p2");
  });

  it("un prefijo ambiguo NO elige: devuelve los candidatos", () => {
    const hit = matchProject("we", PROJECTS);
    expect(hit.project).toBeNull();
    expect(hit.candidates.map((p) => p.id)).toEqual(["p2", "p3"]);
  });

  it("cae a coincidencia por contenido si es única", () => {
    expect(matchProject("legacy", PROJECTS).project?.id).toBe("p1");
  });

  it("devuelve null cuando no hay nada parecido", () => {
    expect(matchProject("zzz", PROJECTS).project).toBeNull();
  });
});

describe("quickParse · lo básico", () => {
  it("saca proyecto y blocker, y deja el título limpio", () => {
    const r = parse("Llamar a Hacienda #impuestos !esperando el poder notarial");
    expect(r.title).toBe("Llamar a Hacienda");
    expect(r.projectId).toBe("p4");
    expect(r.blocked).toBe(true);
    expect(r.blockerReason).toBe("esperando el poder notarial");
  });

  it("el ! se lleva la frase entera, no solo una palabra", () => {
    const r = parse("Cerrar el trato !falta que firme el cliente");
    expect(r.blockerReason).toBe("falta que firme el cliente");
    expect(r.title).toBe("Cerrar el trato");
  });

  it("un ! solo marca bloqueo sin razón", () => {
    const r = parse("Revisar contrato !");
    expect(r.blocked).toBe(true);
    expect(r.blockerReason).toBe("");
    expect(r.title).toBe("Revisar contrato");
  });

  it("un #token que no resuelve SE QUEDA en el título", () => {
    const r = parse("Comprar #cafe para la oficina");
    expect(r.title).toBe("Comprar #cafe para la oficina");
    expect(r.projectId).toBeNull();
    expect(r.unresolved).toEqual(["#cafe"]);
  });

  it("solo el primer # cuenta; el segundo es texto", () => {
    const r = parse("Nota #impuestos sobre #web");
    expect(r.projectId).toBe("p4");
    expect(r.title).toBe("Nota sobre #web");
  });

  it("un # después del ! es parte de la razón, no proyecto", () => {
    const r = parse("Enviar informe !espera a #web");
    expect(r.projectId).toBeNull();
    expect(r.blockerReason).toBe("espera a #web");
  });

  it("sin tokens, el texto es el título tal cual", () => {
    const r = parse("  Escribir el resumen  ");
    expect(r.title).toBe("Escribir el resumen");
    expect(r.projectId).toBeNull();
    expect(r.blocked).toBe(false);
  });
});

describe("quickParse · el sigilo solo cuenta al principio de palabra", () => {
  it("una admiración final es texto, no un bloqueo", () => {
    const r = parse("Avisar a Ana ya!");
    expect(r.title).toBe("Avisar a Ana ya!");
    expect(r.blocked).toBe(false);
  });

  it("la frase entre admiraciones sobrevive", () => {
    const r = parse("¡Felicitar al equipo!");
    expect(r.title).toBe("¡Felicitar al equipo!");
    expect(r.blocked).toBe(false);
  });

  it("un correo no es una fecha", () => {
    const r = parse("Escribir a precio@proveedor.com");
    expect(r.title).toBe("Escribir a precio@proveedor.com");
    expect(r.dueDate).toBeNull();
  });

  it("una fracción no es un tipo", () => {
    const r = parse("Repartir 1/3 del presupuesto");
    expect(r.title).toBe("Repartir 1/3 del presupuesto");
    expect(r.kind).toBeNull();
  });

  it("duplicar el sigilo lo escribe literal", () => {
    const r = parse("Publicar ##web y ##impuestos");
    expect(r.title).toBe("Publicar #web y #impuestos");
    expect(r.projectId).toBeNull();
  });
});

describe("quickParse · fecha, hora y duración", () => {
  it("@ pone fecha y hora, y desaparece del título", () => {
    const r = quickParse("Llamar al notario @2026-03-15 9:30", PROJECTS);
    expect(r.title).toBe("Llamar al notario");
    expect(r.dueDate).toBe("2026-03-15");
    expect(r.dueTime).toBe("09:30");
  });

  it("~ pone duración en minutos", () => {
    expect(parse("Repasar el pitch ~45m").durationMinutes).toBe(45);
    expect(parse("Repasar el pitch ~2h").durationMinutes).toBe(120);
    expect(parse("Repasar el pitch ~1h30").durationMinutes).toBe(90);
  });

  it("un @ que no es fecha se queda literal y se avisa", () => {
    const r = parse("Preguntar @juan por el presupuesto");
    expect(r.title).toBe("Preguntar @juan por el presupuesto");
    expect(r.dueDate).toBeNull();
    expect(r.unresolved).toEqual(["@juan"]);
  });

  it("una duración imposible no se guarda", () => {
    const r = parse("Sesión ~99h");
    expect(r.durationMinutes).toBeNull();
    expect(r.title).toBe("Sesión ~99h");
  });

  it("todo junto: título, proyecto, fecha, duración y bloqueo", () => {
    const r = quickParse(
      "Firmar el anexo #impuestos @2026-04-01 10:00 ~30m !falta el poder",
      PROJECTS
    );
    expect(r.title).toBe("Firmar el anexo");
    expect(r.projectId).toBe("p4");
    expect(r.dueDate).toBe("2026-04-01");
    expect(r.dueTime).toBe("10:00");
    expect(r.durationMinutes).toBe(30);
    expect(r.blockerReason).toBe("falta el poder");
  });
});

describe("quickParse · tipo y nombres con espacios", () => {
  it("/tipo elige el tipo desde el texto", () => {
    expect(parse("/idea vender por WhatsApp").kind).toBe("idea");
    expect(parse("/nota apuntes de la reunión").kind).toBe("note");
    expect(parse("/task llamar al banco").kind).toBe("task");
  });

  it("un /tipo inventado se queda en el título", () => {
    const r = parse("/receta pan de masa madre");
    expect(r.kind).toBeNull();
    expect(r.title).toBe("/receta pan de masa madre");
  });

  it('#"con espacios" alcanza nombres que el token suelto no', () => {
    const r = parse('Ajustar la home #"Web · rediseño" mañana');
    expect(r.projectId).toBe("p3");
    expect(r.title).toBe("Ajustar la home mañana");
  });

  it("un prefijo ambiguo no elige proyecto y ofrece candidatos", () => {
    const r = parse("Mover el hero #we");
    expect(r.projectId).toBeNull();
    expect(r.projectCandidates.map((p) => p.id)).toEqual(["p2", "p3"]);
  });
});

describe("autocompletado", () => {
  it("el token bajo el cursor se identifica por su sigilo", () => {
    const raw = "Ajustar la home #we";
    expect(activeToken(raw, raw.length)).toMatchObject({
      sigil: "#",
      query: "we",
    });
  });

  it("fuera de la palabra no hay token activo", () => {
    expect(activeToken("Ajustar #web la home", 20)).toBeNull();
  });

  it("sugiere por prefijo antes que por contenido", () => {
    expect(projectSuggestions("we", PROJECTS).map((p) => p.id)).toEqual([
      "p2",
      "p3",
    ]);
    expect(projectSuggestions("legacy", PROJECTS).map((p) => p.id)).toEqual([
      "p1",
    ]);
  });

  it("un nombre con espacios se inserta entre comillas", () => {
    expect(projectToken("Web · rediseño")).toBe('#"Web · rediseño"');
    expect(projectToken("Impuestos")).toBe("#Impuestos");
  });

  it("aceptar una sugerencia sustituye el token y deja un espacio", () => {
    const raw = "Ajustar la home #we";
    const token = activeToken(raw, raw.length)!;
    const next = replaceToken(raw, token, projectToken("Web · rediseño"));
    expect(next.text).toBe('Ajustar la home #"Web · rediseño" ');
    expect(quickParse(next.text, PROJECTS).projectId).toBe("p3");
  });
});
