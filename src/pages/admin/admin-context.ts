import { useOutletContext } from "react-router-dom";

import type {
  Settings,
  Stats,
} from "../../api/types";

export type AdminContext = {
  stats: Stats | null;

  refreshStats: () => Promise<void>;

  settings: Settings | null;

  refreshSettings: () => Promise<void>;

  setSettings: React.Dispatch<
    React.SetStateAction<Settings | null>
  >;
};

export function useAdminContext() {
  return useOutletContext<AdminContext>();
}