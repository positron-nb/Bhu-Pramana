import type { Metadata } from "next";
import { WorkspaceView } from "./WorkspaceView";

export const metadata: Metadata = { title: "Workspace" };

export default function WorkspacePage() {
  return <WorkspaceView />;
}
