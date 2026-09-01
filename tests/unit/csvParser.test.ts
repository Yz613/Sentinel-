import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "../../server/csvParser";

describe("CSV Parser Unit Tests", () => {
  it("parses standard CSV text with headers into JSON rows", () => {
    const csv = `id,name,location,operatingHours\nROV-01,Titan Alpha,FOB Alpha,120\nROV-02,Titan Bravo,FOB Bravo,240`;
    const rows = parseCsv(csv);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].id, "ROV-01");
    assert.equal(rows[0].name, "Titan Alpha");
    assert.equal(rows[0].operatingHours, "120");
    assert.equal(rows[1].id, "ROV-02");
    assert.equal(rows[1].location, "FOB Bravo");
  });

  it("correctly handles escaped quotes and commas within field values", () => {
    const csv = `id,description,severity\nFLT-01,"Wheel sensor variance, left side",Critical`;
    const rows = parseCsv(csv);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, "FLT-01");
    assert.equal(rows[0].description, "Wheel sensor variance, left side");
    assert.equal(rows[0].severity, "Critical");
  });

  it("handles empty lines and whitespace gracefully", () => {
    const csv = `\n\nid,name\n\nROV-10,Scout 10\n\n`;
    const rows = parseCsv(csv);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, "ROV-10");
  });
});
