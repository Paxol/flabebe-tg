import { createApiClient, type ApiClient } from "./api/index.js";
import { Result } from "./result.js";

export type ShortLink = {
  slug: string;
  url: string;
};

export class DAL {
  apiKey: string;
  client?: ApiClient;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  get connected() {
    return this.client !== undefined;
  }

  async createClient() {
    this.client = await createApiClient(this.apiKey);
  }

  async listLatest(count = 3) {
    const res = await this.client!.getLatest(count);
    if (res.error) {
      return Result.fail<ShortLink[] | undefined>(res.error);
    }

    return Result.ok(res.data as ShortLink[] | undefined);
  }

  async createLink(url: string, slug?: string, expiresAt?: string) {
    const res = await this.client!.createLink(url, slug, expiresAt);

    if (res.error) {
      return Result.fail<ShortLink | undefined>(res.error);
    }

    return Result.ok(res.data as ShortLink | undefined);
  }
}
