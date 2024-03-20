import axios from 'axios';

type Marker = {
  latLng: google.maps.LatLngLiteral;
  placeId: string;
  address: string;
}

const fetchMarkerInfo = async (marker: Marker) => {
    try {
        if (!marker.placeId) {
            const response = await axios.get('https://pathpilot-back.vercel.app/api/nearest', { params: marker });
            marker.placeId = response.data.place_id;
            marker.address = response.data.formatted_address;
        }
        const response = await axios.get('https://pathpilot-back.vercel.app/api/marker', { params: marker });
        marker.address = response.data.result.formatted_address;
        return marker;
    } catch (error) {
        console.error(error);
        return marker;
    }
};

const findRoute = async (markers: Marker[], setDijkstraRoute: (value: google.maps.LatLngLiteral[]) => void, setAStarRoute: (value: google.maps.LatLngLiteral[]) => void) => {
    try {
        const response = await axios.get('https://pathpilot-back.vercel.app/api/route', { params: { start: markers[0], end: markers[1] } });
        const { dijkstra, aStar } = response.data;
        console.log(dijkstra, aStar);
        setDijkstraRoute(dijkstra);
        setAStarRoute(aStar);
        return response.data;
    } catch (error) {
        console.error(error);
        return [];
    }
};

export { fetchMarkerInfo, findRoute };