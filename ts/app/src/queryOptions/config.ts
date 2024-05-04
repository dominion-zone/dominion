import { queryOptions } from "@tanstack/react-query";
import { Network } from "../config/network";
import axios from "axios";

export type Config = {
  dominion: {
    contract: string;
    adminControl: string;
  };
  governance: {
    contract: string;
    adminControl: string;
  };
  testCoin?: {
    contract: string;
    control: string;
  };
};

export type GlobalConfig = Record<Network, Config>;

const couchdb = axios.create({
  baseURL: import.meta.env.VITE_COUCHDB_URL as string,
  timeout: 1000,
});

export const configQO = () => {
  return queryOptions({
    queryKey: ["config"],
    queryFn: async () => {
      const r = await couchdb.get(import.meta.env.VITE_CONFIG_PATH as string);
      delete r.data._id;
      delete r.data._rev;
      return r.data as GlobalConfig;
    },
    staleTime: Infinity,
  });
};
