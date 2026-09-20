import { ShipmentCase } from "../../src/types";

class CaseRepository {
  private cases = new Map<string, ShipmentCase>();

  getAll(): ShipmentCase[] {
    return Array.from(this.cases.values());
  }

  getById(id: string): ShipmentCase | undefined {
    return this.cases.get(id);
  }

  save(shipmentCase: ShipmentCase): ShipmentCase {
    this.cases.set(shipmentCase.id, shipmentCase);
    return shipmentCase;
  }

  clear(): void {
    this.cases.clear();
  }
}

export const caseRepository = new CaseRepository();