// frontend/src/components/RankingTable.js

import React from 'react';

function RankingTable({ laptimes, selectedMap, onBack }) {
  // 랩타임 순으로 정렬
  const sortedLaptimes = [...laptimes].sort((a, b) => a.lap_time.localeCompare(b.lap_time));

  return (
    <div className="ranking-container">
      <div className="ranking-header">
        <h2>{selectedMap} 랭킹</h2>
        <button onClick={onBack} className="back-button">맵 선택으로 돌아가기</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>등수</th>
            <th>유저네임</th>
            <th>랩타임</th>
            <th>업로드 날짜</th>
          </tr>
        </thead>
        <tbody>
          {sortedLaptimes.map((lap, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{lap.username}</td>
              <td>
                <a href={lap.screenshot_url} target="_blank" rel="noopener noreferrer">
                  {lap.lap_time}
                </a>
              </td>
              {/* 시간 표시를 한국 시간(KST)으로 고정 */}
              <td>{new Date(lap.uploaded_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RankingTable;