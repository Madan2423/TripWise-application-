import { useEffect } from "react";

import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

// ==================================================
// FIX DEFAULT LEAFLET MARKER ICON
// ==================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"
});

// ==================================================
// MAP CENTER COMPONENT
// ==================================================

function MapCenter({
    position
}) {
    const map = useMap();

    useEffect(() => {

        map.setView(
            position,
            12
        );

    }, [
        map,
        position
    ]);

    return null;
}

// ==================================================
// TRIP MAP
// ==================================================

function TripMap({
    latitude,
    longitude,
    destination
}) {

    const position = [
        Number(latitude),
        Number(longitude)
    ];

    if (
        !Number.isFinite(
            position[0]
        ) ||
        !Number.isFinite(
            position[1]
        )
    ) {
        return (
            <div className="alert alert-warning">
                Map location is not available.
            </div>
        );
    }

    return (
        <div className="card border-0 shadow-sm">

            <div className="card-body p-0">

                <MapContainer
                    center={position}
                    zoom={12}
                    scrollWheelZoom={true}
                    style={{
                        height: "400px",
                        width: "100%"
                    }}
                >

                    <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapCenter
                        position={position}
                    />

                    <Marker
                        position={position}
                    >

                        <Popup>
                            <strong>
                                {destination ||
                                    "Trip Destination"}
                            </strong>

                            <br />

                            Trip destination
                        </Popup>

                    </Marker>

                </MapContainer>

            </div>

        </div>
    );
}

export default TripMap;