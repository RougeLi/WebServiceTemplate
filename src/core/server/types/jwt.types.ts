type Roles = string[];

type Permissions = string[];

export type Payload = {
  id: number;
  roles: Roles;
  permissions: Permissions;
  tokenVersion: string;
};

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: Payload;
  }
}
