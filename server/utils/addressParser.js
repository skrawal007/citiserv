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
    // Find the district that appears furthest to the right
    let matchedDistrict = null;

    for (const [districtHindiName, districtData] of districtMap) {
        const index = address.lastIndexOf(districtHindiName);

        if (index === -1) continue;

        if (
            !matchedDistrict ||
            index > matchedDistrict.index ||
            (index === matchedDistrict.index &&
             districtHindiName.length > matchedDistrict.name.length)
        ) {
            matchedDistrict = {
                index,
                name: districtHindiName,
                data: districtData
            };
        }
    }

    if (!matchedDistrict) {
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

    const { name: districtHindiName, data: districtData } = matchedDistrict;

    const result = {
        district_id: districtData.district_id,
        district_name: districtData.district_name,
        district_hindi_name: districtData.district_hindi_name,
        district_code: districtData.district_code,
        station_name: null,
        station_hindi_name: null,
        station_code: null,
        address
    };

    // Search station only within the matched district
    for (const [stationHindiName, stationData] of districtData.stations) {
        if (address.includes(stationHindiName)) {
            result.station_name = stationData.station_name;
            result.station_hindi_name = stationData.station_hindi_name;
            result.station_code = stationData.station_code;
            result.station_id = stationData.station_id;

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
