export type PropertyType = 'Single Family House' | 'Duplex' | 'Triplex' | 'Quadplex';
export type ProjectStatus = 'active' | 'completed' | 'no_go';
export type ProjectPurpose = 'Fix-Flip' | 'BRRR' | 'Long-term Hold' | 'New Construction';

// Base renovation item types
export type BaseRenovationItemType =
  | 'Foundation'
  | 'Roof'
  | 'Fascia'
  | 'Exterior Siding'
  | 'Gutter'
  | 'Deck/Patio/Balcony'
  | 'Landscaping'
  | 'Fence'
  | 'Framing'
  | 'Plumbing'
  | 'Electric'
  | 'Structural Change'
  | 'Interior Wall'
  | 'Ceiling'
  | 'Flooring'
  | 'Window'
  | 'Window Trim'
  | 'Front Door'
  | 'Back Door'
  | 'Interior Door'
  | 'Door Handles'
  | 'Garage Door'
  | 'Garage Door Opener'
  | 'Garage'
  | 'Stairs'
  | 'Kitchen Cabinets'
  | 'Kitchen Countertop'
  | 'Kitchen Lights'
  | 'Kitchen Sink, Faucet, Disposal'
  | 'Dining Lights'
  | 'Other Lights'
  | 'Toilet'
  | 'Alarm'
  | 'Blinds/Curtain';

// Primary bedroom items
export type PrimaryBedroomItemType =
  | 'Primary Bedroom Fan/Lights';

// Allow for numbered bedroom items (up to 9 bedrooms for type safety)
export type NumberedBedroomItemType =
  | 'Bedroom #1 Fan/Lights'
  | 'Bedroom #2 Fan/Lights'
  | 'Bedroom #3 Fan/Lights'
  | 'Bedroom #4 Fan/Lights'
  | 'Bedroom #5 Fan/Lights'
  | 'Bedroom #6 Fan/Lights'
  | 'Bedroom #7 Fan/Lights'
  | 'Bedroom #8 Fan/Lights'
  | 'Bedroom #9 Fan/Lights';

// Primary bathroom items
export type PrimaryBathroomItemType =
  | 'Primary Bathroom Tub/Shower'
  | 'Primary Bathroom Vanity'
  | 'Primary Bathroom Mirror, Light, Towel Hangers';

// Allow for numbered bathroom items (up to 9 bathrooms for type safety)
export type NumberedBathroomItemType =
  | 'Bathroom #1 Tub/Shower'
  | 'Bathroom #1 Vanity'
  | 'Bathroom #1 Mirror, Light, Towel Hangers'
  | 'Bathroom #2 Tub/Shower'
  | 'Bathroom #2 Vanity'
  | 'Bathroom #2 Mirror, Light, Towel Hangers'
  | 'Bathroom #3 Tub/Shower'
  | 'Bathroom #3 Vanity'
  | 'Bathroom #3 Mirror, Light, Towel Hangers'
  | 'Bathroom #4 Tub/Shower'
  | 'Bathroom #4 Vanity'
  | 'Bathroom #4 Mirror, Light, Towel Hangers'
  | 'Bathroom #5 Tub/Shower'
  | 'Bathroom #5 Vanity'
  | 'Bathroom #5 Mirror, Light, Towel Hangers'
  | 'Bathroom #6 Tub/Shower'
  | 'Bathroom #6 Vanity'
  | 'Bathroom #6 Mirror, Light, Towel Hangers'
  | 'Bathroom #7 Tub/Shower'
  | 'Bathroom #7 Vanity'
  | 'Bathroom #7 Mirror, Light, Towel Hangers'
  | 'Bathroom #8 Tub/Shower'
  | 'Bathroom #8 Vanity'
  | 'Bathroom #8 Mirror, Light, Towel Hangers'
  | 'Bathroom #9 Tub/Shower'
  | 'Bathroom #9 Vanity'
  | 'Bathroom #9 Mirror, Light, Towel Hangers';

// Combined type for all renovation items
export type RenovationItemType = BaseRenovationItemType | PrimaryBedroomItemType | NumberedBedroomItemType | PrimaryBathroomItemType | NumberedBathroomItemType;

export interface RenovationItem {
  id: string;
  project_id: string;
  description: string;
  cost: number;
  created_at: string;
}

export interface LongTermHoldAnalysis {
  sales_price: number;
  loan_amount: {
    value: number;
    is_percentage: boolean;
  };
  interest_rate: number;
  monthly_mortgage: number;
  closing_costs: {
    value: number;
    is_percentage: boolean;
  };
  renovation_cost: number;
  initial_investment: number;
  monthly_rent: number;
  vacancy_months: number;
  annual_property_tax: number;
  annual_hoa: number;
  annual_insurance: number;
  annual_maintenance: number;
  appreciation: number;
  cash_flow: number;
  cash_roi: number;
  total_roi: number;
}

export interface FlipAnalysis {
  asking_price: number;
  arv: number;
  closing_costs: {
    value: number;
    is_percentage: boolean;
  };
  holding_costs: {
    value: number;
    is_percentage: boolean;
  };
  selling_costs: {
    value: number;
    is_percentage: boolean;
  };
  months_to_complete: number;
  profit: number;
  roi: number;
  annualized_roi: number;
}

export interface Project {
  id: string;
  user_id: string;
  created_at: string;
  name: string;
  purpose: ProjectPurpose;
  status: ProjectStatus;
  completion_date?: string;
  property_details: {
    address: string;
    property_type: PropertyType;
    bedrooms: number;
    bathrooms: number;
    living_area: number;
    stories: 1 | 2 | 3;
    lot_size: number;
    lot_size_unit: 'sqft' | 'acre';
    year_built: number;
    photos: string[];
    video_url?: string;
  };
  renovation_costs: {
    items: Array<{
      id: string;
      name: string;
      cost: number;
    }>;
    total: number;
  };
  economic_analysis: FlipAnalysis | LongTermHoldAnalysis;
}