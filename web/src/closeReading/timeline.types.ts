/** Nested timeline entries; optional `subEvents` adds a further level (sub-sub, etc.). */
export type SubEvent = {
  id: string;
  label: string;
  anchor: string;
  subEvents?: SubEvent[];
};

export type StoryEvent = {
  id: string;
  label: string;
  anchor: string;
  subEvents: SubEvent[];
};
