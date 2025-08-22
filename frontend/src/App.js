// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import './App.css';
import RankingTable from './components/RankingTable';
import UploadForm from './components/UploadForm';

function App() {
  // ... (useState hooks remain the same)
  const [laptimes, setLaptimes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMap, setSelectedMap] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const uniqueMaps = ['All', ...new Set(laptimes.map(lap => lap.map_name))];
  const filteredMaps = uniqueMaps.filter(map => 
    map.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchLaptimes = async () => {
    setIsLoading(true);
    // Use the environment variable for the URL
    const url = `${process.env.REACT_APP_API_URL}/api/laptimes?map=${selectedMap}`;
    try {
      const response = await fetch(url);
      // ... (rest of the function is the same)
      if (!response.ok) {
        throw new Error('Data could not be fetched.');
      }
      const data = await response.json();
      setLaptimes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchLaptimes();
  }, [selectedMap]);


  return (
    // ... (the JSX part remains the same)
    <div className="App">
      <header className="App-header">
        <h1>Lap Time Records</h1>
        <p>당신의 기록을 공유하고, 다른 플레이어와 경쟁하세요!</p>
      </header>
      
      <main>
        <UploadForm onUploadSuccess={fetchLaptimes} />
        
        <div className="ranking-section">
          {selectedMap ? (
            <RankingTable
              laptimes={laptimes.filter(lap => lap.map_name === selectedMap)}
              selectedMap={selectedMap}
              onBack={() => setSelectedMap('')}
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