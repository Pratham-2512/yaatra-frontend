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

