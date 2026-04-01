import type { IUserRepository, User } from "@user/domain";

export interface MockedUserRepository extends IUserRepository {
  users: User[];
  reset(): void;
  clear(): void;
  count(): number;
}

export function mockUserRepository(
  initialUsers: User[] = [],
): MockedUserRepository {
  return {
    users: [...initialUsers],

    async findByEmail(email: string): Promise<User | null> {
      return this.users.find((user) => user.email === email) || null;
    },

    async findById(id: string): Promise<User | null> {
      return this.users.find((user) => user.id === id) || null;
    },

    async save(user: User): Promise<void> {
      const index = this.users.findIndex((existing) => existing.id === user.id);
      if (index >= 0) {
        this.users[index] = user;
      } else {
        this.users.push(user);
      }
    },

    reset(): void {
      this.users = [];
    },

    clear(): void {
      this.users = [];
    },

    count(): number {
      return this.users.length;
    },
  };
}
