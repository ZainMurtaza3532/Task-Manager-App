import React, { createContext, useContext, useState, useEffect } from "react";
import { checkApiHealth, clearHealthCache } from "../services/health";
import { API_BASE_URL } from "../utils/constants";

const ApiHealthContext = createContext({ isV2: false, loading: true, version: "unknown" });

export const ApiHealthProvider = ({ children }) => {
  const [health, setHealth] = useState({ isV2: false, loading: true, version: "unknown", ok: false });

  useEffect(() => {
    clearHealthCache();
    checkApiHealth().then((h) =>
      setHealth({ ...h, loading: false })
    );
  }, []);

  return (
    <ApiHealthContext.Provider value={health}>
      {!health.loading && !health.isV2 && (
        <div className="api-warning-banner">
          <strong>Enterprise API unavailable.</strong>{" "}
          Backend v2.0 is not running at <code>{API_BASE_URL.replace("/api", "")}</code>.
          {import.meta.env.DEV
            ? " Start the local backend with: cd Backend && npm run dev"
            : " Redeploy the updated Backend folder to Railway."}
        </div>
      )}
      {children}
    </ApiHealthContext.Provider>
  );
};

export const useApiHealth = () => useContext(ApiHealthContext);
