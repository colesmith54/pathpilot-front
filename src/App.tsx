import {APIProvider, Map, AdvancedMarker, Pin} from '@vis.gl/react-google-maps';
import { useState } from 'react';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Spacer } from "@/components/ui/spacer"
import { Polygon } from "@/components/ui/polygon"
import { GoArrowDown } from "react-icons/go"
import { MultiStepLoader as Loader } from "@/components/ui/load";

import { fetchMarkerInfo, findRoute } from "@/api/markerApi"

import './App.css'

type Marker = {
  latLng: google.maps.LatLngLiteral;
  placeId: string;
  address: string;
}

const loadingStates = [
  {
    text: "Fetching data",
  },
  {
    text: "Generating graph",
  },
  {
    text: "Traversing graph (Dijkstra's)",
  },
  {
    text: "Traversing graph (A*)",
  },
  {
    text: "Comapring results",
  }
];

function fillInputs(marker: Marker, from: string, setFrom: (value: string) => void, to: string, setTo: (value: string) => void, select: number) {
  const name = marker.address ? marker.address : 'no address! pick a better point :)';
  if (name === '') {
    return;
  }

  if (select === 1) {
    setFrom(name);
    return;
  }

  if (select === 2) {
    setTo(name);
    return;
  }

  if (from === '') {
    setFrom(name);
  } else if (to === '') {
    setTo(name);
  } else {
    setFrom(to);
    setTo(name);
  }
}

function encodePolyline(points: google.maps.LatLngLiteral[] | undefined): string {
  if (!points || !points[0] || !points[-1]) {
    return '';
  }

  const temp = points[0].lat;
  points[0].lat = parseFloat(points[0].lng.toFixed(5));
  points[0].lng = parseFloat(temp.toFixed(5));

  const temp2 = points[-1].lat;
  points[-1].lat = parseFloat(points[-1].lng.toFixed(5));
  points[-1].lng = parseFloat(temp2.toFixed(5));

  const result = google.maps.geometry.encoding.encodePath(points as google.maps.LatLngLiteral[])
  console.log(result);
  return result;
}


function App() {
  const position = {lat: 29.643946, lng: -82.355}; // uf :)
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);

  const [dijkstraRoute, setDijkstraRoute] = useState<google.maps.LatLngLiteral[]>();
  const [aStarRoute, setAStarRoute] = useState<google.maps.LatLngLiteral[]>();

  const numberOfStops = 2;

  function onPlaceSelect(place: google.maps.places.PlaceResult | null, setMarkers: (value: Marker[]) => void, select: number) {
    if (place) {
      const newMarker = {} as Marker;
      newMarker.latLng = {
        lat: place.geometry?.location?.lat() as number,
        lng: place.geometry?.location?.lng() as number,
      };
      newMarker.placeId = place.place_id as string;
      newMarker.address = place.formatted_address as string;
      fillInputs(newMarker, from, setFrom, to, setTo, select);
      setMarkers([...markers.slice(-numberOfStops+1), newMarker] as Marker[]);
    }
  }

  return (
    <div className="h-full w-full dark:bg-black bg-white  dark:bg-dot-white/[0.2] bg-dot-black/[0.2] relative flex items-center justify-center">
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <Loader loadingStates={loadingStates} loading={loading} duration={2000} />
      <APIProvider apiKey={import.meta.env.VITE_API_KEY}>
        <div className={'w-full h-full flex items-center z-10'}>
          <div className={'w-8/12 h-5/6 rounded-md border border-input bg-background mx-16'}>
            <Map
              mapId={'bf077042cde47358'}
              defaultCenter={position} 
              defaultZoom={14} 
              gestureHandling={'greedy'} 
              disableDefaultUI={true} 
              disableDoubleClickZoom={true}
              onClick={async ev => {
                const markerInfo = await fetchMarkerInfo(ev.detail as Marker);
                fillInputs(markerInfo as Marker, from, setFrom, to, setTo, 0);
                setMarkers([...markers.slice(-numberOfStops+1), ev.detail] as Marker[]);
                setDijkstraRoute([]);
                setAStarRoute([]);
              }}>
              {markers.map((marker, id) => (
                <AdvancedMarker
                  key={id}
                  position={marker.latLng}
                  title={'Marker'}>
                  <Pin>
                    {(id + 10).toString(36).toUpperCase()}
                  </Pin>
                </AdvancedMarker>
              ))}
              <Polygon strokeWeight={1.5} encodedPaths={dijkstraRoute ? [encodePolyline([...dijkstraRoute, ...dijkstraRoute.slice(1, -1).reverse()])] : []} />
              <Polygon strokeWeight={1.5} encodedPaths={aStarRoute ? [encodePolyline([...aStarRoute, ...aStarRoute.slice(1, -1).reverse()])] : []} />
            </Map>
          </div>
          <div className={'w-4/12 h-5/6 mx-20'}>
            <Label htmlFor='start'>From:</Label>
            <Input className={'my-2'} id="1" placeholder='Enter location' value={from} setValue={setFrom} setMarkers={setMarkers} onPlaceSelect={onPlaceSelect}/>

            <Spacer size={25} />
            <div className={'flex justify-center'}>
              <GoArrowDown/>
            </div>
            <Spacer size={10} />

            <Label htmlFor='destination'>To:</Label>
            <Input className={'my-2'} id="2" placeholder='' value={to} setValue={setTo} setMarkers={setMarkers} onPlaceSelect={onPlaceSelect}/>

            <Spacer size={250} />
            <div className={'flex justify-center'}>
              <Button size={'lg'} onClick={() => {
                setLoading(true);
                findRoute(markers, setDijkstraRoute, setAStarRoute);
                setLoading(false);
              }}>Find Route</Button>
            </div>
          </div>
        </div>
      </APIProvider>
    </div>
  );
}

export default App;
