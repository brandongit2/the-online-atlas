import invariant from "tiny-invariant";

invariant(import.meta.env.VITE_MAPBOX_ACCESS_TOKEN, `VITE_MAPBOX_ACCESS_TOKEN is not defined`);
export const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string;
