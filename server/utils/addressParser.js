/**
 * Parses full address into component fields
 * @param {string} fullAddress
 * @param {string} district
 * @returns {object} { address, station_name, district, state }
 */ 
const pool= require('../database/db');
function parseAddress(fullAddress = '', district = '') {
  let str = (fullAddress || '').trim();

  // Remove state
  str = str.replace(/\s*उत्तर प्रदेश\s*$/, '').trim();

  // Remove district
  if (district) {
    str = str.replace(district, '').trim();
  }

  // Station is the last Hindi words
  const match = str.match(/([\u0900-\u097F\s]+)$/);

  let station_name = '';
  let address = str;

  if (match) {
    station_name = match[1].trim();
    address = str.slice(0, match.index).trim();
  }

  return {
    address,
    station_name,
    district,
    state: 'उत्तर प्रदेश',
  };
}

module.exports = { parseAddress };
