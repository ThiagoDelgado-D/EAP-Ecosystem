import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { dirname } from "path";

export class JsonStorage<T extends { id: string }> {
  constructor(private readonly filePath: string) {}

  async readAll(): Promise<T[]> {
    if (!existsSync(this.filePath)) return [];
    const content = await readFile(this.filePath, "utf-8");
    return JSON.parse(content) as T[];
  }

  async writeAll(data: T[]): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  async findById(id: string): Promise<T | undefined> {
    const all = await this.readAll();
    return all.find((item) => item.id === id);
  }

  async save(item: T): Promise<T> {
    const all = await this.readAll();
    const index = all.findIndex((i) => i.id === item.id);
    if (index >= 0) {
      all[index] = item;
    } else {
      all.push(item);
    }
    await this.writeAll(all);
    return item;
  }

  async delete(id: string): Promise<void> {
    const all = await this.readAll();
    await this.writeAll(all.filter((item) => item.id !== id));
  }
}
