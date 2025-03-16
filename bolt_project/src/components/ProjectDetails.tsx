import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Project, RenovationItem, RenovationItemType, ProjectPurpose } from '../types';
import { ArrowLeft, Home, Building2, Loader2, DollarSign, Percent } from 'lucide-react';

const BASE_RENOVATION_ITEMS: RenovationItemType[] = [
  'Foundation', 'Roof', 'Fascia', 'Exterior Siding', 'Gutter',
  'Deck/Patio/Balcony', 'Landscaping', 'Fence', 'Framing', 'Plumbing',
  'Electric', 'Structural Change', 'Interior Wall', 'Ceiling', 'Flooring',
  'Window', 'Window Trim', 'Front Door', 'Back Door', 'Interior Door',
  'Door Handles', 'Garage Door', 'Garage Door Opener', 'Garage', 'Stairs',
  'Kitchen Cabinets', 'Kitchen Countertop', 'Kitchen Lights', 'Kitchen Sink, Faucet, Disposal',
  'Dining Lights', 'Other Lights', 'Toilet', 'Alarm', 'Blinds/Curtain'
];

const PRIMARY_BEDROOM_ITEMS = [
  'Primary Bedroom Fan/Lights'
];

const NUMBERED_BEDROOM_ITEMS = [
  'Bedroom #X Fan/Lights'
];

const PRIMARY_BATHROOM_ITEMS = [
  'Primary Bathroom Tub/Shower',
  'Primary Bathroom Vanity',
  'Primary Bathroom Mirror, Light, Towel Hangers'
];

const NUMBERED_BATHROOM_ITEMS = [
  'Bathroom #X Tub/Shower',
  'Bathroom #X Vanity',
  'Bathroom #X Mirror, Light, Towel Hangers'
];

function generateBathroomItems(bathroomCount: number): string[] {
  const items: string[] = [...PRIMARY_BATHROOM_ITEMS];
  
  // Add numbered bathrooms (count - 1 since primary is already included)
  for (let i = 1; i < bathroomCount; i++) {
    NUMBERED_BATHROOM_ITEMS.forEach(item => {
      items.push(item.replace('#X', `#${i}`));
    });
  }
  
  return items;
}

function generateBedroomItems(bedroomCount: number): string[] {
  const items: string[] = [...PRIMARY_BEDROOM_ITEMS];
  
  // Add numbered bedrooms (count - 1 since primary is already included)
  for (let i = 1; i < bedroomCount; i++) {
    NUMBERED_BEDROOM_ITEMS.forEach(item => {
      items.push(item.replace('#X', `#${i}`));
    });
  }
  
  return items;
}

export function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renovationCosts, setRenovationCosts] = useState<Record<string, string>>({});
  const [economicAnalysis, setEconomicAnalysis] = useState({
    asking_price: '',
    arv: '',
    closing_costs: {
      value: '',
      is_percentage: true
    },
    holding_costs: {
      value: '',
      is_percentage: true
    },
    selling_costs: {
      value: '',
      is_percentage: true
    },
    months_to_complete: ''
  });
  const [purpose, setPurpose] = useState<ProjectPurpose>('Fix-Flip');

  const getRenovationItems = (project: Project): string[] => {
    const bathroomItems = generateBathroomItems(project.property_details.bathrooms);
    const bedroomItems = generateBedroomItems(project.property_details.bedrooms);
    return [...BASE_RENOVATION_ITEMS, ...bedroomItems, ...bathroomItems];
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setError(null);
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProject(project);
      setPurpose(project.purpose);

      // Initialize renovation costs with dynamic bathroom items
      const renovationItems = getRenovationItems(project);
      const costs: Record<string, string> = {};
      renovationItems.forEach(item => {
        const existingItem = project.renovation_costs.items.find(i => i.name === item);
        costs[item] = existingItem && existingItem.cost > 0 ? existingItem.cost.toString() : '';
      });
      setRenovationCosts(costs);

      // Initialize economic analysis
      setEconomicAnalysis({
        asking_price: project.economic_analysis.asking_price > 0 ? project.economic_analysis.asking_price.toString() : '',
        arv: project.economic_analysis.arv > 0 ? project.economic_analysis.arv.toString() : '',
        closing_costs: {
          value: project.economic_analysis.closing_costs.value > 0 ? project.economic_analysis.closing_costs.value.toString() : '',
          is_percentage: project.economic_analysis.closing_costs.is_percentage
        },
        holding_costs: {
          value: project.economic_analysis.holding_costs.value > 0 ? project.economic_analysis.holding_costs.value.toString() : '',
          is_percentage: project.economic_analysis.holding_costs.is_percentage
        },
        selling_costs: {
          value: project.economic_analysis.selling_costs.value > 0 ? project.economic_analysis.selling_costs.value.toString() : '',
          is_percentage: project.economic_analysis.selling_costs.is_percentage
        },
        months_to_complete: project.economic_analysis.months_to_complete > 0 ? project.economic_analysis.months_to_complete.toString() : ''
      });
    } catch (error: any) {
      console.error('Error fetching project:', error);
      setError(error.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const calculateRenovationTotal = () => {
    return Object.values(renovationCosts).reduce((total, cost) => {
      const value = parseFloat(cost) || 0;
      return total + value;
    }, 0);
  };

  const calculateProfit = () => {
    if (!project) return 0;

    const askingPrice = parseFloat(economicAnalysis.asking_price) || 0;
    const arv = parseFloat(economicAnalysis.arv) || 0;
    const renovationTotal = calculateRenovationTotal();

    const closingCostsValue = parseFloat(economicAnalysis.closing_costs.value) || 0;
    const holdingCostsValue = parseFloat(economicAnalysis.holding_costs.value) || 0;
    const sellingCostsValue = parseFloat(economicAnalysis.selling_costs.value) || 0;

    const closingCosts = economicAnalysis.closing_costs.is_percentage
      ? (askingPrice * closingCostsValue) / 100
      : closingCostsValue;

    const holdingCosts = economicAnalysis.holding_costs.is_percentage
      ? (askingPrice * holdingCostsValue) / 100
      : holdingCostsValue;

    const sellingCosts = economicAnalysis.selling_costs.is_percentage
      ? (arv * sellingCostsValue) / 100
      : sellingCostsValue;

    return arv - askingPrice - closingCosts - holdingCosts - sellingCosts - renovationTotal;
  };

  const calculateROI = () => {
    if (!project) return { roi: 0, annualizedRoi: 0 };

    const profit = calculateProfit();
    const askingPrice = parseFloat(economicAnalysis.asking_price) || 0;
    const renovationTotal = calculateRenovationTotal();
    const totalInvestment = askingPrice + renovationTotal;

    if (totalInvestment === 0) return { roi: 0, annualizedRoi: 0 };

    const roi = (profit / totalInvestment) * 100;
    const months = parseFloat(economicAnalysis.months_to_complete) || 12;
    const annualizedRoi = (roi / months) * 12;

    return { roi, annualizedRoi };
  };

  const saveEconomicAnalysis = async (newAnalysis: typeof economicAnalysis) => {
    if (!project) return;

    try {
      const askingPrice = parseFloat(newAnalysis.asking_price) || 0;
      const arv = parseFloat(newAnalysis.arv) || 0;
      const profit = calculateProfit();
      const { roi, annualizedRoi } = calculateROI();

      const analysisToSave = {
        ...newAnalysis,
        asking_price: askingPrice,
        arv: arv,
        profit: profit,
        roi: roi,
        annualized_roi: annualizedRoi,
        months_to_complete: parseFloat(newAnalysis.months_to_complete) || 0
      };

      const { error: updateError } = await supabase
        .from('projects')
        .update({
          economic_analysis: analysisToSave
        })
        .eq('id', project.id);

      if (updateError) throw updateError;

      setProject({
        ...project,
        economic_analysis: analysisToSave
      });
    } catch (err: any) {
      console.error('Error saving economic analysis:', err);
    }
  };

  const handleCostChange = async (item: string, value: string) => {
    if (!project) return;

    const newCosts = {
      ...renovationCosts,
      [item]: value
    };
    setRenovationCosts(newCosts);

    try {
      const items = getRenovationItems(project).map(item => ({
        name: item,
        cost: parseFloat(newCosts[item]) || 0
      }));

      const total = Object.values(newCosts).reduce((sum, cost) => sum + (parseFloat(cost) || 0), 0);

      const { error: updateError } = await supabase
        .from('projects')
        .update({
          renovation_costs: {
            items,
            total
          }
        })
        .eq('id', project.id);

      if (updateError) throw updateError;

      setProject({
        ...project,
        renovation_costs: {
          items,
          total
        }
      });

      saveEconomicAnalysis(economicAnalysis);
    } catch (err: any) {
      console.error('Error saving renovation costs:', err);
    }
  };

  const handlePurposeChange = async (newPurpose: ProjectPurpose) => {
    if (!project) return;

    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ purpose: newPurpose })
        .eq('id', project.id);

      if (updateError) throw updateError;

      setPurpose(newPurpose);
      setProject({
        ...project,
        purpose: newPurpose
      });
    } catch (err: any) {
      console.error('Error updating project purpose:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-blue-600 font-medium">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg shadow-sm">
            <p className="font-medium">{error || 'Project not found'}</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 inline-flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to My Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-8 inline-flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to My Projects
        </button>

        <div className="section-card mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {project.name}
              </h1>
              <p className="mt-2 text-gray-600">{project.property_details.address}</p>
            </div>
            {project.property_details.property_type === 'Single Family House' ? (
              <Home className="h-10 w-10 text-blue-600" />
            ) : (
              <Building2 className="h-10 w-10 text-blue-600" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-3">
            <div className="section-card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Details</h2>
              <div className="space-y-4">
                {[
                  { label: 'Type', value: project.property_details.property_type },
                  { label: 'Bedrooms', value: project.property_details.bedrooms },
                  { label: 'Bathrooms', value: project.property_details.bathrooms },
                  { label: 'Living Area', value: `${project.property_details.living_area.toLocaleString()} sqft` },
                  { label: 'Stories', value: project.property_details.stories },
                  { label: 'Lot Size', value: `${project.property_details.lot_size.toLocaleString()} ${project.property_details.lot_size_unit}` },
                  { label: 'Year Built', value: project.property_details.year_built }
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className="section-card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Economic Analysis</h2>
              <div className="space-y-6">
                <div className="economic-group">
                  <label className="economic-label">Project Purpose</label>
                  <select
                    value={purpose}
                    onChange={(e) => handlePurposeChange(e.target.value as ProjectPurpose)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="Fix-Flip">Fix and Flip</option>
                    <option value="BRRR">BRRR</option>
                    <option value="Long-term Hold">Long-term Hold</option>
                    <option value="New Construction">New Construction</option>
                  </select>
                </div>

                <div className="economic-group">
                  <label className="economic-label">Asking Price</label>
                  <div className="input-group">
                    <DollarSign className="input-icon" />
                    <input
                      type="number"
                      value={economicAnalysis.asking_price}
                      onChange={(e) => {
                        const newAnalysis = {
                          ...economicAnalysis,
                          asking_price: e.target.value
                        };
                        setEconomicAnalysis(newAnalysis);
                        saveEconomicAnalysis(newAnalysis);
                      }}
                      className="input-with-icon"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="economic-group">
                  <label className="economic-label">ARV</label>
                  <div className="input-group">
                    <DollarSign className="input-icon" />
                    <input
                      type="number"
                      value={economicAnalysis.arv}
                      onChange={(e) => {
                        const newAnalysis = {
                          ...economicAnalysis,
                          arv: e.target.value
                        };
                        setEconomicAnalysis(newAnalysis);
                        saveEconomicAnalysis(newAnalysis);
                      }}
                      className="input-with-icon"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="economic-group">
                  <label className="economic-label">Closing Costs</label>
                  <div className="economic-input-wrapper">
                    <div className="economic-input-container">
                      {economicAnalysis.closing_costs.is_percentage ? (
                        <>
                          <input
                            type="number"
                            value={economicAnalysis.closing_costs.value}
                            onChange={(e) => {
                              const newAnalysis = {
                                ...economicAnalysis,
                                closing_costs: {
                                  ...economicAnalysis.closing_costs,
                                  value: e.target.value
                                }
                              };
                              setEconomicAnalysis(newAnalysis);
                              saveEconomicAnalysis(newAnalysis);
                            }}
                            className="input-with-icon pr-10"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </>
                      ) : (
                        <>
                          <DollarSign className="input-icon" />
                          <input
                            type="number"
                            value={economicAnalysis.closing_costs.value}
                            onChange={(e) => {
                              const newAnalysis = {
                                ...economicAnalysis,
                                closing_costs: {
                                  ...economicAnalysis.closing_costs,
                                  value: e.target.value
                                }
                              };
                              setEconomicAnalysis(newAnalysis);
                              saveEconomicAnalysis(newAnalysis);
                            }}
                            className="input-with-icon"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          if (economicAnalysis.closing_costs.is_percentage) {
                            const newAnalysis = {
                              ...economicAnalysis,
                              closing_costs: {
                                ...economicAnalysis.closing_costs,
                                is_percentage: false
                              }
                            };
                            setEconomicAnalysis(newAnalysis);
                            saveEconomicAnalysis(newAnalysis);
                          }
                        }}
                        className={`cost-type-button ${
                          !economicAnalysis.closing_costs.is_percentage
                            ? 'cost-type-button-active'
                            : 'cost-type-button-inactive'
                        }`}
                      >
                        $
                      </button>
                      <button
                        onClick={() => {
                          if (!economicAnalysis.closing_costs.is_percentage) {
                            const newAnalysis = {
                              ...economicAnalysis,
                              closing_costs: {
                                ...economicAnalysis.closing_costs,
                                is_percentage: true
                              }
                            };
                            setEconomicAnalysis(newAnalysis);
                            saveEconomicAnalysis(newAnalysis);
                          }
                        }}
                        className={`cost-type-button ${
                          economicAnalysis.closing_costs.is_percentage
                            ? 'cost-type-button-active'
                            : 'cost-type-button-inactive'
                        }`}
                      >
                        %
                      </button>
                    </div>
                  </div>
                </div>

                <div className="economic-group">
                  <label className="economic-label">Holding Costs</label>
                  <div className="economic-input-wrapper">
                    <div className="economic-input-container">
                      {economicAnalysis.holding_costs.is_percentage ? (
                        <>
                          <input
                            type="number"
                            value={economicAnalysis.holding_costs.value}
                            onChange={(e) => {
                              const newAnalysis = {
                                ...economicAnalysis,
                                holding_costs: {
                                  ...economicAnalysis.holding_costs,
                                  value: e.target.value
                                }
                              };
                              setEconomicAnalysis(newAnalysis);
                              saveEconomicAnalysis(newAnalysis);
                            }}
                            className="input-with-icon pr-10"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </>
                      ) : (
                        <>
                          <DollarSign className="input-icon" />
                          <input
                            type="number"
                            value={economicAnalysis.holding_costs.value}
                            onChange={(e) => {
                              const newAnalysis = {
                                ...economicAnalysis,
                                holding_costs: {
                                  ...economicAnalysis.holding_costs,
                                  value: e.target.value
                                }
                              };
                              setEconomicAnalysis(newAnalysis);
                              saveEconomicAnalysis(newAnalysis);
                            }}
                            className="input-with-icon"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          if (economicAnalysis.holding_costs.is_percentage) {
                            const newAnalysis = {
                              ...economicAnalysis,
                              holding_costs: {
                                ...economicAnalysis.holding_costs,
                                is_percentage: false
                              }
                            };
                            setEconomicAnalysis(newAnalysis);
                            saveEconomicAnalysis(newAnalysis);
                          }
                        }}
                        className={`cost-type-button ${
                          !economicAnalysis.holding_costs.is_percentage
                            ? 'cost-type-button-active'
                            : 'cost-type-button-inactive'
                        }`}
                      >
                        $
                      </button>
                      <button
                        onClick={() => {
                          if (!economicAnalysis.holding_costs.is_percentage) {
                            const newAnalysis = {
                              ...economicAnalysis,
                              holding_costs: {
                                ...economicAnalysis.holding_costs,
                                is_percentage: true
                              }
                            };
                            setEconomicAnalysis(newAnalysis);
                            saveEconomicAnalysis(newAnalysis);
                          }
                        }}
                        className={`cost-type-button ${
                          economicAnalysis.holding_costs.is_percentage
                            ? 'cost-type-button-active'
                            : 'cost-type-button-inactive'
                        }`}
                      >
                        %
                      </button>
                    </div>
                  </div>
                </div>

                <div className="economic-group">
                  <label className="economic-label">Selling Costs</label>
                  <div className="economic-input-wrapper">
                    <div className="economic-input-container">
                      {economicAnalysis.selling_costs.is_percentage ? (
                        <>
                          <input
                            type="number"
                            value={economicAnalysis.selling_costs.value}
                            onChange={(e) => {
                              const newAnalysis = {
                                ...economicAnalysis,
                                selling_costs: {
                                  ...economicAnalysis.selling_costs,
                                  value: e.target.value
                                }
                              };
                              setEconomicAnalysis(newAnalysis);
                              saveEconomicAnalysis(newAnalysis);
                            }}
                            className="input-with-icon pr-10"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </>
                      ) : (
                        <>
                          <DollarSign className="input-icon" />
                          <input
                            type="number"
                            value={economicAnalysis.selling_costs.value}
                            onChange={(e) => {
                              const newAnalysis = {
                                ...economicAnalysis,
                                selling_costs: {
                                  ...economicAnalysis.selling_costs,
                                  value: e.target.value
                                }
                              };
                              setEconomicAnalysis(newAnalysis);
                              saveEconomicAnalysis(newAnalysis);
                            }}
                            className="input-with-icon"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          if (economicAnalysis.selling_costs.is_percentage) {
                            const newAnalysis = {
                              ...economicAnalysis,
                              selling_costs: {
                                ...economicAnalysis.selling_costs,
                                is_percentage: false
                              }
                            };
                            setEconomicAnalysis(newAnalysis);
                            saveEconomicAnalysis(newAnalysis);
                          }
                        }}
                        className={`cost-type-button ${
                          !economicAnalysis.selling_costs.is_percentage
                            ? 'cost-type-button-active'
                            : 'cost-type-button-inactive'
                        }`}
                      >
                        $
                      </button>
                      <button
                        onClick={() => {
                          if (!economicAnalysis.selling_costs.is_percentage) {
                            const newAnalysis = {
                              ...economicAnalysis,
                              selling_costs: {
                                ...economicAnalysis.selling_costs,
                                is_percentage: true
                              }
                            };
                            setEconomicAnalysis(newAnalysis);
                            saveEconomicAnalysis(newAnalysis);
                          }
                        }}
                        className={`cost-type-button ${
                          economicAnalysis.selling_costs.is_percentage
                            ? 'cost-type-button-active'
                            : 'cost-type-button-inactive'
                        }`}
                      >
                        %
                      </button>
                    </div>
                  </div>
                </div>

                <div className="economic-group">
                  <label className="economic-label">Months to Complete</label>
                  <input
                    type="number"
                    value={economicAnalysis.months_to_complete}
                    onChange={(e) => {
                      const newAnalysis = {
                        ...economicAnalysis,
                        months_to_complete: e.target.value
                      };
                      setEconomicAnalysis(newAnalysis);
                      saveEconomicAnalysis(newAnalysis);
                    }}
                    className="input-with-icon"
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                </div>

                <div className="mt-8 space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Total Profit</span>
                    <span className={`font-medium ${calculateProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${calculateProfit().toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">ROI</span>
                    <span className={`font-medium ${calculateROI().roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {calculateROI().roi.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Annualized ROI</span>
                    <span className={`font-medium ${calculateROI().annualizedRoi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {calculateROI().annualizedRoi.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <div className="section-card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Renovation Costs</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Total:</span>
                  <span className="text-xl font-bold text-blue-600">
                    ${calculateRenovationTotal().toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {getRenovationItems(project).map((item) => (
                  <div key={item} className="flex items-center justify-between space-x-4 py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-600 flex-1">{item}</span>
                    <div className="relative flex-shrink-0">
                      <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="number"
                        value={renovationCosts[item] || ''}
                        onChange={(e) => handleCostChange(item, e.target.value)}
                        className="cost-input pl-8"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}