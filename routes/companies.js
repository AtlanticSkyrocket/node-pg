// routes/companies.js

const express = require('express');
const router = new express.Router();
var slugify = require('slugify')

const db = require('../db');
const ExpressError = require('../expressError');

/** GET /companies: get list of companies */
router.get('/', async (req, res, next) => {
  try {
    const results = await db.query(`SELECT code, name FROM companies`);

    return res.json({ companies: results.rows });
  } catch (err) {
    return next(err);
  }
});

/** GET /companies/:code: get a company by code */
router.get('/:code', async (req, res, next) => {
  try {
    const companies = await db.query(`
    SELECT 
      invoices.id, invoices.amt, invoices.paid, 
      invoices.add_date, invoices.paid_date, 
      companies.code, companies.name, companies.description  
    FROM companies 
    LEFT JOIN invoices 
    ON companies.code = invoices.comp_code 
    WHERE code=$1`, [req.params.code])
    
    if (companies.rows.length === 0)
      throw new ExpressError("Company not found", 404);

    const industries = await db.query(`
    SELECT 
      industry  
    FROM industries i
    LEFT JOIN company_industries ci 
    ON i.code = ci.ind_code 
    LEFT JOIN companies c
    ON ci.comp_code = c.code
    WHERE c.code=$1`, [req.params.code])

    let company = 
      {
        code: companies.rows[0].code,
        name: companies.rows[0].name,
        description: companies.rows[0].description,
        invoices: companies.rows.map(({ id, amt, paid, add_date, paid_date }) => ({id, amt, paid, add_date, paid_date})),
        industries: industries.rows
      }
    
    return res.json({company})
  } catch (err) {
    return next(err);
  }
});

/** POST /companies: create a company */
router.post('/', async (req, res, next) => {
  try{
  const { name, description } = req.body;
  const code = slugify(name, {
    replacement: '_',
    lower: true,
    strict: true
  });
  const results = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`, [code, name, description]);
  return res.status(201).json({company: results.rows[0]});
  } catch (err) {
    if(err.code === '23505')
      return next(new ExpressError('The company already exists', 409))
    return next(err);
  }
});

/** PUT /companies/:code: update a company */
router.put('/:code', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const results = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`, [name, description, req.params.code]);
    if (results.rows.length === 0)
      throw new ExpressError("Update failed. Company not found.", 404);
    return res.json({company: results.rows[0]});
  } catch (err) {
    return next(err);
  }
});

/** DELETE /companies/:code: deletes a company*/
router.delete('/:code', async (req, res, next) => {
  try {
    const results = await db.query(`DELETE FROM companies WHERE code=$1`, [req.params.code]);
    return res.json({message: "Company deleted"})
  } catch (err) {
    return next(err);
  }

});

module.exports = router;