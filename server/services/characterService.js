const { pool } = require('../database/db');
const {
  PS_STATUSES,
  LIU_STATUSES,
  DCRB_STATUSES,
  DCP_STATUSES,
  makePlaceholders,
} = require('../constants/statusConstants');

// Dynamic helper to resolve ps source
const getPsSource = async () => {
  try {
    await pool.execute('SELECT 1 FROM `ps` LIMIT 1');
    return 'ps';
  } catch (e) {
    return "(SELECT DISTINCT `थाना`, NULL as CUG FROM `characters` WHERE `थाना` IS NOT NULL AND `थाना` <> '') ps";
  }
};

class CharacterService {
  async getMinDate() {
    const [rows] = await pool.execute('SELECT MIN(अनुरोध_दिनांक) as minDate FROM characters');
    return rows[0]?.minDate || null;
  }

  async getMaxDate() {
    const [rows] = await pool.execute('SELECT MAX(अनुरोध_दिनांक) as maxDate FROM characters');
    return rows[0]?.maxDate || null;
  }

  async getDashboard() {
    const psSource = await getPsSource();
    const query = `SELECT
                    station_name,
                    station_code,
                    COUNT(*) AS request_count
                    FROM characters
                    GROUP BY station_name, station_code
                    ORDER BY station_name`;
    const [rows] = await pool.execute(query);
    return rows;
  }

  async getDashboardByDateRange(sdate, edate) {
    const psSource = await getPsSource();
    const query = `
      SELECT ps.CUG, ps.थाना, c_total, c_station, c_liu, c_dcrb, c_dcp, c_remain
      FROM ${psSource}
      LEFT JOIN (
        SELECT थाना, COUNT(थाना) c_total FROM characters
        WHERE अनुरोध_दिनांक BETWEEN ? AND ? GROUP BY थाना
      ) t ON t.थाना = ps.थाना
      LEFT JOIN (
        SELECT COUNT(थाना) c_station, थाना FROM characters
        WHERE अनुरोध_की_स्थिति IN (${makePlaceholders(PS_STATUSES)})
        AND अनुरोध_दिनांक BETWEEN ? AND ? GROUP BY थाना
      ) s ON s.थाना = ps.थाना
      LEFT JOIN (
        SELECT COUNT(थाना) c_liu, थाना FROM characters
        WHERE अनुरोध_की_स्थिति IN (${makePlaceholders(LIU_STATUSES)})
        AND अनुरोध_दिनांक BETWEEN ? AND ? GROUP BY थाना
      ) liu ON liu.थाना = ps.थाना
      LEFT JOIN (
        SELECT COUNT(थाना) c_dcrb, थाना FROM characters
        WHERE अनुरोध_की_स्थिति IN (${makePlaceholders(DCRB_STATUSES)})
        AND अनुरोध_दिनांक BETWEEN ? AND ? GROUP BY थाना
      ) dcrb ON dcrb.थाना = ps.थाना
      LEFT JOIN (
        SELECT COUNT(थाना) c_dcp, थाना FROM characters
        WHERE अनुरोध_की_स्थिति IN (${makePlaceholders(DCP_STATUSES)})
        AND अनुरोध_दिनांक BETWEEN ? AND ? GROUP BY थाना
      ) dcp ON dcp.थाना = ps.थाना
      LEFT JOIN (
        SELECT COUNT(थाना) c_remain, थाना FROM characters
        WHERE अनुरोध_की_स्थिति NOT IN ('स्वीकृत','अस्वीकृत')
        AND अनुरोध_दिनांक BETWEEN ? AND ? GROUP BY थाना
      ) remain ON remain.थाना = ps.थाना
      ORDER BY ps.थाना
    `;
    const params = [
      sdate, edate,
      ...PS_STATUSES, sdate, edate,
      ...LIU_STATUSES, sdate, edate,
      ...DCRB_STATUSES, sdate, edate,
      ...DCP_STATUSES, sdate, edate,
      sdate, edate,
    ];
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  async getPendingCharacters(loc) {
    let query = '';
    let params = [];

    if (loc === 'totaldcp') {
      query = `SELECT * FROM characters WHERE अनुरोध_की_स्थिति IN (${makePlaceholders(DCP_STATUSES)}) ORDER BY अनुरोध_दिनांक`;
      params = DCP_STATUSES;
    } else if (loc === 'totalliu') {
      query = `SELECT * FROM characters WHERE अनुरोध_की_स्थिति IN (${makePlaceholders(LIU_STATUSES)}) ORDER BY अनुरोध_दिनांक`;
      params = LIU_STATUSES;
    } else if (loc === 'totalps') {
      query = `SELECT * FROM characters WHERE अनुरोध_की_स्थिति IN (${makePlaceholders(PS_STATUSES)})`;
      params = PS_STATUSES;
    } else if (loc === 'totaldcrb') {
      query = `SELECT * FROM characters WHERE अनुरोध_की_स्थिति IN (${makePlaceholders(DCRB_STATUSES)}) ORDER BY अनुरोध_दिनांक`;
      params = DCRB_STATUSES;
    } else if (loc === 'totalremain') {
      query = `SELECT * FROM characters WHERE अनुरोध_की_स्थिति NOT IN ('स्वीकृत','अस्वीकृत') ORDER BY थाना, अनुरोध_दिनांक`;
    } else if (loc === 'totaldiff') {
      query = `SELECT * FROM characters WHERE अनुरोध_की_स्थिति NOT IN ('स्वीकृत','अस्वीकृत') AND वर्तमान_पता <> स्थायी_पता`;
    } else {
      throw new Error('Invalid loc parameter');
    }

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  async getDetails({ loc, ps, sdate, edate }) {
    let query = '';
    let params = [];

    const dateFilter = sdate && edate ? ' AND अनुरोध_दिनांक BETWEEN ? AND ?' : '';
    const psParam = ps ? [ps] : [];
    const dateParam = sdate && edate ? [sdate, edate] : [];

    if (loc === 'dcp') {
      query = `SELECT * FROM characters WHERE थाना = ?${dateFilter} AND अनुरोध_की_स्थिति IN (${makePlaceholders(DCP_STATUSES)})`;
      params = [...psParam, ...dateParam, ...DCP_STATUSES];
    } else if (loc === 'liu') {
      query = `SELECT * FROM characters WHERE थाना = ?${dateFilter} AND अनुरोध_की_स्थिति IN (${makePlaceholders(LIU_STATUSES)})`;
      params = [...psParam, ...dateParam, ...LIU_STATUSES];
    } else if (loc === 'ps') {
      query = `SELECT * FROM characters WHERE थाना = ?${dateFilter} AND अनुरोध_की_स्थिति IN (${makePlaceholders(PS_STATUSES)})`;
      params = [...psParam, ...dateParam, ...PS_STATUSES];
    } else if (loc === 'dcrb') {
      query = `SELECT * FROM characters WHERE थाना = ?${dateFilter} AND अनुरोध_की_स्थिति IN (${makePlaceholders(DCRB_STATUSES)})`;
      params = [...psParam, ...dateParam, ...DCRB_STATUSES];
    } else if (loc === 'remain') {
      query = `SELECT * FROM characters WHERE थाना = ?${dateFilter} AND अनुरोध_की_स्थिति NOT IN ('स्वीकृत','अस्वीकृत')`;
      params = [...psParam, ...dateParam];
    } else if (loc === 'all') {
      query = `SELECT * FROM characters WHERE थाना = ?${dateFilter}`;
      params = [...psParam, ...dateParam];
    } else if (loc === 'totaldcp') {
      query = `SELECT * FROM characters WHERE${dateFilter.replace(' AND', '')} अनुरोध_की_स्थिति IN (${makePlaceholders(DCP_STATUSES)})`;
      params = [...dateParam, ...DCP_STATUSES];
    } else if (loc === 'totalliu') {
      query = `SELECT * FROM characters WHERE${dateFilter.replace(' AND', '')} अनुरोध_की_स्थिति IN (${makePlaceholders(LIU_STATUSES)})`;
      params = [...dateParam, ...LIU_STATUSES];
    } else if (loc === 'totaldcrb') {
      query = `SELECT * FROM characters WHERE${dateFilter.replace(' AND', '')} अनुरोध_की_स्थिति IN (${makePlaceholders(DCRB_STATUSES)})`;
      params = [...dateParam, ...DCRB_STATUSES];
    } else if (loc === 'totalps') {
      query = `SELECT * FROM characters WHERE${dateFilter.replace(' AND', '')} अनुरोध_की_स्थिति IN (${makePlaceholders(PS_STATUSES)})`;
      params = [...dateParam, ...PS_STATUSES];
    } else if (loc === 'totalremain') {
      query = `SELECT * FROM characters WHERE${dateFilter.replace(' AND', '')} अनुरोध_की_स्थिति NOT IN ('स्वीकृत','अस्वीकृत')`;
      params = [...dateParam];
    } else {
      throw new Error('Invalid loc parameter');
    }

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  async getRemain({ ps, sdate, edate }) {
    if (!ps || !sdate || !edate) {
      throw new Error('ps, sdate, edate are required');
    }
    const [rows] = await pool.execute(
      `SELECT * FROM characters WHERE थाना = ? AND अनुरोध_दिनांक BETWEEN ? AND ? AND अनुरोध_की_स्थिति NOT IN ('स्वीकृत','अस्वीकृत')`,
      [ps, sdate, edate]
    );
    return rows;
  }
}

module.exports = new CharacterService();
