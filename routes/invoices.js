// routes/invoices.js

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
    const invoicesData = await db.query(`
      SELECT 
        invoices.id, invoices.amt, invoices.paid, 
        invoices.add_date, invoices.paid_date, 
        companies.code, companies.name, companies.description 
      FROM invoices 
      LEFT JOIN companies 
      ON invoices.comp_code = companies.code 
      WHERE invoices.id=$1`, 
      [req.params.id]);

    if (invoicesData.rows.length === 0)
      throw new ExpressError(`Invoice was not found: ${req.params.id}`, 404);
    
    let invoice =  {
      invoice: {
        id: invoicesData.rows[0].id,
        amt: invoicesData.rows[0].amt,
        paid: invoicesData.rows[0].paid,
        add_date: invoicesData.rows[0].add_date,
        paid_date: invoicesData.rows[0].paid_date,
        company: {
          code: invoicesData.rows[0].code,
          name: invoicesData.rows[0].name,
          description: invoicesData.rows[0].description
        }
      }      
    } 
    return res.json(invoice)
  } catch (err) {
    return next(err);
  }
});

/** POST /invoices: create an invoice */
router.post('/', async (req, res, next) => {
  try{
  const { comp_code, amt } = req.body;
  const results = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]);
  return res.status(201).json({invoice: results.rows[0]});
  } catch (err) {
    if(err.code === '23503')
      return next(new ExpressError('Company was not found.', 404));
    return next(err);
  }
});

/** PUT /invoices/:id: update an invoice */
router.put('/:id', async (req, res, next) => {
  try {
    const { amt, paid } = req.body;
    let paid_date = null;

    let invoice = await db.query(`SELECT paid, paid_date FROM invoices WHERE id=$1`, [req.params.id]);

    if(invoice.rows === 0)
      throw new ExpressError(`Invoice cannot be found: ${req.params.id}`, 404);

    if (!invoice.paid && paid)
      paid_date = Date.now()
    else if (!paid)
      paid_date = null
    else 
      paid_date = invoice.paid_date

    const results = await db.query(`UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING id, comp_code, amt, paid, add_date, paid_date`, [amt, paid, paid_date,req.params.id]);

    return res.json({invoice: results.rows[0]});
  } catch (err) {
    if(err.code === '23503')
      return next(new ExpressError('Invoice not found.', 404));
    return next(err);
  }
});

/** DELETE /invoices/:id: deletes an invoice*/
router.delete('/:id', async (req, res, next) => { 
  try {
    const results = await db.query(`DELETE FROM invoices WHERE id=$1`, [req.params.id]);
    if (results.rowCount === 0)
      throw new ExpressError("Invoice not found.", 404);
    return res.json({status: "Invoice deleted"})
  } catch (err) {
    return next(err);
  }

});
module.exports = router;
