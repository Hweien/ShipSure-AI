import fs from "fs/promises";
import path from "path";
import { AgentEvent } from "./orchestrator";

export interface AuditRepository {
  append(events: AgentEvent[]): Promise<void>;
  list(caseId?: string): Promise<AgentEvent[]>;
}

/**
 * Hackathon-friendly persistence adapter. It works locally and in a container.
 * Cloud Run's filesystem is ephemeral, so swap this adapter for Firestore or a
 * managed database before claiming durable production persistence.
 */
export class JsonAuditRepository implements AuditRepository {
  constructor(private readonly filePath = path.resolve("runtime/agent-events.json")) {}

  private async readAll(): Promise<AgentEvent[]> {
    try {
      return JSON.parse(await fs.readFile(this.filePath, "utf8"));
    } catch (error: any) {
      if (error?.code === "ENOENT") return [];
      throw error;
    }
  }

  async append(events: AgentEvent[]): Promise<void> {
    if (!events.length) return;
    const existing = await this.readAll();
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(
      this.filePath,
      JSON.stringify([...existing, ...events], null, 2),
      "utf8",
    );
  }

  async list(caseId?: string): Promise<AgentEvent[]> {
    const events = await this.readAll();
    return caseId ? events.filter((item) => item.caseId === caseId) : events;
  }
}
