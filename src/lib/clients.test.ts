import { test } from "node:test";
import assert from "node:assert/strict";
import { clientDisplayNames } from "./clients.ts";

test("the company leads and the contact person sits underneath", () => {
  assert.deepEqual(clientDisplayNames({ name: "Ahsan Malik", company: "Inter Ad" }), {
    primary: "Inter Ad",
    secondary: "Ahsan Malik",
  });
});

test("a client with no company is led by their own name", () => {
  assert.deepEqual(clientDisplayNames({ name: "Ahsan Malik", company: null }), {
    primary: "Ahsan Malik",
    secondary: "Independent advertiser",
  });
  assert.deepEqual(clientDisplayNames({ name: "Ahsan Malik", company: "   " }), {
    primary: "Ahsan Malik",
    secondary: "Independent advertiser",
  });
});

test("a company that just repeats the person is not shown twice", () => {
  assert.deepEqual(clientDisplayNames({ name: "Ahsan Malik", company: "ahsan malik" }), {
    primary: "Ahsan Malik",
    secondary: "Independent advertiser",
  });
});

test("surrounding whitespace never reaches the page", () => {
  assert.deepEqual(clientDisplayNames({ name: "  Ahsan Malik  ", company: "  Inter Ad  " }), {
    primary: "Inter Ad",
    secondary: "Ahsan Malik",
  });
});
