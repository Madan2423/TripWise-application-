const NOMINATIM_URL =
    "https://nominatim.openstreetmap.org/search";

export async function getCoordinates(
    destination
) {
    if (!destination) {
        throw new Error(
            "Destination is required"
        );
    }

    const url =
        `${NOMINATIM_URL}?` +
        new URLSearchParams({
            q: destination,
            format: "json",
            limit: "1"
        });

    const response = await fetch(
        url,
        {
            headers: {
                Accept:
                    "application/json"
            }
        }
    );

    if (!response.ok) {
        throw new Error(
            "Unable to find destination"
        );
    }

    const data =
        await response.json();

    if (
        !data ||
        data.length === 0
    ) {
        throw new Error(
            "Destination not found"
        );
    }

    return {
        latitude: Number(
            data[0].lat
        ),

        longitude: Number(
            data[0].lon
        ),

        displayName:
            data[0].display_name
    };
}