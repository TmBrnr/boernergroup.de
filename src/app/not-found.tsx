import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="flex min-h-[80svh] items-center py-32">
      <div className="shell">
        <p className="eyebrow text-steel/70">404</p>
        <h1 className="mt-5 max-w-[20ch] text-d2 font-medium text-gradient">
          This page does not exist.
        </h1>
        <p className="mt-6 max-w-measure text-lead text-bone/55">
          The link may be old, or the page may have moved. Everything is reachable from the start.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/" className="btn btn-primary">
            Back to home
          </Link>
          <Link href="/newsroom" className="btn btn-ghost">
            Newsroom
          </Link>
        </div>
      </div>
    </section>
  );
}
