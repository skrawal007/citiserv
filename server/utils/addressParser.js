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


function findAddressDetails(address, districtMap) {

    for (const [districtHindiName, districtData] of districtMap) {

        if (!address.includes(districtHindiName)) continue;

        const result = {
            district_name: districtData.district_name,              // English
            district_hindi_name: districtData.district_hindi_name,  // Hindi
            district_code: districtData.district_code,
            station_name: null,            // English
            station_hindi_name: null,      // Hindi
            station_code: null,
            address: address
        };

        for (const [stationHindiName, stationData] of districtData.stations) {

            if (address.includes(stationHindiName)) {

                result.station_name = stationData.station_name;               // English
                result.station_hindi_name = stationData.station_hindi_name;   // Hindi
                result.station_code = stationData.station_code;

                result.address = address
                    .replace(stationHindiName, "")
                    .replace(districtHindiName, "")
                    .replace(/उत्तर\s*प्रदेश/gi, "")
                    .replace(/\s+/g, " ")
                    .trim();

                break;
            }
        }

        return result;
    }

    return {
        district_name: null,
        district_hindi_name: null,
        district_code: null,
        station_name: null,
        station_hindi_name: null,
        station_code: null,
        address
    };
}


function getDistrictStationDetails(districtMap, districtHindiName, stationHindiName) {
  if (!districtHindiName || !stationHindiName) {
    return null;
  }

  const district = districtMap.get(districtHindiName.trim());

  if (!district) {
    return null;
  }

  const station = district.stations.get(stationHindiName.trim());

  if (!station) {
    return {
      district_code: district.district_code,
      district_name: district.district_name,
      district_hindi_name: district.district_hindi_name,
      station_code: null,
      station_name: null,
      station_hindi_name: stationHindiName,
    };
  }

  return {
    district_code: district.district_code,
    district_name: district.district_name,
    district_hindi_name: district.district_hindi_name,

    station_code: station.station_code,
    station_name: station.station_name,
    station_hindi_name: station.station_hindi_name,
  };
}

module.exports = { parseAddress, findAddressDetails, getDistrictStationDetails };
