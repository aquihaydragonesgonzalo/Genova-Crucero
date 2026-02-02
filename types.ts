export interface Coords {
  lat: number;
  lng: number;
}

export interface UserLocation extends Coords {
  accuracy?: number;
}

export interface Activity {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  locationName: string;
  coords: Coords;
  description: string;
  keyDetails: string;
  priceEUR: number;
  type: 'transport' | 'sightseeing';
  completed: boolean;
  image?: string;
  audioGuideText?: string;
  notes?: string;
}

export interface Waypoint {
  name: string;
  lat: number;
  lng: number;
}

export interface Pronunciation {
  word: string;
  phonetic: string;
  simplified: string;
  meaning: string;
}

export interface WeatherData {
  hourly: {
    time: string[];
    temperature: number[];
    code: number[];
  };
  daily: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}