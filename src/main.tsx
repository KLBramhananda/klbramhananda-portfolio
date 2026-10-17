import React from "react";
import ReactDOM from "react-dom/client";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { MotionConfig } from "framer-motion";
import { routeTree } from "./routeTree.gen";
import "./styles/styles.css";
import { preloadIntro } from "./components/intro/intro-bridge";

// Start fetching the intro scene before the app renders.
preloadIntro();

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* Respect the user's reduced-motion preference for all Framer Motion */}
    <MotionConfig reducedMotion="user">
      <RouterProvider router={router} />
    </MotionConfig>
  </React.StrictMode>
);
