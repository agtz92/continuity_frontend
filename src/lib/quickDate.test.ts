/**
 * El parser de `@`. Una fecha mal leída no se ve: la tarea se guarda con el día
 * de al lado y el usuario se entera cuando ya pasó. Por eso los casos feos
 * (`mar` mes contra `mar` martes, el año que falta, el número pelado que NO es
 * hora) valen más que los bonitos.
 */

import { describe, it, expect } from "vitest";

import { parseDateWords } from "./quickDate";

/** Martes 10 de marzo de 2026, 09:00. Fijo, para que los tests no dependan del día. */
const NOW = new Date(2026, 2, 10, 9, 0, 0);

const parse = (s: string) => parseDateWords(s.split(/\s+/), NOW);

describe("fechas relativas", () => {
  it("hoy y mañana, en los dos idiomas", () => {
    expect(parse("hoy")?.date).toBe("2026-03-10");
    expect(parse("today")?.date).toBe("2026-03-10");
    expect(parse("mañana")?.date).toBe("2026-03-11");
    expect(parse("tomorrow")?.date).toBe("2026-03-11");
  });

  it("pasado mañana se lleva las dos palabras", () => {
    const hit = parse("pasado mañana");
    expect(hit?.date).toBe("2026-03-12");
    expect(hit?.words).toBe(2);
  });

  it("ayer existe: un update se escribe después de que pasó", () => {
    expect(parse("ayer")?.date).toBe("2026-03-09");
  });
});

describe("días de la semana", () => {
  it("el jueves más próximo, no el de la semana que viene", () => {
    expect(parse("jue")?.date).toBe("2026-03-12");
    expect(parse("jueves")?.date).toBe("2026-03-12");
    expect(parse("thu")?.date).toBe("2026-03-12");
  });

  it("si hoy es martes, `martes` es hoy", () => {
    expect(parse("martes")?.date).toBe("2026-03-10");
  });

  it("`próximo martes` sí salta una semana", () => {
    expect(parse("próximo martes")?.date).toBe("2026-03-17");
    expect(parse("next tuesday")?.date).toBe("2026-03-17");
  });
});

describe("desplazamientos", () => {
  it("+3d, +2s y +1m", () => {
    expect(parse("+3d")?.date).toBe("2026-03-13");
    expect(parse("+2s")?.date).toBe("2026-03-24");
    expect(parse("+2w")?.date).toBe("2026-03-24");
    expect(parse("+1m")?.date).toBe("2026-04-10");
  });

  it("en 3 días · in 2 weeks", () => {
    expect(parse("en 3 días")?.date).toBe("2026-03-13");
    expect(parse("in 2 weeks")?.date).toBe("2026-03-24");
    expect(parse("en 3 días")?.words).toBe(3);
  });
});

describe("fechas explícitas", () => {
  it("día/mes toma el año que no queda en el pasado", () => {
    expect(parse("15/3")?.date).toBe("2026-03-15");
    // 1 de marzo ya pasó este año → el del año que viene.
    expect(parse("1/3")?.date).toBe("2027-03-01");
  });

  it("acepta año de dos o cuatro cifras", () => {
    expect(parse("15/3/2027")?.date).toBe("2027-03-15");
    expect(parse("15/3/27")?.date).toBe("2027-03-15");
  });

  it("ISO completo", () => {
    expect(parse("2026-12-31")?.date).toBe("2026-12-31");
  });

  it("día y mes con nombre, con y sin `de`", () => {
    expect(parse("15 mar")?.date).toBe("2026-03-15");
    expect(parse("15 de marzo")?.date).toBe("2026-03-15");
    expect(parse("march 15")?.date).toBe("2026-03-15");
  });

  it("una fecha imposible no se inventa", () => {
    expect(parse("31/2")).toBeNull();
    expect(parse("40/1")).toBeNull();
  });
});

describe("horas", () => {
  it("con dos puntos, con am/pm y con h", () => {
    expect(parse("9:30")?.time).toBe("09:30");
    expect(parse("9pm")?.time).toBe("21:00");
    expect(parse("9 pm")?.time).toBe("21:00");
    expect(parse("21h")?.time).toBe("21:00");
    expect(parse("12am")?.time).toBe("00:00");
  });

  it("`a las 9` y `at 9` aceptan el número pelado", () => {
    expect(parse("a las 9")?.time).toBe("09:00");
    expect(parse("at 9")?.time).toBe("09:00");
  });

  it("una hora sola no inventa fecha", () => {
    const hit = parse("9:30");
    expect(hit?.date).toBeNull();
    expect(hit?.time).toBe("09:30");
  });

  it("fecha y hora juntas", () => {
    const hit = parse("jue 9:30");
    expect(hit?.date).toBe("2026-03-12");
    expect(hit?.time).toBe("09:30");
    expect(hit?.words).toBe(2);
  });

  it("una hora que no existe no se guarda", () => {
    expect(parse("25:00")).toBeNull();
    expect(parse("9:70")).toBeNull();
  });
});

describe("lo que NO debe leerse", () => {
  it("un número pelado no es hora: `15 mar` es una fecha entera", () => {
    const hit = parse("15 mar");
    expect(hit?.date).toBe("2026-03-15");
    expect(hit?.time).toBeNull();
    expect(hit?.words).toBe(2);
  });

  it("`mar` suelto es martes, no marzo: hoy es martes 10", () => {
    expect(parse("mar")?.date).toBe("2026-03-10");
    expect(parse("15 mar")?.date).toBe("2026-03-15");
  });

  it("texto que no es fecha devuelve null y se queda literal", () => {
    expect(parse("hacienda")).toBeNull();
    expect(parse("")).toBeNull();
    expect(parse("proveedor.com")).toBeNull();
  });

  it("solo consume lo suyo: el resto sigue siendo título", () => {
    const hit = parse("mañana el informe anual");
    expect(hit?.date).toBe("2026-03-11");
    expect(hit?.words).toBe(1);
  });
});
