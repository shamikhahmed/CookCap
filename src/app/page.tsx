import { Shell } from '@/components/book/Shell';

/**
 * Single-route app: the whole cookbook lives inside the book shell, navigated
 * by page turns rather than URLs. This keeps the "one physical object" feel
 * and lets state (position, timers, scaling) persist across chapters.
 */
export default function Home() {
  return <Shell />;
}
