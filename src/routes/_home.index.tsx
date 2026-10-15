import { createFileRoute } from "@tanstack/react-router";

// The Home page itself renders in the pathless `_home` layout; this route only
// owns the `/` URL.
export const Route = createFileRoute("/_home/")({
  component: () => null,
});
