import type {
  Block,
  ButtonData,
  CodeData,
  EmbedData,
  GalleryData,
  HeadingData,
  HtmlData,
  ImageData,
  ParagraphData,
  QuoteData,
  VideoData,
} from "@/lib/blog";

export default function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="grid gap-8">
      {blocks.map((block, i) => (
        <BlockItem key={i} block={block} />
      ))}
    </div>
  );
}

function toEmbedUrl(url: string): string {
  const youtube = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

function BlockItem({ block }: { block: Block }) {
  switch (block.type) {
    case "heading": {
      const data = block.data as HeadingData;
      const Tag = data.level === 3 ? "h3" : "h2";
      return (
        <Tag className="h2" style={{ color: "var(--gold)" }}>
          {data.text}
        </Tag>
      );
    }
    case "paragraph": {
      const data = block.data as ParagraphData;
      return <p className="max-w-2xl text-lg text-muted">{data.text}</p>;
    }
    case "image": {
      const data = block.data as ImageData;
      if (!data.url) return null;
      return (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.url}
            alt={data.alt ?? ""}
            className="w-full border border-line"
          />
          {data.caption && (
            <figcaption className="mt-2 text-sm text-muted">{data.caption}</figcaption>
          )}
        </figure>
      );
    }
    case "quote": {
      const data = block.data as QuoteData;
      return (
        <blockquote className="border-l-2 border-accent pl-6">
          <p className="h2">&ldquo;{data.text}&rdquo;</p>
          {data.attribution && (
            <cite className="meta mt-2 block not-italic">
              — {data.attribution}
            </cite>
          )}
        </blockquote>
      );
    }
    case "code": {
      const data = block.data as CodeData;
      return (
        <pre className="overflow-x-auto border border-line bg-[var(--surface-1)] p-4 text-sm">
          <code>{data.code}</code>
        </pre>
      );
    }
    case "divider":
      return <hr className="border-t border-line" />;
    case "button": {
      const data = block.data as ButtonData;
      if (!data.url) return null;
      return (
        <a
          href={data.url}
          className="btn btn-primary w-fit"
        >
          {data.text || "Learn more"}
        </a>
      );
    }
    case "gallery": {
      const data = block.data as GalleryData;
      const images = data.images.filter((img) => img.url);
      if (images.length === 0) return null;
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={img.url}
              alt={img.alt ?? ""}
              className="aspect-[4/3] w-full border border-line object-cover"
            />
          ))}
        </div>
      );
    }
    case "video": {
      const data = block.data as VideoData;
      if (!data.url) return null;
      const isDirectFile = /\.(mp4|webm|ogg)$/i.test(data.url);
      return (
        <figure>
          {isDirectFile ? (
            <video src={data.url} controls className="w-full border border-line" />
          ) : (
            <div className="aspect-video w-full overflow-hidden border border-line">
              <iframe
                src={toEmbedUrl(data.url)}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {data.caption && (
            <figcaption className="mt-2 text-sm text-muted">{data.caption}</figcaption>
          )}
        </figure>
      );
    }
    case "embed": {
      const data = block.data as EmbedData;
      if (!data.url) return null;
      return (
        <figure>
          <div className="aspect-video w-full overflow-hidden border border-line">
            <iframe src={data.url} className="h-full w-full" allowFullScreen />
          </div>
          {data.caption && (
            <figcaption className="mt-2 text-sm text-muted">{data.caption}</figcaption>
          )}
        </figure>
      );
    }
    case "html": {
      const data = block.data as HtmlData;
      return <div dangerouslySetInnerHTML={{ __html: data.html }} />;
    }
    default:
      return null;
  }
}
