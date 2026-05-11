// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface AbcEingabe {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    beschreibung?: string;
    datum?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export const APP_IDS = {
  ABC_EINGABE: '6a0207f001dba46714f8636c',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'abc_eingabe': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'beschreibung': 'string/textarea',
    'datum': 'date/date',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateAbcEingabe = StripLookup<AbcEingabe['fields']>;