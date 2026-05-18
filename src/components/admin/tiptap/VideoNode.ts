import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: {
        src: string;
        provider?: "file" | "youtube" | "vimeo";
        caption?: string;
        width?: number | null;
        height?: number | null;
      }) => ReturnType;
    };
  }
}

export const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      provider: { default: "file" },
      caption: { default: null },
      width: { default: null },
      height: { default: null },
    };
  },

  parseHTML() {
    return [
      { tag: "video[src]" },
      { tag: "iframe[data-provider]" },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const provider = (HTMLAttributes as Record<string, unknown>).provider as
      | string
      | undefined;
    if (provider === "youtube" || provider === "vimeo") {
      return [
        "iframe",
        mergeAttributes(
          {
            "data-provider": provider,
            frameborder: "0",
            allow:
              "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
            allowfullscreen: "true",
            loading: "lazy",
            width: HTMLAttributes.width ?? 640,
            height: HTMLAttributes.height ?? 360,
          },
          { src: HTMLAttributes.src },
        ),
      ];
    }
    return [
      "video",
      mergeAttributes(
        {
          controls: "controls",
          preload: "metadata",
        },
        { src: HTMLAttributes.src },
      ),
    ];
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                src: options.src,
                provider: options.provider ?? "file",
                caption: options.caption ?? null,
                width: options.width ?? null,
                height: options.height ?? null,
              },
            })
            .run();
        },
    };
  },
});

export type EmbedParsed = {
  src: string;
  provider: "youtube" | "vimeo";
} | null;

export function parseEmbedUrl(input: string): EmbedParsed {
  const url = input.trim();
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.includes("youtube.com") || host === "youtu.be") {
      let id: string | null = null;
      if (host === "youtu.be") {
        id = u.pathname.slice(1).split("/")[0] || null;
      } else if (u.pathname.startsWith("/embed/")) {
        id = u.pathname.split("/embed/")[1]?.split("/")[0] || null;
      } else {
        id = u.searchParams.get("v");
      }
      if (!id) return null;
      return { src: `https://www.youtube.com/embed/${id}`, provider: "youtube" };
    }
    if (host.includes("vimeo.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = parts[parts.length - 1];
      if (!id || !/^\d+$/.test(id)) return null;
      return { src: `https://player.vimeo.com/video/${id}`, provider: "vimeo" };
    }
    return null;
  } catch {
    return null;
  }
}
