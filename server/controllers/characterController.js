const characterService = require('../services/characterService');
const { processExcelBuffer } = require('../utils/excelParser');

class CharacterController {
  async getMinDate(req, res) {
    const minDate = await characterService.getMinDate();
    res.json({ minDate });
  }

  async getMaxDate(req, res) {
    const maxDate = await characterService.getMaxDate();
    res.json({ maxDate });
  }

  async getDashboard(req, res) {
    const data = await characterService.getDashboard();
    res.json(data);
  }

  async getDashboardByDate(req, res) {
    const { sdate, edate } = req.body;
    if (!sdate || !edate) {
      return res.status(400).json({ error: 'sdate and edate are required' });
    }
    const data = await characterService.getDashboardByDateRange(sdate, edate);
    res.json(data);
  }

  async getPending(req, res) {
    const { loc } = req.query;
    if (!loc) {
      return res.status(400).json({ error: 'loc parameter is required' });
    }
    const data = await characterService.getPendingCharacters(loc);
    res.json(data);
  }

  async getDetails(req, res) {
    const { loc, ps, sdate, edate } = req.query;
    const data = await characterService.getDetails({ loc, ps, sdate, edate });
    res.json(data);
  }

  async getRemain(req, res) {
    const { ps, sdate, edate } = req.query;
    const data = await characterService.getRemain({ ps, sdate, edate });
    res.json(data);
  }

  async uploadFile(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const parsedResult = await processExcelBuffer(req.file.buffer);

    res.json({
      message: `${parsedResult.totalRecords} records converted to JSON successfully`,
      totalRecords: parsedResult.totalRecords,
      differentAddressCount: parsedResult.differentAddressCount,
      data: parsedResult.jsonResult,
    });
  }
}

module.exports = new CharacterController();
