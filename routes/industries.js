// routes/industries.js

const express = require('express');
const router = new express.Router();

const db = require('../db');
const ExpressError = require('../expressError');

/** GET /industries: get list of industries with companies in the industry */
router.get('/', async (req, res, next) => {
  try {
    const results = await db.query(`
    SELECT i.industry , c.code
    FROM industries i
    LEFT JOIN company_industries ci 
    ON i.code = ci.ind_code 
    LEFT JOIN companies c
    ON ci.comp_code = c.code;`);

    const companiesGroupedByIndustry = results.rows.reduce((acc, row) => {
      if (!acc[row.industry]) {
        acc[row.industry] = {
          companies: []
        }
      }

      if(row.code !== null && !acc[row.industry].companies.includes(row.code)){
        acc[row.industry].companies.push(row.code)
      }
      return acc;
    }, {});
    
    const formattedReturnData = Object.keys(companiesGroupedByIndustry).map(key => {
      return { [key]: companiesGroupedByIndustry[key]};
    });
    
    return res.json({ industries : formattedReturnData });
  } catch (err) {
    return next(err);
  }
});

/** POST /industries: create a new industry */
router.post('/', async (req, res, next) => {
  try{
    const {code, industry} = req.body;
    const results = await db.query(`INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry`, [code, industry]);
    return res.status(201).json({industry: results.rows[0]});
  } catch (err) {
    return next(err);
  }
});

/** POST /industries/:ind_code: create a relationship between an industry and company*/
router.post('/:ind_code', async (req, res, next) => {
  try{
    const { comp_code } = req.body;
    const results = await db.query(`INSERT INTO company_industries (ind_code, comp_code) VALUES ($1, $2) RETURNING ind_code, comp_code`, [req.params.ind_code, comp_code]);
    return res.status(201).json({industry: results.rows[0]});
  } catch (err) {
    return next(err);
  }

});

module.exports = router;