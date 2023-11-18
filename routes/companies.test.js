// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testcompany;
let testinvoice;

describe("Companies tests", function() {
  beforeEach(async function() {
    try{
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
    } catch (err) {
      throw "Error creating test company or invoice";
    }
  });

  afterEach(async function() {
    // delete any data created by test
    await db.query("DELETE FROM invoices");
    await db.query("DELETE FROM companies");
  });

  afterAll(async function() {
    // close db connection
    await db.end();
  });

  /** GET /companies - returns `{companies: [{code, name}, ...]}` */

  describe("GET /companies", function() {
    test("Gets a list of 1 company", async function() {
      const {code, name } = testcompany;
      const response = await request(app).get(`/companies`);
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        companies: [{code, name}]
      });
    });
  });
  // end


  /** GET /companies/[code] - returns `{company: {code, name, description, invoices: [id, ...]}}` */

  describe("GET /companies/:code", function() {
    test("Gets a single company", async function() {
      const tempCompany = {...testcompany};
      tempCompany.invoices = [testinvoice]
      delete tempCompany.invoices[0].comp_code;
      console.log(tempCompany.code);
      const response = await request(app).get(`/companies/${tempCompany.code}`);
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({company: tempCompany});
    });

    test("Responds with 404 if can't find company", async function() {
      const response = await request(app).get(`/companies/0`);
      expect(response.statusCode).toEqual(404);
    });
  });
  // end


  /** POST /companies - create company from data; return `{company: company}` */

  describe("POST /companies", function() {
    test("Creates a new company", async function() {
      const response = await request(app)
        .post(`/companies`)
        .send({
          name: "SpaceX",
          description: 'First private company to go to space.'
        });
      expect(response.statusCode).toEqual(201);
      expect(response.body).toEqual({
        company: {code: 'spacex', name: "SpaceX", description: 'First private company to go to space.'}
      });
    });
  });
  // end


  /** PATCH /companies/[id] - update company; return `{company: company}` */

  describe("PUT /companies/:code", function() {
    test("Updates a single company", async function() {
      const response = await request(app)
        .put(`/companies/msft`)
        .send({
          name: "Microsoft",
          description: "Maker of XBox"
        });
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        company: {code: "msft", name: "Microsoft",  description: "Maker of XBox"}
      });
    });

    test("Responds with 404 if can't find company", async function() {
      const response = await request(app).patch(`/companies/0`);
      expect(response.statusCode).toEqual(404);
    });
  });
  // end


  /** DELETE /companies/[id] - delete company,
   *  return `{message: "Deleted"}` */

  describe("DELETE /companies/:code", function() {
    test("Deletes a single a company", async function() {
      const response = await request(app)
        .delete(`/companies/${testcompany.code}`);
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({ message: "Company deleted" });
    });
  });
  // end

});
