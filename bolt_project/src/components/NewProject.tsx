import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { PropertyType, ProjectPurpose } from '../types';
import { Loader2, ArrowLeft } from 'lucide-react';

type FormData = {
  name: string;
  purpose: ProjectPurpose;
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
  };
};

export function NewProject() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login', { state: { returnTo: '/projects/new' } });
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.user) {
        navigate('/login', { state: { returnTo: '/projects/new' } });
        return;
      }

      const { data: newProject, error: insertError } = await supabase
        .from('projects')
        .insert([{
          name: data.name,
          purpose: data.purpose,
          user_id: session.session.user.id,
          property_details: {
            ...data.property_details,
            photos: [],
            video_url: null,
          },
          renovation_costs: {
            items: [],
            total: 0
          },
          economic_analysis: {
            asking_price: 0,
            arv: 0,
            closing_costs: {
              value: 0,
              is_percentage: true
            },
            holding_costs: {
              value: 0,
              is_percentage: true
            },
            selling_costs: {
              value: 0,
              is_percentage: true
            },
            profit: 0
          }
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      navigate('/dashboard', { state: { newProject: true } });
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
      console.error('Error creating project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const preventWheelChange = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to My Projects
        </button>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Project</h1>
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Project Name</label>
              <input
                type="text"
                {...register("name", { required: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.name && <span className="text-red-500 text-sm">Project name is required</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Project Purpose</label>
              <select
                {...register("purpose", { required: true })}
                defaultValue="Fix-Flip"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="Fix-Flip">Fix and Flip</option>
                <option value="BRRR">BRRR (Buy, Rehab, Rent, Refinance)</option>
                <option value="Long-term Hold">Long-term Hold</option>
                <option value="New Construction">New Construction</option>
              </select>
              {errors.purpose && <span className="text-red-500 text-sm">Project purpose is required</span>}
            </div>

            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">Property Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  {...register("property_details.address", { required: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.property_details?.address && (
                  <span className="text-red-500 text-sm">Address is required</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Property Type</label>
                <select
                  {...register("property_details.property_type")}
                  defaultValue="Single Family House"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="Single Family House">Single Family House</option>
                  <option value="Duplex">Duplex</option>
                  <option value="Triplex">Triplex</option>
                  <option value="Quadplex">Quadplex</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
                  <input
                    type="number"
                    onWheel={preventWheelChange}
                    {...register("property_details.bedrooms", { required: true, min: 0 })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault();
                      }
                    }}
                  />
                  {errors.property_details?.bedrooms && (
                    <span className="text-red-500 text-sm">Valid number of bedrooms is required</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
                  <input
                    type="number"
                    step="0.5"
                    onWheel={preventWheelChange}
                    {...register("property_details.bathrooms", { required: true, min: 0 })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault();
                      }
                    }}
                  />
                  {errors.property_details?.bathrooms && (
                    <span className="text-red-500 text-sm">Valid number of bathrooms is required</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Living Area (sqft)</label>
                <input
                  type="number"
                  onWheel={preventWheelChange}
                  {...register("property_details.living_area", { required: true, min: 0 })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                      e.preventDefault();
                    }
                  }}
                />
                {errors.property_details?.living_area && (
                  <span className="text-red-500 text-sm">Valid living area is required</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Stories</label>
                <select
                  {...register("property_details.stories")}
                  defaultValue={1}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lot Size</label>
                  <input
                    type="number"
                    onWheel={preventWheelChange}
                    {...register("property_details.lot_size", { required: true, min: 0 })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault();
                      }
                    }}
                  />
                  {errors.property_details?.lot_size && (
                    <span className="text-red-500 text-sm">Valid lot size is required</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <select
                    {...register("property_details.lot_size_unit")}
                    defaultValue="sqft"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="sqft">Square Feet</option>
                    <option value="acre">Acres</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Year Built</label>
                <input
                  type="number"
                  onWheel={preventWheelChange}
                  {...register("property_details.year_built", { 
                    required: true,
                    min: 1800,
                    max: new Date().getFullYear()
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                      e.preventDefault();
                    }
                  }}
                />
                {errors.property_details?.year_built && (
                  <span className="text-red-500 text-sm">Valid year is required (1800-present)</span>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Creating...
                  </>
                ) : (
                  'Create Project'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}