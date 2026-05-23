export class YaatraAPI {
  baseURL: string;
  headers: Record<string, string>;

  constructor(baseURL = 'http://localhost:5089/api') {
    this.baseURL = baseURL;
    this.headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : ''}`,
    };
  }

  async call(method: string, endpoint: string, data: unknown = null) {
    try {
      const config: RequestInit = { method, headers: this.headers };
      if (data) config.body = JSON.stringify(data);
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async estimateFare(pickup: string, dropoff: string, vehicleType: string) {
    return this.call('POST', '/rides/estimate-fare', {
      pickupLocation: pickup,
      dropoffLocation: dropoff,
      vehicleType,
    });
  }

  async createRide(pickup: string, dropoff: string, vehicleType: string) {
    return this.call('POST', '/rides/create', {
      pickupLocation: pickup,
      dropoffLocation: dropoff,
      vehicleType,
      riderId: typeof window !== 'undefined' ? localStorage.getItem('user_id') : null,
    });
  }

  async getRideStatus(rideId: string) {
    return this.call('GET', `/rides/${rideId}/status`);
  }

  async completeRide(rideId: string, rating: number, feedback: string) {
    return this.call('POST', `/rides/${rideId}/complete`, { rating, feedback });
  }

  async getIncomingRides(driverId: string) {
    return this.call('GET', `/drivers/${driverId}/incoming-rides`);
  }

  async acceptRide(rideId: string, driverId: string | null) {
    return this.call('POST', `/rides/${rideId}/accept`, { driverId });
  }

  async updateRideProgress(rideId: string, lat: number, lng: number, progress: number) {
    return this.call('POST', `/rides/${rideId}/update-progress`, {
      latitude: lat,
      longitude: lng,
      progressPercentage: progress,
    });
  }

  async getAdminMetrics() {
    return this.call('GET', '/admin/metrics');
  }

  async detectFraud(rideId: string) {
    return this.call('GET', `/admin/fraud-detection/${rideId}`);
  }

  async getAnomalies() {
    return this.call('GET', '/admin/anomalies');
  }

  async getPredictions() {
    return this.call('GET', '/admin/ml-predictions');
  }
}

export class MapsService {
  apiKey: string;
  baseURL: string;

  constructor(apiKey = 'YOUR_GOOGLE_MAPS_API_KEY') {
    this.apiKey = apiKey;
    this.baseURL = 'https://maps.googleapis.com/maps/api';
  }

  async getDirections(origin: string, destination: string) {
    const params = new URLSearchParams({
      origin,
      destination,
      key: this.apiKey,
      mode: 'driving',
    });

    try {
      const response = await fetch(`${this.baseURL}/directions/json?${params}`);
      const data = await response.json();
      if (data.routes.length === 0) throw new Error('No route found');
      const route = data.routes[0];
      const leg = route.legs[0];
      return {
        distance: leg.distance.value / 1000,
        duration: leg.duration.value / 60,
        polyline: route.overview_polyline.points,
        steps: leg.steps,
      };
    } catch (error) {
      console.error('Maps Error:', error);
      return null;
    }
  }

  async getETA(origin: string, destination: string) {
    const directions = await this.getDirections(origin, destination);
    if (!directions) return null;
    return directions.duration;
  }

  async geocode(address: string) {
    const params = new URLSearchParams({ address, key: this.apiKey });
    try {
      const response = await fetch(`${this.baseURL}/geocode/json?${params}`);
      const data = await response.json();
      if (data.results.length === 0) return null;
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        address: data.results[0].formatted_address,
      };
    } catch (error) {
      console.error('Geocode Error:', error);
      return null;
    }
  }

  calculateDistanceVariance(expectedKm: number, actualKm: number) {
    const variance = actualKm - expectedKm;
    const percentVariance = (variance / expectedKm) * 100;
    return {
      variance,
      percentVariance,
      isSuspicious: percentVariance > 15,
      severity: percentVariance > 30 ? 'critical' : percentVariance > 15 ? 'warning' : 'normal',
    };
  }
}
