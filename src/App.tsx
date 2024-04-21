import {APIProvider, Map, AdvancedMarker, Pin} from '@vis.gl/react-google-maps';
import { useState } from 'react';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Spacer } from "@/components/ui/spacer"
import { Polygon } from "@/components/ui/polygon"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { GoArrowDown, GoPlus } from "react-icons/go"
import { RxCross1 } from "react-icons/rx"
import { fetchMarkerInfo, findRoute } from "@/api/markerApi"

import './App.css'

type Marker = {
  latLng: google.maps.LatLngLiteral;
  placeId: string;
  address: string;
}

function fillInputs(marker: Marker, from: string, setFrom: (value: string) => void, mid: string, setMid: (value: string) => void, to: string, setTo: (value: string) => void, select: number, isStop: boolean) {
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

  if (select === 3) {
    setMid(name);
    return;
  }

  if (from === '') {
    setFrom(name);
  } else if (isStop && mid === '') {
    if (to === '') {
      setMid(name);
    } else {
      setMid(to);
      setTo(name)
    }
  } else if (to === '') {
    setTo(name);
  } else if (isStop) {
    setFrom(mid);
    setMid(to);
    setTo(name);
  } else {
    setFrom(to);
    setTo(name);
  }
}

function encodePolyline(points: google.maps.LatLngLiteral[] | undefined): string {
  if (!points || points.length < 2) {
    return '';
  }

  const flippedPoints = points.map(({ lat, lng }) => ({ lat: lng, lng: lat }));
  const result = google.maps.geometry.encoding.encodePath(flippedPoints as google.maps.LatLngLiteral[]);
  return result;
}

function App() {
  const position = {lat: 29.643946, lng: -82.355}; // uf :)
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [from, setFrom] = useState('');
  const [mid, setMid] = useState('');
  const [to, setTo] = useState('');
  const [numberOfStops, setNumberOfStops] = useState(2);

  const [dijkstraRoute, setDijkstraRoute] = useState<google.maps.LatLngLiteral[]>();
  const [aStarRoute, setAStarRoute] = useState<google.maps.LatLngLiteral[]>();
  const [bfsRoute, setBfsRoute] = useState<google.maps.LatLngLiteral[]>();

  const [dijkstraTime, setDijkstraTime] = useState(0);
  const [aStarTime, setAStarTime] = useState(0);
  const [bfsTime, setBfsTime] = useState(0);

  const [dijkstra, setDijkstra]  = useState(true);
  const [aStar, setAStar]  = useState(true);
  const [bfs, setBfs]  = useState(true);

  function onPlaceSelect(place: google.maps.places.PlaceResult | null, setMarkers: (value: Marker[]) => void, select: number) {
    if (place) {
      const newMarker = {} as Marker;
      newMarker.latLng = {
        lat: place.geometry?.location?.lat() as number,
        lng: place.geometry?.location?.lng() as number,
      };
      newMarker.placeId = place.place_id as string;
      newMarker.address = place.formatted_address as string;
      fillInputs(newMarker, from, setFrom, mid, setMid, to, setTo, select, numberOfStops === 3);
      setMarkers([...markers.slice(-numberOfStops+1), newMarker] as Marker[]);
    }
  }

  return (
    // aceternity ui dot background (discussed with Matthew DeGuzman)
    <div className="h-full w-full dark:bg-black bg-white  dark:bg-dot-white/[0.2] bg-dot-black/[0.2] relative flex items-center justify-center">
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
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
                fillInputs(markerInfo as Marker, from, setFrom, mid, setMid, to, setTo, 0, numberOfStops === 3);
                setMarkers([...markers.slice(-numberOfStops+1), ev.detail] as Marker[]);
                setDijkstraRoute([]);
                setAStarRoute([]);
                setBfsRoute([]);
                setDijkstraTime(0);
                setAStarTime(0);
                setBfsTime(0);
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
              {bfs && <Polygon strokeWeight={3.0} strokeOpacity={0.7} strokeColor={'#00ff00'} encodedPaths={bfsRoute ? [encodePolyline([...bfsRoute, ...bfsRoute.slice(1, -1).reverse()])] : []} />}
              {dijkstra && <Polygon strokeWeight={3.0} strokeOpacity={0.7} strokeColor={'#0000ff'} encodedPaths={dijkstraRoute ? [encodePolyline([...dijkstraRoute, ...dijkstraRoute.slice(1, -1).reverse()])] : []} />}
              {aStar && <Polygon strokeWeight={3.0} strokeOpacity={0.7} strokeColor={'#ff0000'} encodedPaths={aStarRoute ? [encodePolyline([...aStarRoute, ...aStarRoute.slice(1, -1).reverse()])] : []} />}
            </Map>
          </div>
          <div className={'w-4/12 h-5/6 mx-20'}>
            <Label htmlFor='start'>From:</Label>
            <Input className={'my-2'} id="1" placeholder='Enter location' value={from} setValue={setFrom} setMarkers={setMarkers} onPlaceSelect={onPlaceSelect}/>

            <Spacer size={30} />
            <div className={'flex justify-center'}>
              <GoArrowDown/>
              { numberOfStops === 2 ? (
                  <GoPlus
                    onClick={() => {
                      setNumberOfStops(3);
                      setMarkers([...markers.slice(-numberOfStops)])
                    }}
                  />
                ) : (
                  <RxCross1
                    onClick={() => {
                      setNumberOfStops(2);
                      setMid('');
                      setMarkers([...markers.slice(-numberOfStops)])
                    }}
                  />
                )
              }
            </div>

            { numberOfStops === 3 ? (
              <>
                <Spacer size={10} />
                <Label htmlFor='stop'>Stop:</Label>
                <Input className={'my-2'} id="3" placeholder='' value={mid} setValue={setMid} setMarkers={setMarkers} onPlaceSelect={onPlaceSelect}/>
                <Spacer size={30} />
                <div className={'flex justify-center'}>
                  <GoArrowDown/>
                </div>
              </>
            ) : (
              <Spacer size={10} />
            )}

            <Label htmlFor='destination'>To:</Label>
            <Input className={'my-2'} id="2" placeholder='' value={to} setValue={setTo} setMarkers={setMarkers} onPlaceSelect={onPlaceSelect}/>

            <Spacer size={125} />

            <Card>
              <CardContent>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Spacer size={20} />
                    <div className="flex flex-row justify-around">
                      <input type="checkbox" checked={dijkstra} onClick={() => {setDijkstra(!dijkstra)}}/>
                      <div>Dijkstra's:</div>
                      {dijkstraTime.toString() + " ms"}
                    </div>
                    <Spacer size={10} />
                    <div className="flex flex-row justify-around">
                      <input className="accent-red-600" type="checkbox" checked={aStar} onClick={() => {setAStar(!aStar)}}/>
                      <div>A*:</div>
                      {aStarTime.toString() + " ms"}
                    </div>
                    <Spacer size={10} />
                    <div className="flex flex-row justify-around">
                      <input className="accent-lime-600" type="checkbox" checked={bfs} onClick={() => {setBfs(!bfs)}}/>
                      <div>BFS:</div>
                      {bfsTime.toString() + " ms"}
                    </div>
                    <Spacer size={6} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Spacer size={125} />

            <div className={'flex justify-center'}>
              <Button size={'lg'} onClick={() => {
                findRoute(markers, setDijkstraRoute, setAStarRoute, setBfsRoute, setDijkstraTime, setAStarTime, setBfsTime);
              }}>Find Route</Button>
            </div>
          </div>
        </div>
      </APIProvider>
    </div>
  );
}

export default App;
