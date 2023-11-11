const express = require('express');
const router = new express.Router();

const db = require('../db');
const ExpressError = require('../expressError');

/** GET /invoices: get list of invoices */
router.get('/', async (req, res, next) => {
  try {
    const invoices = await db.query(`SELECT id, comp_code FROM invoices`);

    return res.json({ invoices: invoices.rows });
  } catch (err) {
    return next(err);
  }
});

/** GET /invoices/:id: get an invoice by id */
router.get('/:id', async (req, res, next) => {
  try {
    const invoices = await db.query(`
      SELECT 
        invoices.id, invoices.amt, invoices.paid, 
        invoices.add_date, invoices.paid_date, 
        companies.code, companies.name, companies.description 
      FROM invoices 
      LEFT JOIN companies 
      ON invoices.comp_code = companies.code 
      WHERE invoices.id=$1`, 
      [req.params.id]);

    if (invoices.rows.length === 0)
     throw new ExpressError( "Invoice not found", 404);

    let responseData =  {
      invoice: {
        id: invoices.rows[0].id,
        amt: invoices.rows[0].amt,
        paid: invoices.rows[0].paid,
        add_date: invoices.rows[0].add_date,
        paid_date: invoices.rows[0].paid_date
      },
      company: {
        code: invoices.rows[0].code,
        name: invoices.rows[0].name,
        description: invoices.rows[0].description
      }
    } 
    return res.json(responseData)
  } catch (err) {
    return next(err);
  }
});

/** POST /invoices: create an invoice */
router.post('/', async (req, res, next) => {
  try{
  const { comp_code, amt } = req.body;
  const results = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]);
  return res.status(201).json(results.rows[0]);
  } catch (err) {
    if(err.code === 23503)
      return next(new ExpressError('Company was not found.', 404));
    return next(err);
  }
});

/** PUT /invoices/:id: update a company */
router.put('/:id', async (req, res, next) => {
  try {
    const { amt } = req.body;
    const results = await db.query(`UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING id, comp_code, amt, paid, add_date, paid_date`, [amt, req.params.id]);
    return res.json(results.rows[0]);
  } catch (err) {
    if(err.code === 23503)
      return next(new ExpressError('Company was not found.', 404));
    return next(err);
  }
});

/** DELETE /invoices/:id: deletes a company*/
router.delete('/:id', async (req, res, next) => {
  try {
    const results = await db.query(`DELETE FROM invoices WHERE id=$1`, [req.params.id]);
    if (results.rowCount === 0)
      throw new ExpressError("Invoice not found.", 404);
    return res.json({status: "Deleted"})
  } catch (err) {
    return next(err);
  }

});
module.exports = router;
