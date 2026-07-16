import type {
  Block,
  CodeData,
  HeadingData,
  ImageData,
  ParagraphData,
  QuoteData,
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

function BlockItem({ block }: { block: Block }) {
  switch (block.type) {
    case "heading": {
      const data = block.data as HeadingData;
      const Tag = data.level === 3 ? "h3" : "h2";
      return (
        <Tag className="font-display text-2xl text-accent md:text-3xl">
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
      return (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.url}
            alt={data.alt ?? ""}
            className="w-full rounded-lg border border-white/10"
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
          <p className="font-display text-xl md:text-2xl">&ldquo;{data.text}&rdquo;</p>
          {data.attribution && (
            <cite className="mt-2 block font-mono text-sm not-italic text-muted">
              — {data.attribution}
            </cite>
          )}
        </blockquote>
      );
    }
    case "code": {
      const data = block.data as CodeData;
      return (
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-white/5 p-4 text-sm">
          <code>{data.code}</code>
        </pre>
      );
    }
    default:
      return null;
  }
}
