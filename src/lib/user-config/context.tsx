"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { UserConfig } from "@/lib/programmer/file-store";

const UserConfigContext = createContext<UserConfig>({});
export const USER_CONFIG_UPDATED_EVENT = "permanence-user-config-updated";

export function UserConfigProvider({
  children,
  config,
}: {
  children: ReactNode;
  config: UserConfig;
}) {
  const [currentConfig, setCurrentConfig] = useState(config);

  useEffect(() => {
    function updateConfig(event: Event) {
      const customEvent = event as CustomEvent<UserConfig>;

      if (customEvent.detail && typeof customEvent.detail === "object") {
        setCurrentConfig(customEvent.detail);
      }
    }

    window.addEventListener(USER_CONFIG_UPDATED_EVENT, updateConfig);
    return () => window.removeEventListener(USER_CONFIG_UPDATED_EVENT, updateConfig);
  }, []);

  return (
    <UserConfigContext.Provider value={currentConfig}>
      {children}
    </UserConfigContext.Provider>
  );
}

export function useUserConfig() {
  return useContext(UserConfigContext);
}
