import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

export interface LocationData {
  latitude: number;
  longitude: number;
  reverseName?: string;
}

export default function useLocation(shouldFetch: boolean) {
  const locationPromiseRef = useRef<Promise<LocationData | null> | null>(null);
  const locationReadyPromiseRef = useRef<Promise<LocationData | null> | null>(null);
  const reverseNamePromiseRef = useRef<Promise<string | undefined> | null>(null);

  const [location, setLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    if (shouldFetch && !locationPromiseRef.current) {
      locationPromiseRef.current = new Promise((resolveLocation) => {
        if (!navigator.geolocation) {
          return resolveLocation(null);
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            resolveLocation({ latitude, longitude });
            setLocation(prev => ({ latitude, longitude, reverseName: prev?.reverseName }));

            reverseNamePromiseRef.current = new Promise(async (resolveName) => {
              try {
                const res = await axios.get(`https://redirect.life1st.me/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                if (res.status === 200) {
                  const geoData = res.data;
                  if (geoData && geoData.address) {
                    const address = geoData.address;
                    const parts = [
                      address.road || address.pedestrian || address.street || address.suburb || address.village || address.neighbourhood,
                      address.city || address.town || address.county || address.district,
                      address.state || address.province || address['ISO3166-2-lvl4']
                    ].filter(Boolean);
                    
                    if (parts.length === 3) {
                      const formattedName = parts.join('，');
                      const rName = formattedName.length > 16 ? formattedName.substring(0, 16) + '...' : formattedName;
                      setLocation({ latitude, longitude, reverseName: rName });
                      return resolveName(rName);
                    } else if (geoData.display_name) {
                      const rName = geoData.display_name.substring(0, 16);
                      setLocation({ latitude, longitude, reverseName: rName });
                      return resolveName(rName);
                    }
                  }
                }
              } catch (e) {
                console.error('Failed to reverse geocode', e);
              }
              resolveName(undefined);
            });
            
            // This promise resolves when both coordinate and reverse geocode finish or fail.
            locationReadyPromiseRef.current = new Promise(async (resolveReady) => {
                let rName: string | undefined = undefined;
                if (reverseNamePromiseRef.current) {
                   rName = await reverseNamePromiseRef.current;
                }
                resolveReady({ latitude, longitude, reverseName: rName });
            });

          },
          (error) => {
            console.error('Failed to get location', error);
            resolveLocation(null);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      });
    }
  }, [shouldFetch]);

  return {
    location,
    locationPromiseRef,
    locationReadyPromiseRef,
  };
}
