/**
 * La captura rápida, por sus fallos anteriores.
 *
 * Cada test de aquí es una regresión real de la versión anterior: el `!` que
 * partía el título en cualquier admiración, el `#` que elegía proyecto por
 * longitud del nombre sin decirlo, el ESC que borraba lo escrito, y la fecha
 * que simplemente no se podía capturar. El parser tiene sus propios tests
 * (`lib/quickParse.test.ts`); esto comprueba que el overlay hace con ellos lo
 * que dice hacer.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InMemoryCache } from "@apollo/client";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";

import { CommandPalette } from "./CommandPalette";
import {
  ADD_NOTE,
  CREATE_TASK,
  DASHBOARD_QUERY,
  QUICK_NOTES_QUERY,
} from "@/lib/graphql";
import {
  __resetCaptureStorageForTests,
  readDraft,
} from "@/lib/captureQueue";
import type { Project } from "@/lib/types";

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
  project("p1", "Impuestos"),
  project("p2", "Web"),
  project("p3", "Web · rediseño"),
];

const dashboardMock = (delay = 0): MockedResponse => ({
  request: { query: DASHBOARD_QUERY },
  delay,
  result: {
    data: {
      dashboard: {
        projects: [],
        tasks: [],
        ideas: [],
        activities: [],
        categories: [],
        projectNotes: [],
        routines: [],
        routineOccurrences: [],
        lastBackup: null,
      },
    },
  },
  maxUsageCount: 10,
});

/** El modo "ir a" busca en las notas; sin este mock el link se queja en stderr. */
const notesMock = (): MockedResponse =>
  ({
    request: { query: QUICK_NOTES_QUERY },
    variableMatcher: () => true,
    result: { data: { quickNotes: [] } },
    maxUsageCount: 10,
  }) as unknown as MockedResponse;

function setup(
  mocks: MockedResponse[] = [],
  overrides = {},
  cache?: InMemoryCache,
  /** Cuánto tarda el refetch del dashboard. Lo usa el test de la caché. */
  dashboardDelay = 0
) {
  const props = {
    projects: PROJECTS,
    onClose: vi.fn(),
    onOpenProject: vi.fn(),
    onNavigate: vi.fn(),
    onOpenNote: vi.fn(),
    ...overrides,
  };
  render(
    <MockedProvider
      mocks={[dashboardMock(dashboardDelay), notesMock(), ...mocks]}
      addTypename={false}
      cache={cache}
    >
      <CommandPalette {...props} />
    </MockedProvider>
  );
  return props;
}

beforeEach(() => {
  __resetCaptureStorageForTests();
});

describe("no perder texto", () => {
  it("una admiración final no crea un bloqueo ni corta el título", async () => {
    const user = userEvent.setup();
    setup();

    await user.keyboard("Avisar a Ana ya!");

    expect(screen.getByRole("combobox")).toHaveValue("Avisar a Ana ya!");
    // El chip de bloqueo llevaría la razón o la palabra "Blocked".
    expect(screen.queryByText("Blocked")).not.toBeInTheDocument();
  });

  it("ESC cierra pero deja el borrador guardado", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.keyboard("comprar café para la oficina");
    await user.keyboard("{Escape}");

    expect(props.onClose).toHaveBeenCalled();
    expect(readDraft()?.text).toBe("comprar café para la oficina");
  });

  it("al abrir de nuevo, lo escrito sigue ahí", async () => {
    const user = userEvent.setup();
    setup();
    await user.keyboard("llamar al notario");

    await waitFor(() => expect(readDraft()?.text).toBe("llamar al notario"));
  });
});

describe("el proyecto no se adivina", () => {
  it("sugiere mientras escribes y acepta con ↵", async () => {
    const user = userEvent.setup();
    setup();

    await user.keyboard("Mover el hero #we");

    const options = await screen.findAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["Web", "Web · rediseño"]);

    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.getByRole("combobox")).toHaveValue(
      'Mover el hero #"Web · rediseño" '
    );
  });

  it("un empate sin resolver ofrece elegir en vez de decidir solo", async () => {
    const user = userEvent.setup();
    setup();

    // El cursor se va del token, así que no hay autocompletado: queda el
    // empate, que es el caso en el que antes ganaba "el nombre más corto".
    await user.keyboard("Mover el hero #we ahora");

    expect(await screen.findByText("Which one?")).toBeInTheDocument();
  });
});

describe("lo que se guarda es lo que se ve", () => {
  it("manda fecha, duración, bloqueo y token en una sola mutación", async () => {
    const user = userEvent.setup();
    const variableMatcher = vi.fn().mockReturnValue(true);

    const props = setup([
      {
        request: { query: CREATE_TASK },
        variableMatcher,
        // La tarea vuelve **completa**: ahora se escribe en la caché del
        // dashboard, y un objeto al que le faltan campos la deja rota.
        result: {
          data: {
            createTask: {
              id: "t1",
              title: "Firmar el anexo",
              projectId: "p1",
              dueDate: "2026-04-01T00:00:00.000Z",
              done: false,
              completedAt: null,
              created: "2026-03-10T10:00:00Z",
              effortHours: null,
              dueTime: "10:00",
              durationMinutes: 30,
              parkedDueDate: null,
              parkedDueTime: null,
              blockedSince: "2026-03-10T10:00:00Z",
              blockedReason: "falta el poder",
              blockers: [],
            },
          },
        },
      } as unknown as MockedResponse,
    ]);

    await user.keyboard(
      "Firmar el anexo #Impuestos @2026-04-01 10:00 ~30m !falta el poder"
    );
    await user.keyboard("{Enter}");

    await waitFor(() => expect(variableMatcher).toHaveBeenCalled());
    const sent = variableMatcher.mock.calls[0][0].data;

    expect(sent.title).toBe("Firmar el anexo");
    expect(sent.projectId).toBe("p1");
    expect(sent.dueDate).toContain("2026-04-01");
    expect(sent.dueTime).toBe("10:00");
    expect(sent.durationMinutes).toBe(30);
    expect(sent.blocker).toBe("falta el poder");
    expect(sent.clientToken).toBeTruthy();

    await waitFor(() => expect(props.onClose).toHaveBeenCalled());
    expect(readDraft()).toBeNull();
  });

  it("un update sin proyecto no se puede guardar", async () => {
    const user = userEvent.setup();
    setup();

    await user.keyboard("/update cerramos el trato");

    expect(
      screen.getByRole("button", { name: "Save" })
    ).toBeDisabled();
  });
});

describe("modo ir a", () => {
  it("> lista los destinos y ↵ navega", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.keyboard(">tasks");
    const options = await screen.findAllByRole("option");
    expect(options.length).toBeGreaterThan(0);

    await user.keyboard("{Enter}");
    expect(props.onNavigate).toHaveBeenCalledWith("tasks");
  });

  it("encuentra proyectos por nombre", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.keyboard(">Impuestos");
    await screen.findAllByRole("option");
    await user.keyboard("{ArrowDown}{Enter}");

    expect(props.onOpenProject).toHaveBeenCalledWith(
      expect.objectContaining({ id: "p1" })
    );
  });
});

describe("aparece sin esperar al refetch", () => {
  it("el update entra en la caché antes de que vuelva el dashboard", async () => {
    const user = userEvent.setup();

    // Caché ya poblada, como en la app real.
    // `addTypename: false` a juego con el provider: una caché que sí añade
    // `__typename` reescribe la operación y entonces NINGÚN mock coincide.
    const cache = new InMemoryCache({ addTypename: false });
    // El objeto sembrado lleva **todos** los campos que selecciona la query: uno
    // incompleto deja la entrada rota y `readQuery` devuelve undefined.
    const existing = {
      id: "a1",
      kind: "task_created",
      entityId: "t1",
      entityTitle: "Algo anterior",
      projectId: null,
      targetProjectId: null,
      note: "",
      previousValue: "",
      newValue: "",
      created: "2026-03-09T10:00:00Z",
    };
    cache.writeQuery({
      query: DASHBOARD_QUERY,
      data: {
        dashboard: {
          projects: [],
          tasks: [],
          ideas: [],
          activities: [existing],
          categories: [],
          projectNotes: [],
          routines: [],
          routineOccurrences: [],
          lastBackup: null,
        },
      },
    });

    const created = {
      id: "a2",
      kind: "note",
      entityId: "p1",
      entityTitle: "Impuestos",
      projectId: "p1",
      targetProjectId: null,
      note: "cerramos el trato",
      previousValue: "",
      newValue: "",
      created: "2026-03-10T10:00:00Z",
    };

    setup(
      [
        {
          request: {
            query: ADD_NOTE,
            variables: { projectId: "p1", note: "cerramos el trato" },
          },
          result: { data: { addNote: created } },
        } as unknown as MockedResponse,
      ],
      {},
      cache,
      // El refetch del dashboard tarda hora y media en llegar, a propósito: es
      // el problema que esto arregla (~1,3 s de servidor en la cuenta más
      // grande). Si el renglón solo apareciera con el refetch, el `waitFor` de
      // abajo —un segundo— expiraría antes.
      1500
    );

    // El `#` va antes del texto libre a propósito: si el cursor se quedara
    // dentro del token, el primer ↵ aceptaría la sugerencia en vez de guardar.
    await user.keyboard("/update #Impuestos cerramos el trato");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      const read = cache.readQuery<{
        dashboard: { activities: { id: string }[] };
      }>({ query: DASHBOARD_QUERY });
      expect(read?.dashboard.activities.map((a) => a.id)).toEqual(["a2", "a1"]);
    });
  });
});
