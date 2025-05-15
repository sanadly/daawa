export interface JwtPayload {
  sub: number; // Standard JWT subject field, used for userId
  username: string;
  // Add any other fields you include in your JWT payload
} 