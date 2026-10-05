import {
  createContext,
  useContext,
} from "react";

import type { SiteData } from "../api/types";
import { EMPTY_SITE } from "./defaults";

export const SiteContext =
  createContext<SiteData>(EMPTY_SITE);

export const useSite = () => {
  return useContext(SiteContext);
};