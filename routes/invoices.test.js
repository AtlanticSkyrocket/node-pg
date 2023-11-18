// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testinvoice;
let testcompany;

beforeEach(async function() {
  let companyRes = await db.query(`
  INSERT INTO
    companies (code, name, description) 
  VALUES ('msft', 'Microsoft', 'Maker of windows OS')
  RETURNING code, name, description`);
testcompany = companyRes.rows[0];

let invoiceRes = await db.query(`
  INSERT INTO invoices (comp_code, amt, paid, paid_date)
  VALUES ('msft', 100, false, null)
  RETURNING id, comp_code, amt, paid, add_date, paid_date`)
testinvoice = invoiceRes.rows[0];
testinvoice.add_date = testinvoice.add_date.toISOString()
});


/** GET /invoices - returns `{invoices: [{id, comp_code}, ...]}` */

describe("GET /invoices", function() {
  test("Gets a list of invoices", async function() {
    const response = await request(app).get(`/invoices`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      invoices: [{id: testinvoice.id, comp_code: testinvoice.comp_code}]
    });
  });
});
// end


/** GET /invoices/[id] - return data about one invoice: `{invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}` */

describe("GET /invoices/:id", function() {
  test("Gets a single invoice", async function() {
    let tempInvoice = {...testinvoice, company: testcompany};
    delete tempInvoice.comp_code;
    const response = await request(app).get(`/invoices/${testinvoice.id}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({invoice: tempInvoice});
  });

  test("Responds with 404 if can't find invoice", async function() {
    const response = await request(app).get(`/invoices/0`);
    expect(response.statusCode).toEqual(404);
  });
});
// end


/** POST /invoices - create invoice from data; return `{invoice: {id, comp_code, amt, paid, add_date, paid_date}}` */

describe("POST /invoices", function() {
  test("Creates a new invoice", async function() {
    const response = await request(app)
      .post(`/invoices`)
      .send({
        comp_code: testinvoice.comp_code,
        amt: 125
      });
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      invoice: {id: expect.any(Number), comp_code: "msft", amt: 125, paid: false, add_date: expect.any(String), paid_date: null}
    });
  });
});
// end


/** PUT /invoices/[id] - update invoice; returns `{invoice: {id, comp_code, amt, paid, add_date, paid_date}}` */

describe("PUT /invoices/:id", function() {
  test("Updates a single invoice", async function() {
    const response = await request(app)
      .put(`/invoices/${testinvoice.id}`)
      .send({
        amt: 135,
        paid: false
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      invoice: {id: testinvoice.id, comp_code: testinvoice.comp_code, amt: 135, paid: testinvoice.paid, add_date: testinvoice.add_date, paid_date: null}
    });
  });

  test("Responds with 404 if can't find invoice", async function() {
    const response = await request(app).patch(`/invoices/0`);
    expect(response.statusCode).toEqual(404);
  });
});
// end


/** DELETE /invoices/[id] - delete invoice,
 *  return `{message: "invoice deleted"}` */

describe("DELETE /invoices/:id", function() {
  test("Deletes a single a invoice", async function() {
    const response = await request(app)
      .delete(`/invoices/${testinvoice.id}`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ status: "Invoice deleted" });
  });
});
// end


afterEach(async function() {
  // delete any data created by test
  await db.query("DELETE FROM invoices");
  await db.query("DELETE FROM companies");
});

afterAll(async function() {
  // close db connection
  await db.end();
});
