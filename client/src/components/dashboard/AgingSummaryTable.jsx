import React from 'react';
import { Link } from 'react-router-dom';

export default function AgingSummaryTable({ agingRows, agingTotals }) {
  const detailLink = (typeKey, daysRange) =>
    `/characters?type=${typeKey}&days=${daysRange}`;

  return (
    <div className="table-wrapper image-styled-table-wrapper card-upgrade">
      <div className="table-header-title">
        <h3>📊 आवेदन प्रकार समय-सीमा स्थिति (Aging Summary)</h3>
      </div>
      <table className="image-styled-table">
        <thead>
          <tr>
            <th className="th-sno">SNo.</th>
            <th className="th-app-type">Application Type</th>
            <th>Within 15 days</th>
            <th>Between 16 to 30 days</th>
            <th>Between 31 to 90 days</th>
            <th>Between 91 to 180 days</th>
            <th>Between 181 to 365 days</th>
            <th>Above 01 year</th>
          </tr>
        </thead>

        <tbody>
          {agingRows.map((r, i) => (
            <tr key={i} className={i % 2 === 1 ? 'alt-row' : ''}>
              <td className="td-sno">{r.sno || i + 1}</td>
              <td className="td-app-type">{r.label || r.app_type}</td>
              <td className="td-count">
                <Link to={detailLink(r.typeKey || 'character', '15')} className="count-link">{r.d15}</Link>
              </td>
              <td className="td-count">
                <Link to={detailLink(r.typeKey || 'character', '30')} className="count-link">{r.d30}</Link>
              </td>
              <td className="td-count">
                <Link to={detailLink(r.typeKey || 'character', '90')} className="count-link">{r.d90}</Link>
              </td>
              <td className="td-count">
                <Link to={detailLink(r.typeKey || 'character', '180')} className="count-link">{r.d180}</Link>
              </td>
              <td className="td-count">
                <Link to={detailLink(r.typeKey || 'character', '365')} className="count-link">{r.d365}</Link>
              </td>
              <td className="td-count">
                <Link to={detailLink(r.typeKey || 'character', 'above1')} className="count-link">{r.dAbove1}</Link>
              </td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr className="total-row">
            <td className="td-sno"></td>
            <td className="td-total-label">कुल</td>
            <td className="td-total-val">{agingTotals.d15}</td>
            <td className="td-total-val">{agingTotals.d30}</td>
            <td className="td-total-val">{agingTotals.d90}</td>
            <td className="td-total-val">{agingTotals.d180}</td>
            <td className="td-total-val">{agingTotals.d365}</td>
            <td className="td-total-val">{agingTotals.dAbove1}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
