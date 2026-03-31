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
  let users: User[] = [...initialUsers];

  return {
    users,

    async findByEmail(email: string): Promise<User | null> {
      return users.find((user) => user.email === email) || null;
    },

    async findById(id: string): Promise<User | null> {
      return this.users.find((user) => user.id === id) || null;
    },

    async save(user: User): Promise<void> {
      const index = users.findIndex((user) => user.id === user.id);

      if (index >= 0) {
        users[index] = user;
      } else {
        users.push(user);
      }
    },

    reset(): void {
      users = [];
    },

    clear(): void {
      users = [];
    },

    count(): number {
      return users.length;
    },
  };
}
