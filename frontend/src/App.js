// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import './App.css';
import RankingTable from './components/RankingTable';
import UploadForm from './components/UploadForm';

function App() {
  const [allLaptimes, setAllLaptimes] = useState([]);
  const [selectedMap, setSelectedMap] = useState(''); // 선택된 맵 (초기값 없음)
  const [searchTerm, setSearchTerm] = useState(''); // 맵 검색어

  // 1. 전체 랩타임 데이터를 한 번만 불러옵니다.
  const fetchAllLaptimes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/laptimes');
      if (!response.ok) throw new Error('데이터를 불러오는 데 실패했습니다.');
      const data = await response.json();
      setAllLaptimes(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAllLaptimes();
  }, []);

  // 2. 전체 데이터에서 맵 목록을 추출하고 검색어로 필터링합니다.
  const uniqueMaps = [...new Set(allLaptimes.map(lap => lap.map_name))];
  const filteredMaps = uniqueMaps.filter(map => 
    map.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="App">
      <header className="App-header">
        <h1>Lap Time Records</h1>
        <p>당신의 기록을 공유하고, 다른 플레이어와 경쟁하세요!</p>
      </header>
      
      <main>
        <UploadForm onUploadSuccess={fetchAllLaptimes} />
        
        <div className="ranking-section">
          {/* 3. 선택된 맵이 있으면 랭킹을, 없으면 맵 선택 UI를 보여줍니다. */}
          {selectedMap ? (
            <RankingTable
              laptimes={allLaptimes.filter(lap => lap.map_name === selectedMap)}
              selectedMap={selectedMap}
              onBack={() => setSelectedMap('')} // 뒤로가기 기능
            />
          ) : (
            <div className="map-selection">
              <h2>맵을 선택하여 랭킹 확인</h2>
              <input
                type="text"
                placeholder="맵 이름 검색..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="map-list">
                {filteredMaps.map(map => (
                  <button key={map} className="map-button" onClick={() => setSelectedMap(map)}>
                    {map}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;