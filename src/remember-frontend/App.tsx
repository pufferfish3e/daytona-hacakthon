"use client";

import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";

import RunDemoApp from "./run-demo-app";

export default function App(): ReactElement {
  return (
    <MemoryRouter>
      <RunDemoApp />
    </MemoryRouter>
  );
}
