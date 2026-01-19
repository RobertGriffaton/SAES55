export interface MapSessionState {
    searchText: string;
    position: [number, number] | null;
    radiusKm: number;
    selectedRestaurant: any | null;
    restaurants: any[];
}
