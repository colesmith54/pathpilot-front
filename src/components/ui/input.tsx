import React, { useRef, useEffect, useState } from 'react';
import { cn } from "@/lib/utils";
import { useMapsLibrary } from '@vis.gl/react-google-maps';

type Marker = {
  latLng: google.maps.LatLngLiteral;
  placeId: string;
  address: string;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string;
  setValue?: (value: string) => void;
  setMarkers: (value: Marker[]) => void;
  onPlaceSelect: (place: google.maps.places.PlaceResult | null, setMarkers: (value: Marker[]) => void, select: number) => void;
}

const Input: React.FC<InputProps> = ({ className, id, type, value, setValue, setMarkers, onPlaceSelect, ...props }) => {
  const [placeAutocomplete, setPlaceAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const options = {
      fields: ['geometry', 'name', 'formatted_address']
    };

    setPlaceAutocomplete(new places.Autocomplete(inputRef.current, options));
  }, [places]);

  useEffect(() => {
    if (!placeAutocomplete) return;

    placeAutocomplete.addListener('place_changed', () => {
      onPlaceSelect && onPlaceSelect(placeAutocomplete.getPlace(), setMarkers, parseInt(id as string));
    });
  }, [id, onPlaceSelect, placeAutocomplete, setMarkers]);

  return (
    <input
      type={type}
      value={value}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={inputRef}
      onChange={(e) => {
        setValue && setValue(e.target.value);
      }}
      {...props}
    />
  );
};

Input.displayName = "Input";
export { Input };