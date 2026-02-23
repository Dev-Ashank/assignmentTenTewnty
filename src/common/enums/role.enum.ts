// All the user roles in our system.
// GUEST is the default for unauthenticated users — they can only browse.
export enum UserRole {
  ADMIN = 'admin',
  VIP = 'vip',
  USER = 'user',
  GUEST = 'guest',
}
