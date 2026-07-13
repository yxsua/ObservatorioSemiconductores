export interface Source {
  id: number;
  type: { code: string; name: string };
  name: string;
  website: string | null;
  country: string | null;
  rssUrl: string | null;
  apiUrl: string | null;
  historicalReliability: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SourceInput {
  typeCode: string;
  name: string;
  website: string | null;
  country: string | null;
  rssUrl: string | null;
  apiUrl: string | null;
  historicalReliability: number | null;
}
