import createClient from "openapi-fetch";
import { paths } from "./schema.js"; // (generated from openapi-typescript)

export type ApiClient = Awaited<ReturnType<typeof createApiClient>>;

export const createApiClient = async (apiKey: string) => {
  const { get, post } = createClient<paths>({
    baseUrl: "https://mpxl.dev/api/v2/",
  });

  return {
    async getUrl(slug: string) {
      return await get("/url/{slug}", {
        params: { path: { slug } },
        body: undefined,
      });
    },

    async getLatest(n: number) {
      return await post("/latest", {
        body: {
          api_key: apiKey,
          n,
        },
      });
    },

    async createLink(url: string, slug?: string, expiresAt?: string) {
      return await post("/create-link", {
        body: {
          api_key: apiKey,
          url,
          expiresAt,
          slug,
        },
      });
    },
  };
};
