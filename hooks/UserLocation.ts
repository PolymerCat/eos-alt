import { useState, useEffect } from 'react';

export const useGeolocation = () => {
    const [location, setLocation] = useState<GeolocationPosition | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError("Geolocation not supported");
            return;
        }

        // 'watchPosition' is better for performance than repeated 'getCurrentPosition' calls
        const watcher = navigator.geolocation.watchPosition(
            (pos) => setLocation(pos),
            (err) => setError(err.message),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );

        // Cleanup: Important for session management! 
        // Stops the GPS when the user leaves the page.
        return () => navigator.geolocation.clearWatch(watcher);
    }, []);

    return { location, error };
};