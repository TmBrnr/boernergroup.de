import { MDXRemote } from 'next-mdx-remote/rsc';
import Image from 'next/image';
import Link from 'next/link';
import type { MDXComponents } from 'mdx/types';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

const components: MDXComponents = {
  a: ({ href = '', children, ...rest }) => {
    const isInternal = href.startsWith('/') || href.startsWith('#');
    if (isInternal) {
      return (
        <Link href={href} {...rest}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" {...rest}>
        {children}
      </a>
    );
  },
  img: ({ src = '', alt = '' }) => (
    <span className="not-prose my-10 block overflow-hidden rounded-2xl border border-line/[0.08]">
      <Image
        src={String(src)}
        alt={alt}
        width={1600}
        height={900}
        sizes="(max-width: 768px) 100vw, 720px"
        className="h-auto w-full"
      />
    </span>
  ),
  Aside: ({ children }: { children?: React.ReactNode }) => (
    <aside className="not-prose my-10 rounded-2xl border border-line/[0.08] bg-line/[0.03] p-6 text-[0.9375rem] leading-relaxed text-bone/70">
      {children}
    </aside>
  ),
};

export function Mdx({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        parseFrontmatter: false,
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug],
        },
      }}
    />
  );
}
