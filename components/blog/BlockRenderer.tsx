'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface BlockData {
  level?: number;
  text?: string;
  file?: { url?: string };
  url?: string;
  caption?: string;
  style?: string;
  items?: any[];
  meta?: {
    checked?: boolean;
  };
  code?: string;
  withHeadings?: boolean;
  content?: string[][];
  embed?: string;
  source?: string;
  width?: number;
  height?: number;
  service?: string;
}

interface Block {
  type: string;
  data: BlockData;
}

interface BlockRendererProps {
  blocks: Block[];
}

// ---------------------------------------------------------------------------
// CodeBlock — shows code with a one-click copy button in the top-right corner
// ---------------------------------------------------------------------------
const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group my-6">
      {/* Copy button */}
      <button
        onClick={handleCopy}
        aria-label="Copy code"
        className={`
          absolute top-3 right-3 z-10
          flex items-center gap-1.5 px-2.5 py-1.5
          rounded-lg text-xs font-medium
          transition-all duration-200
          opacity-0 group-hover:opacity-100 focus:opacity-100
          ${
            copied
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white'
          }
        `}
      >
        {copied ? (
          <><Check size={13} /> Copied!</>
        ) : (
          <><Copy size={13} /> Copy</>
        )}
      </button>

      <pre className="bg-slate-900 dark:bg-slate-950 text-emerald-400 rounded-2xl p-6 pt-10 overflow-x-auto text-sm font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
};


const BlockRenderer: React.FC<BlockRendererProps> = ({ blocks }) => {
  if (!blocks || blocks.length === 0) return null;

  const normalizeEmbedUrl = (value: string): string => {
    if (!value) return '';
    try {
      const parsed = new URL(value);
      const host = parsed.hostname.toLowerCase();

      if (host.includes('youtu.be')) {
        const id = parsed.pathname.replace('/', '').trim();
        if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
      }

      if (host.includes('youtube.com')) {
        if (parsed.pathname.startsWith('/watch')) {
          const id = parsed.searchParams.get('v');
          if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
        }
        if (parsed.pathname.startsWith('/shorts/')) {
          const id = parsed.pathname.split('/shorts/')[1]?.split('/')[0];
          if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
        }
      }

      if (host.includes('loom.com')) {
        if (parsed.pathname.startsWith('/share/')) {
          const id = parsed.pathname.split('/share/')[1]?.split('/')[0];
          if (id) return `https://www.loom.com/embed/${id}`;
        }
      }

      if (host.includes('figma.com')) {
        if (parsed.pathname.startsWith('/embed')) {
          return value;
        }
        if (parsed.pathname.startsWith('/file/') || parsed.pathname.startsWith('/proto/')) {
          return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(value)}`;
        }
      }
    } catch {
      return value;
    }
    return value;
  };

  const getItemText = (item: any): string => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      return item.content || item.text || '';
    }
    return '';
  };

  const getChildItems = (item: any): any[] => {
    if (item && typeof item === 'object' && Array.isArray(item.items)) {
      return item.items;
    }
    return [];
  };

  const renderListItems = (items: any[] = []) =>
    items.map((item, i) => {
      const itemText = getItemText(item);
      const childItems = getChildItems(item);

      return (
        <li key={i}>
          <span dangerouslySetInnerHTML={{ __html: itemText }} />
          {childItems.length > 0 && (
            <ul className="list-disc pl-6 space-y-2 mt-2">
              {renderListItems(childItems)}
            </ul>
          )}
        </li>
      );
    });

  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'header': {
            const Tag = `h${block.data.level || 2}` as keyof React.JSX.IntrinsicElements;
            const text = block.data.text || '';
            const plainText = text.replace(/<[^>]+>/g, '').trim();
            const id = plainText.toLowerCase().replace(/\s+/g, '-');
            const sizeClass =
              {
                2: 'text-4xl md:text-5xl',
                3: 'text-3xl md:text-4xl',
                4: 'text-2xl md:text-3xl',
              }[block.data.level || 3] || 'text-3xl';

            return (
              <Tag
                id={id}
                key={index}
                className={`${sizeClass} font-black my-8 dark:text-white text-slate-900 tracking-tight leading-tight`}
                dangerouslySetInnerHTML={{ __html: text }}
              >
              </Tag>
            );
          }

          case 'paragraph':
            return (
              <p
                key={index}
                className="text-slate-600 dark:text-slate-400 leading-loose my-4"
                dangerouslySetInnerHTML={{ __html: block.data.text || '' }}
              />
            );

          case 'image': {
            const url = block.data.file?.url || block.data.url || '';
            return (
              <figure key={index} className="my-8">
                {/* Optional: You can replace standard <img> with Next.js <Image /> component if desired */}
                <img
                  src={url}
                  alt={block.data.caption || ''}
                  className="rounded-2xl w-full object-cover"
                />
                {block.data.caption && (
                  <figcaption className="text-center text-sm text-slate-400 mt-2 italic">
                    {block.data.caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          case 'list': {
            const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';
            const listClass =
              block.data.style === 'ordered'
                ? 'list-decimal pl-6 space-y-2 my-4 dark:text-slate-400 text-slate-600'
                : 'list-disc pl-6 space-y-2 my-4 dark:text-slate-400 text-slate-600';

            return (
              <ListTag key={index} className={listClass}>
                {renderListItems(block.data.items || [])}
              </ListTag>
            );
          }

          case 'checklist':
            return (
              <ul key={index} className="space-y-3 my-4">
                {(block.data.items || []).map((item, i) => {
                  const itemText = getItemText(item);
                  const isChecked = Boolean(item?.meta?.checked ?? item?.checked);
                  return (
                    <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="mt-1 accent-indigo-600"
                      />
                      <span
                        className={isChecked ? 'line-through opacity-70' : ''}
                        dangerouslySetInnerHTML={{ __html: itemText }}
                      />
                    </li>
                  );
                })}
              </ul>
            );

          case 'quote':
            return (
              <blockquote
                key={index}
                className="border-l-4 border-indigo-500 pl-6 my-6 italic text-slate-500 dark:text-slate-400"
              >
                <p dangerouslySetInnerHTML={{ __html: block.data.text || '' }} />
                {block.data.caption && (
                  <cite className="text-sm text-slate-400 not-italic mt-2 block">
                    — {block.data.caption}
                  </cite>
                )}
              </blockquote>
            );

          case 'delimiter':
            return (
              <hr
                key={index}
                className="my-10 border-slate-200 dark:border-slate-700"
              />
            );

          case 'code':
            return <CodeBlock key={index} code={block.data.code || ''} />;

          case 'table': {
            const rows = block.data.content || [];
            if (!rows.length) return null;

            const hasHeadings = Boolean(block.data.withHeadings);
            const headerRow = hasHeadings ? rows[0] : null;
            const bodyRows = hasHeadings ? rows.slice(1) : rows;

            return (
              <div key={index} className="my-6 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <table className="min-w-full text-left text-sm">
                  {headerRow ? (
                    <thead className="bg-slate-100 dark:bg-slate-800">
                      <tr>
                        {headerRow.map((cell, cellIndex) => (
                          <th key={cellIndex} className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                            <span dangerouslySetInnerHTML={{ __html: cell || '' }} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                  ) : null}
                  <tbody>
                    {bodyRows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t border-slate-200 dark:border-slate-700">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-3 text-slate-600 dark:text-slate-400">
                            <span dangerouslySetInnerHTML={{ __html: cell || '' }} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          case 'embed': {
            const embedUrl = block.data.embed || '';
            const sourceUrl = block.data.source || '';
            const iframeUrl = normalizeEmbedUrl(embedUrl || sourceUrl);
            if (!iframeUrl) return null;

            return (
              <figure key={index} className="my-8">
                <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5">
                  <iframe
                    src={iframeUrl}
                    className="w-full aspect-video"
                    allowFullScreen
                    loading="lazy"
                    title={block.data.caption || block.data.service || 'Embedded content'}
                  />
                </div>
                {block.data.caption ? (
                  <figcaption className="text-center text-sm text-slate-400 mt-2 italic">
                    {block.data.caption}
                  </figcaption>
                ) : null}
              </figure>
            );
          }

          default:
            return null;
        }
      })}
    </>
  );
};

export default BlockRenderer;