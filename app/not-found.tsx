import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <h2>Page not found</h2>
      <p>
        <Link href="/">Back home</Link>
      </p>
    </main>
  );
}
