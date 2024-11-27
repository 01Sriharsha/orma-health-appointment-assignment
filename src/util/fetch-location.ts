export type Location = {
  display_name: string;
  lat: string;
  lon: string;
};

export const fetchLocations = async (address: string): Promise<Location[]> => {
  try {
    if (address.length < 3) return [];
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&accept-language=en&q=${encodeURIComponent(
        address
      )}`
    );
    const data = await response.json();
    return data.map((item: any) => ({
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
    }));
  } catch (error: any) {
    console.log("fetch location error", error.message);
    return [];
  }
};
