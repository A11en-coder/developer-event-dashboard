export type ProjectSummary = {
  id: string;
  name: string;
  createdAt: string;
};

export type ProjectDetail = ProjectSummary & {
  keyVersion: number;
  activeKey: {
    id: string;
    displayHint: string;
    createdAt: string;
  } | null;
};

export type ProjectCursor = {
  endpoint: "projects";
  snapshotAt: string;
  afterCreatedAt: string;
  afterId: string;
};

export type ProjectPage = {
  items: ProjectSummary[];
  nextCursor: string | null;
};
