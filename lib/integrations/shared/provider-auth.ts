export type ProviderAccessToken = {
  accessToken: string;
  expiresAt: Date;
};

export interface ProviderAuth {
  getAccessToken(): Promise<ProviderAccessToken>;
}